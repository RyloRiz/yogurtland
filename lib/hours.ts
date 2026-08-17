// Computes "open now" / "closed" state client-side, from each store's own
// weekly schedule and timezone, evaluated against the current instant. This
// is more trustworthy than caching an open_now flag in the daily snapshot,
// which would go stale the moment the snapshot was more than a few hours old.

import type { Store } from "./types";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type StorePhase = "open" | "closing-soon" | "closed";

export type StoreStatus = {
  isOpenNow: boolean;
  phase: StorePhase;
  label: string;
};

const CLOSING_SOON_MINUTES = 60;

function formatClock(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mStr === "00" ? `${h12}${period}` : `${h12}:${mStr}${period}`;
}

function toMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  return Number(hStr) * 60 + Number(mStr);
}

export function getStoreStatus(store: Store, now: Date = new Date()): StoreStatus {
  if (!store.hours || store.hours.length !== 7) {
    return { isOpenNow: false, phase: "closed", label: "Hours unavailable" };
  }

  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: store.timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
  } catch {
    return { isOpenNow: false, phase: "closed", label: "Hours unavailable" };
  }

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dayIndex = WEEKDAY_INDEX[weekday];
  const nowClock = `${hour}:${minute}`;

  if (dayIndex === undefined) {
    return { isOpenNow: false, phase: "closed", label: "Hours unavailable" };
  }

  const today = store.hours[dayIndex];
  if (today.isActive && nowClock >= today.from && nowClock < today.till) {
    const minutesLeft = toMinutes(today.till) - toMinutes(nowClock);
    const phase: StorePhase = minutesLeft < CLOSING_SOON_MINUTES ? "closing-soon" : "open";
    return { isOpenNow: true, phase, label: `Open until ${formatClock(today.till)}` };
  }

  if (today.isActive && nowClock < today.from) {
    return { isOpenNow: false, phase: "closed", label: `Opens ${formatClock(today.from)} today` };
  }

  // Closed for the rest of today -- find the next day with hours.
  for (let offset = 1; offset <= 7; offset++) {
    const next = store.hours[(dayIndex + offset) % 7];
    if (next.isActive) {
      const dayLabel = offset === 1 ? "tomorrow" : "soon";
      return {
        isOpenNow: false,
        phase: "closed",
        label: `Opens ${formatClock(next.from)} ${dayLabel}`,
      };
    }
  }

  return { isOpenNow: false, phase: "closed", label: "Closed" };
}
