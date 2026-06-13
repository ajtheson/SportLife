import { BookingStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { decideOwnerBookingAction } from "@/features/bookings/booking-actions";
import { getOwnerBookingDetail } from "@/features/bookings/booking-service";
import { BookingStatusTimeline } from "@/features/bookings/booking-status-timeline";
import { ownerCanDecide } from "@/features/bookings/booking-transitions";
import { startBookingChatAction } from "@/features/chat/chat-actions";
import { userHasVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";

type PageProps = {
  params: Promise<{ bookingId: string }>;
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

const messages: Record<string, { tone: "success" | "error"; text: string }> = {
  booking_confirmed: { tone: "success", text: "Đã xác nhận booking. Khung giờ chuyển sang Đã đặt." },
  booking_rejected: { tone: "success", text: "Đã từ chối booking. Khung giờ được mở lại." },
  booking_canceled: { tone: "success", text: "Đã hủy booking. Khung giờ được mở lại." },
  invalid_decision: { tone: "error", text: "Yêu cầu không hợp lệ." },
  booking_not_found: { tone: "error", text: "Không tìm thấy booking thuộc sân của bạn." },
  booking_not_decidable: { tone: "error", text: "Booking này không thể xử lý ở trạng thái hiện tại." },
  reason_required: { tone: "error", text: "Vui lòng nhập lý do khi từ chối booking." },
  chat_invalid_input: { tone: "error", text: "Không thể mở cuộc trò chuyện." },
  chat_unavailable: { tone: "error", text: "Hiện chưa thể mở chat. Vui lòng thử lại." },
  booking_chat_not_allowed: { tone: "error", text: "Bạn không có quyền chat về booking này." },
};

function formatRange(startAt: Date, endAt: Date) {
  const date = startAt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  const start = startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const end = endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${start} - ${end}`;
}

export default async function VenueOwnerBookingDetailPage({ params, searchParams }: PageProps) {
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

  const { bookingId } = await params;
  const booking = await getOwnerBookingDetail(session.user.id, bookingId);

  if (!booking) {
    notFound();
  }

  const status = statusLabels[booking.status];
  const playerName = booking.player.playerProfile?.displayName ?? booking.player.email ?? "Người chơi";
  const playerPhone = booking.player.playerProfile?.phone;
  const messageKey = firstParam((await searchParams).status) ?? firstParam((await searchParams).error);
  const message = messageKey ? messages[messageKey] : null;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <Link className={buttonVariants({ variant: "outline", className: "w-fit" })} href="/venue-owner/bookings">
          ← Quay lại quản lý đặt sân
        </Link>

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

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-primary">{booking.venue.name} - {booking.resource.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{booking.venue.address}</p>
            <p className="mt-3 text-sm font-medium text-foreground">{formatRange(booking.startAt, booking.endAt)}</p>
            <p className="mt-2 text-sm text-muted-foreground">Người đặt: {playerName}{playerPhone ? ` · ${playerPhone}` : ""}</p>
            {booking.playerNote ? <p className="mt-1 text-sm text-muted-foreground">Ghi chú: {booking.playerNote}</p> : null}
            {booking.decisionReason ? <p className="mt-1 text-sm text-muted-foreground">Lý do: {booking.decisionReason}</p> : null}

            <div className="mt-5 grid gap-3">
              <form action={startBookingChatAction}>
                <input name="bookingId" type="hidden" value={booking.id} />
                <input name="role" type="hidden" value="owner" />
                <Button type="submit" size="sm">Nhắn tin với người chơi</Button>
              </form>

              {ownerCanDecide(booking.status, "confirm") ? (
                <form action={decideOwnerBookingAction} className="flex gap-2">
                  <input name="bookingId" type="hidden" value={booking.id} />
                  <input name="action" type="hidden" value="confirm" />
                  <Button type="submit" size="sm" variant="outline">Xác nhận</Button>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Lịch sử trạng thái</h2>
            <BookingStatusTimeline history={booking.statusHistory} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
