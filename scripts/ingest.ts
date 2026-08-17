// Daily data snapshot builder for the Flavor Finder.
//
// Pulls the full US store directory (with each store's current flavor lineup)
// from Yogurtland's public locations API and writes compact JSON files into
// public/data/. Those files are what the client app reads at runtime -- this
// script never runs in the browser, only in CI (see .github/workflows/snapshot.yml)
// or locally via `pnpm ingest`.
//
// Endpoint reverse-engineered from the public flavorfinder page's own script:
// GET https://www.yogurtland.com/api/1.1/locations/search.json?page=N&limit=M
// header X-Api-Key: QeKEiECfiACR (the same key their own site ships to the browser).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://www.yogurtland.com/api/1.1/locations/search.json";
const API_KEY = "QeKEiECfiACR"; // public key shipped to the browser, not a secret lmfao
const PAGE_LIMIT = 200;
const MAX_PAGES = 20; // safety cap, well above the ~1-2 pages this chain needs
const MIN_STORE_COUNT = 100; // guardrail: bail rather than commit a broken snapshot
const OUT_DIR = path.join(process.cwd(), "public", "data");

type RawLocation = {
  id: string;
  status: string;
  name: string;
  address: string;
  address_2: string;
  city: string;
  state_code: string;
  postal_code: string;
  country_code: string;
  latitude: string;
  longitude: string;
  phone: string;
  timezone: string;
  hours_json: string;
  hours_message: string;
  flavors: string;
  olo_identifier: string;
};

type RawFlavor = {
  id: string;
  name: string;
  description: string;
  contains: string;
};

type RawEntry = {
  Location: RawLocation;
  Flavor: RawFlavor[];
};

type RawResponse = {
  locations: RawEntry[];
  has_more: boolean;
};

export type StoreHours = {
  isActive: boolean;
  from: string;
  till: string;
};

export type Store = {
  id: number;
  name: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  timezone: string;
  hours: StoreHours[];
  hoursMessage: string;
  orderUrl: string;
  flavorIds: number[];
};

export type Flavor = {
  id: number;
  name: string;
  description: string;
  contains: string;
};

async function fetchPage(page: number): Promise<RawResponse> {
  const url = `${API_BASE}?page=${page}&limit=${PAGE_LIMIT}`;
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "X-Api-Key": API_KEY, Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`page ${page} responded ${res.status}`);
      }
      const data = (await res.json()) as RawResponse;
      if (!Array.isArray(data.locations)) {
        throw new Error(`page ${page} returned no locations array`);
      }
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastError;
}

// Location.flavors is the raw 16-handle machine layout, not a flavor list:
// "0" marks an empty handle, and the same flavor sometimes fills two handles
// on either side of the swirl divider. Dedupe and drop empties so this
// matches the resolved Flavor array the API already sends alongside it.
function parseFlavorIds(raw: string): number[] {
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw) as string[];
    const numeric = ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
    return Array.from(new Set(numeric));
  } catch {
    return [];
  }
}

function parseHours(raw: string): StoreHours[] {
  try {
    const parsed = JSON.parse(raw) as {
      isActive: boolean;
      timeFrom: string;
      timeTill: string;
    }[];
    return parsed.map((d) => ({
      isActive: Boolean(d.isActive),
      from: d.timeFrom,
      till: d.timeTill,
    }));
  } catch {
    return [];
  }
}

async function main() {
  console.log("Fetching Yogurtland store directory...");
  const entries: RawEntry[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await fetchPage(page);
    entries.push(...data.locations);
    console.log(`  page ${page}: ${data.locations.length} locations (running total ${entries.length})`);
    if (!data.has_more) break;
  }

  const stores: Store[] = [];
  const flavorMap = new Map<number, Flavor>();

  for (const entry of entries) {
    const loc = entry.Location;
    if (!loc) continue;
    if (loc.country_code !== "US") continue;
    if (loc.status !== "Open") continue;

    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const flavorIds = parseFlavorIds(loc.flavors);
    if (flavorIds.length === 0) continue;

    stores.push({
      id: Number(loc.id),
      name: loc.name,
      address: loc.address,
      address2: loc.address_2 ?? "",
      city: loc.city,
      state: loc.state_code,
      zip: loc.postal_code,
      lat,
      lng,
      phone: loc.phone ?? "",
      timezone: loc.timezone,
      hours: parseHours(loc.hours_json),
      hoursMessage: loc.hours_message ?? "",
      orderUrl: loc.olo_identifier ?? "",
      flavorIds,
    });

    for (const f of entry.Flavor ?? []) {
      const id = Number(f.id);
      if (!Number.isFinite(id) || flavorMap.has(id)) continue;
      flavorMap.set(id, {
        id,
        name: f.name,
        description: f.description ?? "",
        contains: f.contains ?? "",
      });
    }
  }

  if (stores.length < MIN_STORE_COUNT) {
    throw new Error(
      `Only found ${stores.length} open US stores with flavors set (expected at least ${MIN_STORE_COUNT}). ` +
        `Refusing to write a snapshot -- upstream API shape may have changed.`,
    );
  }

  const flavors = Array.from(flavorMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  // Sanity check against the previous snapshot's meta.json, if any, so a bad
  // scrape never silently halves the dataset without at least a warning.
  try {
    const prevMetaRaw = await readFile(path.join(OUT_DIR, "meta.json"), "utf-8");
    const prevMeta = JSON.parse(prevMetaRaw) as { storeCount: number };
    if (stores.length < prevMeta.storeCount * 0.7) {
      console.warn(
        `Warning: store count dropped from ${prevMeta.storeCount} to ${stores.length}. Check the upstream feed.`,
      );
    }
  } catch {
    // no previous snapshot to compare against, nothing to do
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "stores.json"), JSON.stringify(stores));
  await writeFile(path.join(OUT_DIR, "flavors.json"), JSON.stringify(flavors));

  const meta = {
    generatedAt: new Date().toISOString(),
    storeCount: stores.length,
    flavorCount: flavors.length,
    source: "https://www.yogurtland.com/api/1.1/locations/search.json",
  };
  await writeFile(path.join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2));

  console.log(`Wrote ${stores.length} stores and ${flavors.length} flavors to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
