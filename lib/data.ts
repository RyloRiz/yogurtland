// Lazy, memoized loaders for the static snapshot files. Each file is fetched
// at most once per page load and cached in module scope, so every component
// that needs the store list or flavor catalog can just call these directly.

import type { Flavor, Meta, Store } from "./types";

let storesPromise: Promise<Store[]> | null = null;
let flavorsPromise: Promise<Flavor[]> | null = null;
let metaPromise: Promise<Meta> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return (await res.json()) as T;
}

export function loadStores(): Promise<Store[]> {
  if (!storesPromise) {
    storesPromise = fetchJson<Store[]>("/data/stores.json");
  }
  return storesPromise;
}

export function loadFlavors(): Promise<Flavor[]> {
  if (!flavorsPromise) {
    flavorsPromise = fetchJson<Flavor[]>("/data/flavors.json");
  }
  return flavorsPromise;
}

export function loadMeta(): Promise<Meta> {
  if (!metaPromise) {
    metaPromise = fetchJson<Meta>("/data/meta.json");
  }
  return metaPromise;
}
