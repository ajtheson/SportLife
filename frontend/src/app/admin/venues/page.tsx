import { ApprovalStatus, VisibilityStatus } from "@prisma/client";
import { Search } from "lucide-react";

import {
  approveVenueAction,
  hideVenueAction,
  rejectVenueAction,
  showVenueAction,
} from "@/features/venues/venue-actions";
import { listAdminVenues } from "@/features/venues/venue-service";
import { parsePage, calcTotalPages, firstParam } from "@/lib/pagination-utils";
import { Pagination } from "@/components/ui/pagination";

import { configMessage, requireAdminPage } from "../config/config-page-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type AdminVenuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

const approvalStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING_APPROVAL: { label: "CHỜ DUYỆT", variant: "default" },
  APPROVED: { label: "ĐÃ DUYỆT", variant: "secondary" },
  REJECTED: { label: "TỪ CHỐI", variant: "destructive" },
};

const visibilityStatusMap: Record<string, { label: string; variant: "default" | "outline" }> = {
  ACTIVE: { label: "HOẠT ĐỘNG", variant: "default" },
  HIDDEN: { label: "BỊ ẨN", variant: "outline" },
};

export default async function AdminVenuesPage({ searchParams }: AdminVenuesPageProps) {
  await requireAdminPage();
  const params = await searchParams;

  const approvalStatus = firstParam(params.approvalStatus) as ApprovalStatus || undefined;
  const visibilityStatus = firstParam(params.visibilityStatus) as VisibilityStatus || undefined;
  const q = firstParam(params.q)?.trim() || undefined;

  const filters = {
    approvalStatus,
    visibilityStatus,
    q,
  };

  const { page, skip, take } = parsePage(params, PAGE_SIZE);

  const [{ items: venues, totalCount }, message] = await Promise.all([
    listAdminVenues({ ...filters, skip, take }),
    configMessage(searchParams),
  ]);

  const totalPagesCount = calcTotalPages(totalCount, PAGE_SIZE);

  const paginationSearchParams: Record<string, string | undefined> = {
    approvalStatus: filters.approvalStatus,
    visibilityStatus: filters.visibilityStatus,
    q: filters.q,
  };

  // Build current path with query params for redirection after action if needed (though actions currently use direct redirects, it is good to have)
  const searchParamsString = new URLSearchParams(
    Object.entries(paginationSearchParams).filter(([, v]) => v !== undefined) as string[][]
  ).toString();
  const currentPath = `/admin/venues${searchParamsString ? `?${searchParamsString}&page=${page}` : `?page=${page}`}`;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Kiểm duyệt sân</h1>
          <p className="mt-3 text-muted-foreground">Duyệt, từ chối, ẩn hoặc khôi phục danh sách sân tập.</p>
        </div>

        {message ? (
          <div className={`rounded-md border p-4 text-sm ${message.includes("Không thể") || message.includes("Vui lòng") ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/50 bg-primary/10 text-primary"}`}>
            {message}
          </div>
        ) : null}

        {/* Filter Form */}
        <form className="grid gap-4 rounded-xl border border-border bg-card/95 p-4 shadow-sm md:grid-cols-[180px_180px_minmax(0,1fr)_auto]" action="/admin/venues">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="approvalStatus">Kiểm duyệt</label>
            <select
              id="approvalStatus"
              name="approvalStatus"
              defaultValue={filters.approvalStatus ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả duyệt</option>
              <option value="PENDING_APPROVAL">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="visibilityStatus">Hiển thị</label>
            <select
              id="visibilityStatus"
              name="visibilityStatus"
              defaultValue={filters.visibilityStatus ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả hiển thị</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="HIDDEN">Bị ẩn</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="q">Tìm kiếm</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="q"
                className="pl-9 h-10"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Nhập tên sân hoặc email chủ sân..."
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full md:w-auto h-10">Lọc & Tìm</Button>
          </div>
        </form>

        <div className="grid gap-4">
          {venues.map((venue) => {
            const visibilityAction = venue.visibilityStatus === VisibilityStatus.ACTIVE ? hideVenueAction : showVenueAction;
            const nextVisibility = venue.visibilityStatus === VisibilityStatus.ACTIVE ? "Ẩn sân" : "Hiện sân";
            const appStatus = approvalStatusMap[venue.approvalStatus];
            const visStatus = visibilityStatusMap[venue.visibilityStatus];

            return (
              <Card key={venue.id}>
                <CardContent className="p-6">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <h2 className="text-xl font-bold text-primary">{venue.name}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{venue.address}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{venue.area.name}</Badge>
                        {venue.sports.map((item) => (
                          <Badge key={item.sport.id} variant="outline">{item.sport.name}</Badge>
                        ))}
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        Chủ sân: <span className="font-semibold text-foreground">{venue.owner.venueOwnerProfile?.businessName ?? venue.owner.email}</span>
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant={appStatus?.variant ?? "default"}>{appStatus?.label ?? venue.approvalStatus}</Badge>
                        <Badge variant={visStatus?.variant ?? "default"}>{visStatus?.label ?? venue.visibilityStatus}</Badge>
                      </div>
                      {venue.rejectionReason ? (
                        <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                          <span className="font-semibold">Lý do từ chối:</span> {venue.rejectionReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 content-start">
                      {venue.approvalStatus === "PENDING_APPROVAL" || venue.approvalStatus === "REJECTED" ? (
                        <form action={approveVenueAction}>
                          <input name="venueId" type="hidden" value={venue.id} />
                          <input name="redirectTo" type="hidden" value={currentPath} />
                          <Button className="w-full" type="submit">
                            Duyệt sân
                          </Button>
                        </form>
                      ) : null}

                      {venue.approvalStatus === "PENDING_APPROVAL" || venue.approvalStatus === "APPROVED" ? (
                        <form action={rejectVenueAction} className="grid gap-2">
                          <input name="venueId" type="hidden" value={venue.id} />
                          <input name="redirectTo" type="hidden" value={currentPath} />
                          <Textarea
                            className="min-h-20"
                            name="rejectionReason"
                            placeholder="Nhập lý do từ chối"
                            required
                            maxLength={500}
                          />
                          <Button variant="destructive" className="w-full" type="submit">
                            Từ chối
                          </Button>
                        </form>
                      ) : null}

                      <form action={visibilityAction}>
                        <input name="venueId" type="hidden" value={venue.id} />
                        <input name="redirectTo" type="hidden" value={currentPath} />
                        <Button variant="outline" className="w-full" type="submit">
                          {nextVisibility}
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {venues.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Không tìm thấy sân nào phù hợp bộ lọc.
            </div>
          ) : null}
        </div>

        {totalPagesCount > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPagesCount}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              searchParams={paginationSearchParams}
              basePath="/admin/venues"
            />
          </div>
        )}
      </div>
    </main>
  );
}
