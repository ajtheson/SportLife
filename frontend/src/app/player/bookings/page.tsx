import { BookingStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cancelPlayerBookingAction } from "@/features/bookings/booking-actions";
import { listPlayerBookings } from "@/features/bookings/booking-service";
import { playerCanCancel } from "@/features/bookings/booking-transitions";
import { userHasPlayerProfile } from "@/features/player-profile/player-profile-service";
import { getPhoneGateRedirect } from "@/lib/authorization/phone-guard";
import { parsePage, calcTotalPages, firstParam } from "@/lib/pagination-utils";
import { Pagination } from "@/components/ui/pagination";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 15;

const statusLabels: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xác nhận", variant: "default" },
  CONFIRMED: { label: "Đã xác nhận", variant: "secondary" },
  REJECTED: { label: "Bị từ chối", variant: "destructive" },
  CANCELED_BY_PLAYER: { label: "Bạn đã hủy", variant: "outline" },
  CANCELED_BY_OWNER: { label: "Chủ sân đã hủy", variant: "destructive" },
  COMPLETED: { label: "Hoàn thành", variant: "secondary" },
};

const messages: Record<string, { tone: "success" | "error"; text: string }> = {
  booking_requested: { tone: "success", text: "Đã gửi yêu cầu đặt sân. Vui lòng chờ chủ sân xác nhận." },
  booking_canceled_by_player: { tone: "success", text: "Đã hủy yêu cầu đặt sân." },
  invalid_cancel: { tone: "error", text: "Yêu cầu không hợp lệ." },
  booking_not_found: { tone: "error", text: "Không tìm thấy booking." },
  booking_not_cancelable: { tone: "error", text: "Booking này không thể hủy ở trạng thái hiện tại." },
};

function formatRange(startAt: Date, endAt: Date) {
  const date = startAt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  const start = startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const end = endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${start} - ${end}`;
}

export default async function PlayerBookingsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  if (!(await userHasPlayerProfile(session.user.id))) {
    redirect("/player/profile");
  }

  const phoneRedirect = await getPhoneGateRedirect(session.user);

  if (phoneRedirect) {
    redirect(phoneRedirect);
  }

  const params = await searchParams;
  const status = firstParam(params.status) as BookingStatus || undefined;
  const q = firstParam(params.q)?.trim() || undefined;

  const filters = { status, q };

  const { page, skip, take } = parsePage(params, PAGE_SIZE);

  const { items: bookings, totalCount } = await listPlayerBookings(session.user.id, { ...filters, skip, take });
  const totalPagesCount = calcTotalPages(totalCount, PAGE_SIZE);

  const paginationSearchParams: Record<string, string | undefined> = {
    status: filters.status,
    q: filters.q,
  };

  const messageKey = firstParam(params.status) ?? firstParam(params.error);
  const message = messageKey ? messages[messageKey] : null;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Đặt sân của tôi</h1>
          <p className="mt-3 text-muted-foreground">Theo dõi trạng thái các yêu cầu đặt sân và hủy khi cần.</p>
        </div>

        {message ? (
          <div
            className={
              message.tone === "error"
                ? "rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                : "rounded-md border border-primary/40 bg-primary/10 p-4 text-sm text-primary"
            }
          >
            {message.text}
          </div>
        ) : null}

        <form className="grid gap-4 rounded-xl border border-border bg-card/95 p-4 shadow-sm sm:grid-cols-[200px_minmax(0,1fr)_auto]" action="/player/bookings">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="status">Trạng thái</label>
            <select id="status" name="status" defaultValue={filters.status ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="CANCELED_BY_PLAYER">Bạn đã hủy</option>
              <option value="CANCELED_BY_OWNER">Chủ sân đã hủy</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="q">Tên sân</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="q" className="pl-9 h-10" name="q" defaultValue={filters.q ?? ""} placeholder="Nhập tên sân..." />
            </div>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto h-10">Lọc & Tìm</Button>
          </div>
        </form>

        <div className="grid gap-3">
          {bookings.map((booking) => {
            const status = statusLabels[booking.status];
            return (
              <Card key={booking.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-foreground">{booking.venue.name} - {booking.resource.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">{booking.venue.address}</p>
                      <p className="mt-2 text-sm font-medium text-foreground">{formatRange(booking.startAt, booking.endAt)}</p>
                      {booking.playerNote ? <p className="mt-2 text-sm text-muted-foreground">Ghi chú: {booking.playerNote}</p> : null}
                      {booking.decisionReason ? (
                        <p className="mt-2 rounded-md border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
                          Lý do từ chủ sân: {booking.decisionReason}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:w-44">
                      <Badge variant={status.variant} className="justify-center">{status.label}</Badge>
                      <Link className={buttonVariants({ variant: "outline", size: "sm", className: "w-full" })} href={`/player/bookings/${booking.id}`}>
                        Chi tiết
                      </Link>
                      {playerCanCancel(booking.status) ? (
                        <form action={cancelPlayerBookingAction}>
                          <input name="bookingId" type="hidden" value={booking.id} />
                          <Button type="submit" variant="outline" size="sm" className="w-full">Hủy đặt sân</Button>
                        </form>
                      ) : null}
                      <Link className={buttonVariants({ variant: "ghost", size: "sm", className: "w-full" })} href={`/venues/${booking.venue.id}`}>
                        Xem sân
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {bookings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              {filters.status || filters.q ? "Không tìm thấy yêu cầu đặt sân nào phù hợp bộ lọc." : (
                <>Bạn chưa đặt sân nào. <Link className="text-primary underline" href="/venues">Tìm sân để đặt</Link>.</>
              )}
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
              basePath="/player/bookings"
            />
          </div>
        )}
      </div>
    </main>
  );
}
