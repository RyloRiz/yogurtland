// The core matching logic: given the full store list, an origin point, and a
// set of flavors the shopper wants, find every store that carries ALL of
// them, nearest first. Pure and synchronous -- with ~120 stores this runs in
// well under a millisecond, which is what makes "instant" possible.

import { haversineMiles } from "./geo";
import type { Store, StoreResult } from "./types";

// Beyond this, "nearest store" stops being a useful answer -- better to say
// so plainly than to hand back a technically-correct result three states away.
export const MAX_DISTANCE_MI = 100;

export function findMatches(
  stores: Store[],
  origin: [number, number],
  selectedFlavorIds: ReadonlySet<number>,
): StoreResult[] {
  const selected = Array.from(selectedFlavorIds);

  const matches = stores.filter((store) => {
    if (selected.length === 0) return true;
    return selected.every((id) => store.flavorIds.includes(id));
  });

  return matches
    .map((store) => ({ ...store, distanceMi: haversineMiles(origin, [store.lat, store.lng]) }))
    .filter((store) => store.distanceMi <= MAX_DISTANCE_MI)
    .sort((a, b) => a.distanceMi - b.distanceMi);
}
