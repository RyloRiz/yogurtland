"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { flavorColor } from "@/lib/colors";
import type { Flavor } from "@/lib/types";

type FlavorComboboxProps = {
  flavors: Flavor[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onRemove: (id: number) => void;
};

export default function FlavorCombobox({
  flavors,
  selectedIds,
  onToggle,
  onRemove,
}: FlavorComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedFlavors = useMemo(
    () => selectedIds.map((id) => flavors.find((f) => f.id === id)).filter((f): f is Flavor => Boolean(f)),
    [selectedIds, flavors],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flavors;
    return flavors.filter((f) => f.name.toLowerCase().includes(q));
  }, [flavors, query]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const flavor = filtered[activeIndex];
      if (flavor) {
        onToggle(flavor.id);
        setQuery("");
        setActiveIndex(0);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === "Backspace" && query === "" && selectedIds.length > 0) {
      onRemove(selectedIds[selectedIds.length - 1]);
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <label htmlFor="flavor-search" className="mb-1.5 block text-sm font-medium text-ink-muted">
        Flavors
      </label>

      <div className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-[10px] border-2 border-line bg-surface px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-[color:var(--accent-ring)] focus-within:ring-offset-2 focus-within:ring-offset-bg">
        {selectedFlavors.map((f) => {
          const c = flavorColor(f.id);
          return (
            <span
              key={f.id}
              className="flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1.5 text-sm font-medium"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              {f.name}
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                aria-label={`Remove ${f.name}`}
                className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-black/15"
              >
                <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                  <path
                    d="M2 2L10 10M10 2L2 10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </span>
          );
        })}

        <input
          ref={inputRef}
          id="flavor-search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selectedFlavors.length === 0 ? "Search flavors..." : "Add another..."}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-[15px] text-ink outline-none placeholder:text-ink-muted"
        />
      </div>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-[10px] border-2 border-line bg-surface p-1.5 shadow-lg shadow-black/5"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-ink-muted">No flavors match &ldquo;{query}&rdquo;.</li>
          )}
          {filtered.map((f, i) => {
            const isSelected = selectedSet.has(f.id);
            const isActive = i === activeIndex;
            const c = flavorColor(f.id);
            return (
              <li key={f.id} role="option" aria-selected={isSelected} id={`${listboxId}-${f.id}`}>
                <button
                  type="button"
                  onClick={() => {
                    onToggle(f.id);
                    setQuery("");
                    setActiveIndex(0);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left ${
                    isActive ? "bg-muted" : ""
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.bg }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-ink">{f.name}</span>
                    {f.contains && (
                      <span className="block truncate text-xs text-ink-muted">Contains {f.contains}</span>
                    )}
                  </span>
                  {isSelected && (
                    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-ink" fill="none">
                      <path
                        d="M3 8.5L6.5 12L13 4.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
