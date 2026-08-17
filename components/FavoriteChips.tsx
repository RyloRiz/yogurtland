"use client";

import { useState } from "react";
import { formatFavoriteLabel, type FavoriteSearch } from "@/lib/favorites";
import type { Flavor } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";

type FavoriteChipsProps = {
  favorites: FavoriteSearch[];
  flavorsById: Map<number, Flavor>;
  activeId: string | null;
  onApply: (favorite: FavoriteSearch) => void;
  onRemove: (id: string) => void;
};

export default function FavoriteChips({ favorites, flavorsById, activeId, onApply, onRemove }: FavoriteChipsProps) {
  const [pendingRemove, setPendingRemove] = useState<FavoriteSearch | null>(null);

  if (favorites.length === 0) return null;

  return (
    <>
      <ul className="mt-3 flex flex-wrap gap-2">
        {favorites.map((favorite) => {
          const isActive = favorite.id === activeId;
          return (
            <li
              key={favorite.id}
              className={`flex items-center gap-1 rounded-full border-2 py-1 pl-1 pr-3 text-sm ${
                isActive ? "border-magenta bg-magenta text-white" : "border-line bg-surface text-ink"
              }`}
            >
              <button
                type="button"
                onClick={() => setPendingRemove(favorite)}
                aria-label={`Remove ${formatFavoriteLabel(favorite, flavorsById)} from favorites`}
                className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full ${
                  isActive ? "text-white hover:bg-white/20" : "text-ink-muted hover:bg-muted hover:text-error"
                }`}
              >
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                  <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onApply(favorite)}
                className={`cursor-pointer ${isActive ? "text-white" : "text-ink hover:text-magenta"}`}
              >
                {formatFavoriteLabel(favorite, flavorsById)}
              </button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove this favorite?"
        description={pendingRemove ? formatFavoriteLabel(pendingRemove, flavorsById) : undefined}
        confirmLabel="Remove"
        onConfirm={() => {
          if (pendingRemove) onRemove(pendingRemove.id);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
}
