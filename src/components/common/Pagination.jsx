import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Renders up to 5 page numbers centered around the current page, with
// leading/trailing ellipses when there are more pages than that.
function getPageList(page, totalPages) {
  const pages = [];
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let p = start; p <= end; p += 1) pages.push(p);
  return pages;
}

export function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  const pages = getPageList(page, totalPages);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const goTo = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || !onPageChange) return;
    onPageChange(nextPage);
  };

  return (
    <nav className="flex items-center justify-between pt-5" aria-label="Pagination">
      <button
        className="rounded-md border p-2 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-ink-800"
        aria-label="Previous page"
        onClick={() => goTo(page - 1)}
        disabled={!canGoPrev}
      >
        <FiChevronLeft className="h-4 w-4" />
      </button>
      <div className="flex gap-2">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goTo(p)}
            aria-current={p === page ? "page" : undefined}
            className={`h-9 w-9 rounded-md text-sm font-semibold ${
              p === page ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950" : "border"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        className="rounded-md border p-2 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-ink-800"
        aria-label="Next page"
        onClick={() => goTo(page + 1)}
        disabled={!canGoNext}
      >
        <FiChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
