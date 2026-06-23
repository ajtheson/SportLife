/**
 * Shared pagination utilities for server-side URL-based pagination.
 *
 * Pattern: pages read `?page=N` from searchParams, call `parsePage()` to get
 * `skip`/`take` for Prisma, and render `<Pagination />` with the result.
 */

export const DEFAULT_PAGE_SIZE = 12;

/** Safely extract the first value from a searchParam entry. */
export function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse `?page=N` from searchParams and return skip/take for Prisma.
 * Page is 1-indexed and clamped to >= 1.
 */
export function parsePage(
  params: Record<string, string | string[] | undefined>,
  pageSize = DEFAULT_PAGE_SIZE,
): { page: number; skip: number; take: number } {
  const raw = firstParam(params.page);
  const page = Math.max(1, parseInt(raw || "1", 10) || 1);
  return { page, skip: (page - 1) * pageSize, take: pageSize };
}

/** Compute total number of pages from totalCount and pageSize. */
export function calcTotalPages(
  totalCount: number,
  pageSize: number,
): number {
  return Math.max(1, Math.ceil(totalCount / pageSize));
}
