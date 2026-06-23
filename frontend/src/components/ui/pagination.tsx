import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

export interface PaginationProps {
  /** Current page number (1-indexed). */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total number of items across all pages. */
  totalCount: number;
  /** Number of items per page. */
  pageSize: number;
  /** All current searchParams (filters); preserved when navigating pages. */
  searchParams: Record<string, string | undefined>;
  /** Base pathname, e.g. "/venues". */
  basePath: string;
}

function buildHref(
  basePath: string,
  page: number,
  searchParams: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== "page" && value !== undefined && value !== "") {
      params.set(key, value);
    }
  }
  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  searchParams,
  basePath,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Hiển thị {rangeStart} – {rangeEnd} trên tổng số {totalCount}
      </p>
      <div className="flex items-center gap-4">
        <Link
          href={buildHref(basePath, currentPage - 1, searchParams)}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className:
              currentPage <= 1 ? "pointer-events-none opacity-50" : "",
          })}
          aria-disabled={currentPage <= 1}
          tabIndex={currentPage <= 1 ? -1 : undefined}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Trước
        </Link>
        <div className="text-sm font-medium">
          Trang {currentPage} / {totalPages}
        </div>
        <Link
          href={buildHref(basePath, currentPage + 1, searchParams)}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className:
              currentPage >= totalPages
                ? "pointer-events-none opacity-50"
                : "",
          })}
          aria-disabled={currentPage >= totalPages}
          tabIndex={currentPage >= totalPages ? -1 : undefined}
        >
          Sau <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
