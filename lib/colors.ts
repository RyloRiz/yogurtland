// A small "swirl" palette, one hue per flavor, assigned deterministically by
// flavor id. Used for the combobox dots, selected chips, result card chips,
// and the live swirl bar -- the one visual thread tying the whole UI together
// instead of relying on flavor photography we don't have a reliable source for.

// Anchored on Yogurtland's own two brand colors (green, magenta), rounded
// out with punchier froyo-topping hues so a multi-flavor swirl reads varied.
export const SWIRL_PALETTE = [
  { bg: "#36820D", text: "#FFFFFF" }, // brand green
  { bg: "#A12265", text: "#FFFFFF" }, // brand magenta
  { bg: "#E38B29", text: "#FFFFFF" }, // mango
  { bg: "#3D6FD9", text: "#FFFFFF" }, // blueberry
  { bg: "#7A4FB5", text: "#FFFFFF" }, // taro
  { bg: "#C99A2E", text: "#2A2113" }, // vanilla
  { bg: "#7A4A2E", text: "#FFFFFF" }, // chocolate
  { bg: "#1E9E8B", text: "#FFFFFF" }, // matcha
] as const;

// Deterministic, well-distributed hash so consecutive flavor ids don't land
// on adjacent (similar) palette entries.
function hashId(id: number): number {
  let h = id * 2654435761;
  h = h ^ (h >>> 13);
  return Math.abs(h);
}

export function flavorColor(id: number): { bg: string; text: string } {
  return SWIRL_PALETTE[hashId(id) % SWIRL_PALETTE.length];
}
