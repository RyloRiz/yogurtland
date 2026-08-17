// Encodes/decodes the current search (zip + selected flavor ids) to and from
// the URL, so a search can be bookmarked or shared. Read once on mount via
// window.location, and written back with history.replaceState -- there's no
// server involved, so a full Next router navigation would be overkill.

export type SearchState = {
  zip: string;
  flavorIds: number[];
};

export function readSearchStateFromLocation(): SearchState {
  if (typeof window === "undefined") return { zip: "", flavorIds: [] };

  const params = new URLSearchParams(window.location.search);
  const zip = params.get("zip") ?? "";
  const flavorsParam = params.get("flavors") ?? "";
  const flavorIds = flavorsParam
    .split(",")
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);

  return { zip, flavorIds };
}

export function writeSearchStateToLocation(state: SearchState) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  if (state.zip) params.set("zip", state.zip);
  if (state.flavorIds.length > 0) {
    params.set("flavors", [...state.flavorIds].sort((a, b) => a - b).join(","));
  }

  const query = params.toString();
  const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}
