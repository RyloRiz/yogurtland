"use client";

type LoadMoreButtonProps = {
  shownCount: number;
  totalCount: number;
  onClick: () => void;
};

export default function LoadMoreButton({ shownCount, totalCount, onClick }: LoadMoreButtonProps) {
  const hasMore = shownCount < totalCount;

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <p className="text-sm text-ink-muted">
        Showing {shownCount} of {totalCount} store{totalCount === 1 ? "" : "s"}
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={onClick}
          className="cursor-pointer rounded-full bg-green px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02] hover:bg-green-dark active:scale-[0.98]"
        >
          Load 15 more
        </button>
      )}
    </div>
  );
}
