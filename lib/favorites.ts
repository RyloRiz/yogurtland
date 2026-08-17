// Saved zip/flavor search combos, kept in localStorage so a favorite is a
// one-tap way to re-run a search -- no account or server involved, matching
// the rest of the app's fully client-side design.

import type { Flavor } from "./types";

const STORAGE_KEY = "yogurtland-favorites";
const MAX_FAVORITES = 12;

export type FavoriteSearch = {
  id: string;
  zip: string;
  flavorIds: number[];
  createdAt: string;
};

export function loadFavorites(): FavoriteSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteSearch[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistFavorites(favorites: FavoriteSearch[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.slice(0, MAX_FAVORITES)));
  } catch {
    // Storage unavailable (private browsing quota, etc.) -- favoriting just
    // won't persist across reloads, which isn't worth surfacing an error for.
  }
}

export function sameSearch(a: { zip: string; flavorIds: number[] }, b: { zip: string; flavorIds: number[] }) {
  if (a.zip !== b.zip) return false;
  if (a.flavorIds.length !== b.flavorIds.length) return false;
  const setB = new Set(b.flavorIds);
  return a.flavorIds.every((id) => setB.has(id));
}

export function formatFavoriteLabel(favorite: FavoriteSearch, flavorsById: Map<number, Flavor>): string {
  if (favorite.flavorIds.length === 0) return favorite.zip;

  const names = favorite.flavorIds.map((id) => flavorsById.get(id)?.name).filter((n): n is string => Boolean(n));
  const shown = names.slice(0, 2).join(", ");
  const rest = names.length - 2;
  return `${favorite.zip} · ${shown}${rest > 0 ? ` +${rest}` : ""}`;
}
