import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

export interface UsePaginationOptions {
  pageSize?: number;
  /** Changing this value (e.g. a search query or filter) jumps back to page 1. */
  resetKey?: unknown;
}

/**
 * Client-side pagination over an already-fetched array. Screens here read a
 * full result set in one shot (the SQLite cache for students/payments, or a
 * single API call for staff/activity) rather than a paginated server
 * response, so slicing into pages of `pageSize` happens locally — this keeps
 * long lists (large cohorts, payment history, staff rosters) rendering 10
 * rows at a time instead of dumping everything onto one screen.
 */
export function usePagination<T>(items: T[], { pageSize = DEFAULT_PAGE_SIZE, resetKey }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    // Only reset when the caller's reset key changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Clamp so a shrinking list (e.g. after a search/filter narrows results)
  // never strands the user on a now-empty page.
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    totalPages,
    pageItems,
    total: items.length,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}
