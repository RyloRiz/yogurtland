// Shapes of the static snapshot files under public/data/. Kept separate from
// scripts/ingest.ts (which produces those files) so nothing from the Node
// ingestion script -- fs, process, etc. -- ever ends up in the client bundle.

export type StoreHours = {
  isActive: boolean;
  from: string; // "HH:MM", 24-hour
  till: string; // "HH:MM", 24-hour
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
  hours: StoreHours[]; // index 0 = Sunday ... 6 = Saturday
  hoursMessage: string;
  orderUrl: string;
  flavorIds: number[];
  // True when the upstream feed gave us no usable flavor data for this store
  // on the latest ingest run, and flavorIds was carried over from the previous
  // snapshot instead. Internal signal only -- not surfaced in the UI. A stale
  // store's flavor list may be out of date; a consumer that cares can treat
  // this as a cue to check the store's own page on yogurtland.com directly.
  stale: boolean;
};

export type Flavor = {
  id: number;
  name: string;
  description: string;
  contains: string;
};

export type Meta = {
  generatedAt: string;
  storeCount: number;
  flavorCount: number;
  source: string;
};

export type StoreResult = Store & {
  distanceMi: number;
};
