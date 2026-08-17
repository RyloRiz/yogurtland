"use client";

import { flavorColor } from "@/lib/colors";
import { getStoreStatus, type StorePhase } from "@/lib/hours";
import type { Flavor, StoreResult } from "@/lib/types";

type ResultCardProps = {
  store: StoreResult;
  selectedFlavorIds: number[];
  flavorsById: Map<number, Flavor>;
};

function Dot({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />;
}

const STATUS_DOT_CLASS: Record<StorePhase, string> = {
  open: "bg-green",
  "closing-soon": "bg-orange",
  closed: "bg-error",
};

const STATUS_TEXT_CLASS: Record<StorePhase, string> = {
  open: "text-ink",
  "closing-soon": "text-orange",
  closed: "text-ink-muted",
};

export default function ResultCard({ store, selectedFlavorIds, flavorsById }: ResultCardProps) {
  const status = getStoreStatus(store);

  const highlightedIds = selectedFlavorIds.length > 0 ? selectedFlavorIds : store.flavorIds.slice(0, 6);
  const highlighted = highlightedIds
    .map((id) => flavorsById.get(id))
    .filter((f): f is Flavor => Boolean(f));
  const remainingCount = store.flavorIds.length - highlighted.length;
  const remaining = store.flavorIds
    .filter((id) => !highlightedIds.includes(id))
    .map((id) => flavorsById.get(id))
    .filter((f): f is Flavor => Boolean(f));

  const digitsOnlyPhone = store.phone.replace(/[^0-9+]/g, "");
  // Apple Maps deep link (maps.apple.com) so tapping "Directions" opens the
  // native Maps app on iOS/macOS instead of bouncing through a Google web view.
  const directionsUrl = `https://maps.apple.com/?daddr=${store.lat},${store.lng}&q=${encodeURIComponent(
    store.name,
  )}&dirflg=d`;

  return (
    <article className="flex flex-col rounded-[10px] border-2 border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl leading-snug font-light text-ink">{store.name}</h3>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-ink-muted">
          {store.distanceMi.toFixed(1)} mi
        </span>
      </div>

      <p className="mt-1 text-sm text-ink-muted">
        {store.address}
        {store.address2 ? `, ${store.address2}` : ""}
        <br />
        {store.city}, {store.state} {store.zip}
      </p>

      <div className="mt-2.5 flex items-center gap-1.5 text-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_CLASS[status.phase]}`} aria-hidden />
        <span className={STATUS_TEXT_CLASS[status.phase]}>{status.label}</span>
      </div>

      {highlighted.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {highlighted.map((f) => {
            const c = flavorColor(f.id);
            return (
              <li
                key={f.id}
                className="flex items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-xs font-medium"
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                <Dot color={c.text} />
                {f.name}
              </li>
            );
          })}
        </ul>
      )}

      {remainingCount > 0 && (
        <details className="mt-2 text-sm text-ink-muted">
          <summary className="cursor-pointer select-none list-none underline decoration-dotted underline-offset-4">
            +{remainingCount} more flavor{remainingCount === 1 ? "" : "s"} today
          </summary>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {remaining.map((f) => {
              const c = flavorColor(f.id);
              return (
                <li key={f.id} className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <Dot color={c.bg} />
                  {f.name}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-green px-3 py-2.5 text-sm font-medium text-white hover:bg-green-dark"
        >
          Directions
        </a>
        {store.phone && (
          <a
            href={`tel:${digitsOnlyPhone}`}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border-2 border-magenta px-3 py-2.5 text-sm font-medium text-magenta hover:bg-magenta hover:text-white"
          >
            Call
          </a>
        )}
      </div>
    </article>
  );
}
