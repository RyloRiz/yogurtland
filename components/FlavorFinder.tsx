"use client";

import { useEffect, useMemo, useState } from "react";
import { loadFlavors, loadMeta, loadStores } from "@/lib/data";
import { loadFavorites, persistFavorites, sameSearch, type FavoriteSearch } from "@/lib/favorites";
import { loadZipCentroids, lookupZip } from "@/lib/geo";
import { MAX_DISTANCE_MI, findMatches } from "@/lib/query";
import type { Flavor, Meta, Store } from "@/lib/types";
import { readSearchStateFromLocation, writeSearchStateToLocation } from "@/lib/url";
import FavoriteChips from "./FavoriteChips";
import FlavorCombobox from "./FlavorCombobox";
import LoadMoreButton from "./LoadMoreButton";
import ResultCard from "./ResultCard";
import SwirlBar from "./SwirlBar";
import ZipInput from "./ZipInput";
import Link from "next/link";

const PAGE_SIZE = 15;

export default function FlavorFinder() {
  const [stores, setStores] = useState<Store[] | null>(null);
  const [flavors, setFlavors] = useState<Flavor[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [zipCentroids, setZipCentroids] = useState<Record<string, [number, number]> | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [zip, setZip] = useState("");
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteSearch[]>([]);

  // Load the snapshot once on mount, then apply any zip/flavors already in
  // the URL. Both happen inside the same callback (rather than directly in
  // the effect body) so the initial client render still matches the server's
  // empty-state markup, and only updates once this callback fires.
  useEffect(() => {
    Promise.all([loadStores(), loadFlavors(), loadMeta(), loadZipCentroids()])
      .then(([s, f, m, z]) => {
        setStores(s);
        setFlavors(f);
        setMeta(m);
        setZipCentroids(z);
        setFavorites(loadFavorites());

        const state = readSearchStateFromLocation();
        if (state.zip) setZip(state.zip);
        if (state.flavorIds.length > 0) setSelectedFlavorIds(state.flavorIds);
        setHydrated(true);
      })
      .catch(() => setLoadError(true));
  }, []);

  // Keep the URL in sync with the current search so it can be shared.
  useEffect(() => {
    if (!hydrated) return;
    writeSearchStateToLocation({ zip, flavorIds: selectedFlavorIds });
  }, [hydrated, zip, selectedFlavorIds]);

  const origin = useMemo(() => {
    if (zip.length !== 5 || !zipCentroids) return null;
    return lookupZip(zip, zipCentroids);
  }, [zip, zipCentroids]);

  const zipStatus: "idle" | "valid" | "not-found" =
    zip.length < 5 ? "idle" : origin ? "valid" : "not-found";

  const results = useMemo(() => {
    if (!stores || !origin) return [];
    return findMatches(stores, origin, new Set(selectedFlavorIds));
  }, [stores, origin, selectedFlavorIds]);

  const visible = results.slice(0, page * PAGE_SIZE);

  const flavorsById = useMemo(() => new Map((flavors ?? []).map((f) => [f.id, f])), [flavors]);

  const currentFavorite =
    zipStatus === "valid" ? favorites.find((f) => sameSearch(f, { zip, flavorIds: selectedFlavorIds })) : undefined;

  function handleToggleFavorite() {
    if (zipStatus !== "valid") return;
    setFavorites((prev) => {
      const next = currentFavorite
        ? prev.filter((f) => f.id !== currentFavorite.id)
        : [
            { id: crypto.randomUUID(), zip, flavorIds: selectedFlavorIds, createdAt: new Date().toISOString() },
            ...prev,
          ];
      persistFavorites(next);
      return next;
    });
  }

  function handleApplyFavorite(favorite: FavoriteSearch) {
    setZip(favorite.zip);
    setSelectedFlavorIds(favorite.flavorIds);
    setPage(1);
  }

  function handleRemoveFavorite(id: string) {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      persistFavorites(next);
      return next;
    });
  }

  function handleToggleFlavor(id: number) {
    setSelectedFlavorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPage(1);
  }

  function handleRemoveFlavor(id: number) {
    setSelectedFlavorIds((prev) => prev.filter((x) => x !== id));
    setPage(1);
  }

  function handleZipChange(value: string) {
    setZip(value);
    setPage(1);
  }

  function handleClearSearch() {
    setZip("");
    setSelectedFlavorIds([]);
    setPage(1);
  }

  const isDataReady = Boolean(stores && flavors && zipCentroids);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-10 sm:px-8">
      <header className="mb-8">
        <h1 className="text-4xl font-light sm:text-5xl">
          <span className="text-magenta">Flavor</span> <span className="text-green">Finder</span>
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-muted">
          Enter your ZIP code and pick the flavors you want. We&rsquo;ll show every nearby Yogurtland
          that has all of them, right now.
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-5 bg-bg/90 px-5 pb-5 pt-1 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ZipInput value={zip} onChange={handleZipChange} status={zipStatus} />
          {flavors && (
            <FlavorCombobox
              flavors={flavors}
              selectedIds={selectedFlavorIds}
              onToggle={handleToggleFlavor}
              onRemove={handleRemoveFlavor}
            />
          )}
          <div className="flex shrink-0 gap-2">
            <div>
              <span className="mb-1.5 hidden text-sm font-medium sm:block" aria-hidden>
                &nbsp;
              </span>
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={zipStatus !== "valid"}
                aria-pressed={Boolean(currentFavorite)}
                aria-label={currentFavorite ? "Remove this search from favorites" : "Save this search"}
                title={currentFavorite ? "Remove this search from favorites" : "Save this search"}
                className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  currentFavorite
                    ? "border-magenta bg-magenta text-white"
                    : "border-line bg-surface text-ink-muted hover:border-magenta hover:text-magenta"
                }`}
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill={currentFavorite ? "currentColor" : "none"}>
                  <path
                    d="M10 2.5l2.35 4.76 5.25.77-3.8 3.7.9 5.23L10 14.5l-4.7 2.46.9-5.23-3.8-3.7 5.25-.77L10 2.5z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <div>
              <span className="mb-1.5 hidden text-sm font-medium sm:block" aria-hidden>
                &nbsp;
              </span>
              <button
                type="button"
                onClick={handleClearSearch}
                disabled={zip === "" && selectedFlavorIds.length === 0}
                aria-label="Clear search"
                title="Clear search"
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-line bg-surface text-ink-muted transition-colors hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M4 7h16M9 7V4.6c0-.88.72-1.6 1.6-1.6h2.8c.88 0 1.6.72 1.6 1.6V7M6 7l.9 12.1A2 2 0 008.9 21h6.2a2 2 0 002-1.9L18 7M10.5 11v6M13.5 11v6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <SwirlBar flavorIds={selectedFlavorIds} />
        </div>
        <FavoriteChips
          favorites={favorites}
          flavorsById={flavorsById}
          activeId={currentFavorite?.id ?? null}
          onApply={handleApplyFavorite}
          onRemove={handleRemoveFavorite}
        />
      </div>

      <main className="mt-2 flex-1">
        {loadError && (
          <p className="rounded-[10px] border-2 border-error/30 bg-error/10 px-4 py-3 text-sm text-ink">
            We couldn&rsquo;t load flavor data. Check your connection and refresh the page.
          </p>
        )}

        {!loadError && !isDataReady && (
          <p className="py-16 text-center text-sm text-ink-muted">Loading today&rsquo;s flavors...</p>
        )}

        {!loadError && isDataReady && zipStatus === "idle" && (
          <p className="py-16 text-center text-sm text-ink-muted">
            Enter a ZIP code above to find stores near you.
          </p>
        )}

        {!loadError && isDataReady && zipStatus === "valid" && results.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-muted">
            {selectedFlavorIds.length > 0
              ? `No stores within ${MAX_DISTANCE_MI} miles of ${zip} currently carry all ${selectedFlavorIds.length} selected flavors. Try removing one.`
              : `No open stores within ${MAX_DISTANCE_MI} miles of ${zip}.`}
          </p>
        )}

        {!loadError && isDataReady && zipStatus === "valid" && results.length > 0 && (
          <>
            <p className="mb-4 text-sm text-ink-muted">
              <span className="font-semibold text-magenta">{results.length}</span> store
              {results.length === 1 ? "" : "s"} near {zip}
              {selectedFlavorIds.length > 0 ? " have everything you picked." : "."}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((store) => (
                <ResultCard
                  key={store.id}
                  store={store}
                  selectedFlavorIds={selectedFlavorIds}
                  flavorsById={flavorsById}
                />
              ))}
            </div>
            <LoadMoreButton
              shownCount={visible.length}
              totalCount={results.length}
              onClick={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </main>

      {meta && (
        <footer className="mt-12 text-center text-xs text-ink-muted">
          Flavors updated {new Date(meta.generatedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
          {" · "}
          Built by <Link href="https://rizwaan.dev" className="text-ink hover:brightness-150 transition-all duration-150">Rizwaan Bana</Link>. Not affiliated with Yogurtland.
        </footer>
      )}
    </div>
  );
}
