"use client";

import { flavorColor } from "@/lib/colors";

// The page's signature element: a thin bar that blends the colors of
// whatever flavors are currently selected, like the middle "swirl" handle on
// a real Yogurtland machine mixing two sides together. Empty selection reads
// as a plain, unmixed bar; each flavor added widens the blend.

type SwirlBarProps = {
  flavorIds: number[];
};

export default function SwirlBar({ flavorIds }: SwirlBarProps) {
  const colors = flavorIds.map((id) => flavorColor(id).bg);

  const background =
    colors.length === 0
      ? "linear-gradient(90deg, var(--green), var(--magenta))"
      : colors.length === 1
        ? colors[0]
        : `linear-gradient(90deg, ${colors.join(", ")})`;

  return (
    <div
      key={flavorIds.join(",")}
      className="animate-swirl-in h-2 w-full rounded-full"
      style={{ background }}
      aria-hidden
    />
  );
}
