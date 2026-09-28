// Lazy, memoized loaders for the static snapshot files. Each file is fetched
// at most once per page load and cached in module scope, so every component
// that needs the store list or flavor catalog can just call these directly.

import type { Flavor, Meta, Store } from "./types";

let storesPromise: Promise<Store[]> | null = null;
let flavorsPromise: Promise<Flavor[]> | null = null;
let metaPromise: Promise<Meta> | null = null;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function loadMeta(): Promise<Meta> {
  if (!metaPromise) {
    metaPromise = fetchJson<Meta>("/data/meta.json", { cache: "no-store" });
  }
  return metaPromise;
}

export async function loadStores(): Promise<Store[]> {
  if (!storesPromise) {
    const meta = await loadMeta();
    storesPromise = fetchJson<Store[]>(`/data/stores.json?v=${encodeURIComponent(meta.generatedAt)}`);
  }
  return storesPromise;
}

export async function loadFlavors(): Promise<Flavor[]> {
  if (!flavorsPromise) {
    const meta = await loadMeta();
    flavorsPromise = fetchJson<Flavor[]>(`/data/flavors.json?v=${encodeURIComponent(meta.generatedAt)}`);
  }
  return flavorsPromise;
}
