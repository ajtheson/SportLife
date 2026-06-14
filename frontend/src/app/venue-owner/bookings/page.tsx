import { BookingStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AutoRefresh } from "@/components/auto-refresh";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { decideOwnerBookingAction } from "@/features/bookings/booking-actions";
import { listOwnerBookings, listOwnerVenuesForFilter } from "@/features/bookings/booking-service";
import { ownerBookingFilterSchema } from "@/features/bookings/booking-schemas";
import { ownerCanDecide } from "@/features/bookings/booking-transitions";
import { userHasVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusLabels: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Chờ xác nhận", variant: "default" },
  CONFIRMED: { label: "Đã xác nhận", variant: "secondary" },
  REJECTED: { label: "Đã từ chối", variant: "destructive" },
  CANCELED_BY_PLAYER: { label: "Người chơi đã hủy", variant: "outline" },
  CANCELED_BY_OWNER: { label: "Bạn đã hủy", variant: "destructive" },
  COMPLETED: { label: "Hoàn thành", variant: "secondary" },
};

const filterStatuses: { value: string; label: string }[] = [
  { value: "", label: "Tất cả trạng thái" },
  { value: BookingStatus.PENDING, label: "Chờ xác nhận" },
  { value: BookingStatus.CONFIRMED, label: "Đã xác nhận" },
  { value: BookingStatus.REJECTED, label: "Đã từ chối" },
  { value: BookingStatus.CANCELED_BY_PLAYER, label: "Người chơi đã hủy" },
  { value: BookingStatus.CANCELED_BY_OWNER, label: "Bạn đã hủy" },
];

const messages: Record<string, { tone: "success" | "error"; text: string }> = {
  booking_confirmed: { tone: "success", text: "Đã xác nhận booking. Khung giờ chuyển sang Đã đặt." },
  booking_rejected: { tone: "success", text: "Đã từ chối booking. Khung giờ được mở lại." },
  booking_canceled: { tone: "success", text: "Đã hủy booking. Khung giờ được mở lại." },
  invalid_decision: { tone: "error", text: "Yêu cầu không hợp lệ." },
  booking_not_found: { tone: "error", text: "Không tìm thấy booking thuộc sân của bạn." },
  booking_not_decidable: { tone: "error", text: "Booking này không thể xử lý ở trạng thái hiện tại." },
  reason_required: { tone: "error", text: "Vui lòng nhập lý do khi từ chối booking." },
};

function formatRange(startAt: Date, endAt: Date) {
  const date = startAt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  const start = startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const end = endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${start} - ${end}`;
}

export default async function VenueOwnerBookingsPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  if (!(await userHasVenueOwnerProfile(session.user.id))) {
    redirect("/venue-owner/profile");
  }

  const params = await searchParams;
  const filter = ownerBookingFilterSchema.safeParse({
    venueId: firstParam(params.venueId) || undefined,
    status: firstParam(params.status) || undefined,
  });
  const filters = filter.success ? filter.data : {};

  const [bookings, venues] = await Promise.all([
    listOwnerBookings(session.user.id, filters),
    listOwnerVenuesForFilter(session.user.id),
  ]);

  const messageKey = firstParam(params.error) ?? firstParam(params.status);
  const message = messageKey ? messages[messageKey] : null;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <AutoRefresh />
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link className={buttonVariants({ variant: "outline", className: "mb-4 w-fit" })} href="/venue-owner">
              ← Quay lại sân của tôi
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Quản lý đặt sân</h1>
            <p className="mt-3 text-muted-foreground">Xác nhận, từ chối hoặc hủy các yêu cầu đặt sân từ người chơi.</p>
          </div>
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

        <form className="flex flex-wrap items-end gap-3 rounded-md border border-border p-4" action="/venue-owner/bookings">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="venueId">Sân</label>
            <select id="venueId" name="venueId" defaultValue={filters.venueId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Tất cả sân</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="status">Trạng thái</label>
            <select id="status" name="status" defaultValue={filters.status ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              {filterStatuses.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline">Lọc</Button>
        </form>

        <div className="grid gap-3">
          {bookings.map((booking) => {
            const status = statusLabels[booking.status];
            const playerName = booking.player.playerProfile?.displayName ?? booking.player.email ?? "Người chơi";
            const playerPhone = booking.player.playerProfile?.phone;
            return (
              <Card key={booking.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-foreground">{booking.venue.name} - {booking.resource.name}</h2>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">{formatRange(booking.startAt, booking.endAt)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Người đặt: {playerName}{playerPhone ? ` · ${playerPhone}` : ""}
                      </p>
                      {booking.playerNote ? <p className="mt-1 text-sm text-muted-foreground">Ghi chú: {booking.playerNote}</p> : null}
                      {booking.decisionReason ? <p className="mt-1 text-sm text-muted-foreground">Lý do: {booking.decisionReason}</p> : null}
                    </div>

                    <div className="grid gap-3 lg:w-72">
                      <Link className={buttonVariants({ variant: "outline", size: "sm", className: "w-fit" })} href={`/venue-owner/bookings/${booking.id}`}>
                        Chi tiết
                      </Link>
                      {ownerCanDecide(booking.status, "confirm") ? (
                        <form action={decideOwnerBookingAction} className="flex gap-2">
                          <input name="bookingId" type="hidden" value={booking.id} />
                          <input name="action" type="hidden" value="confirm" />
                          <Button type="submit" size="sm" className="w-full">Xác nhận</Button>
                        </form>
                      ) : null}

                      {ownerCanDecide(booking.status, "reject") ? (
                        <form action={decideOwnerBookingAction} className="grid gap-2 rounded-md border border-border p-3">
                          <input name="bookingId" type="hidden" value={booking.id} />
                          <input name="action" type="hidden" value="reject" />
                          <Textarea name="reason" required maxLength={200} placeholder="Lý do từ chối" />
                          <Button type="submit" size="sm" variant="outline" className="w-fit">Từ chối</Button>
                        </form>
                      ) : null}

                      {ownerCanDecide(booking.status, "cancel") && booking.status === BookingStatus.CONFIRMED ? (
                        <form action={decideOwnerBookingAction} className="grid gap-2 rounded-md border border-border p-3">
                          <input name="bookingId" type="hidden" value={booking.id} />
                          <input name="action" type="hidden" value="cancel" />
                          <Textarea name="reason" maxLength={200} placeholder="Lý do hủy (không bắt buộc)" />
                          <Button type="submit" size="sm" variant="outline" className="w-fit">Hủy booking đã xác nhận</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {bookings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Chưa có yêu cầu đặt sân nào phù hợp bộ lọc.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
