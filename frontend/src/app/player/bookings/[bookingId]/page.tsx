import { BookingStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cancelPlayerBookingAction } from "@/features/bookings/booking-actions";
import { getPlayerBookingDetail } from "@/features/bookings/booking-service";
import { BookingStatusTimeline } from "@/features/bookings/booking-status-timeline";
import { playerCanCancel } from "@/features/bookings/booking-transitions";
import { startBookingChatAction } from "@/features/chat/chat-actions";

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
  REJECTED: { label: "Bị từ chối", variant: "destructive" },
  CANCELED_BY_PLAYER: { label: "Bạn đã hủy", variant: "outline" },
  CANCELED_BY_OWNER: { label: "Chủ sân đã hủy", variant: "destructive" },
  COMPLETED: { label: "Hoàn thành", variant: "secondary" },
};

const messages: Record<string, { tone: "success" | "error"; text: string }> = {
  chat_invalid_input: { tone: "error", text: "Không thể mở cuộc trò chuyện." },
  chat_unavailable: { tone: "error", text: "Hiện chưa thể mở chat. Vui lòng thử lại." },
  booking_not_found: { tone: "error", text: "Không tìm thấy booking." },
  booking_chat_not_allowed: { tone: "error", text: "Bạn không có quyền chat về booking này." },
};

function formatRange(startAt: Date, endAt: Date) {
  const date = startAt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  const start = startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const end = endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${start} - ${end}`;
}

export default async function PlayerBookingDetailPage({ params, searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const { bookingId } = await params;
  const booking = await getPlayerBookingDetail(session.user.id, bookingId);

  if (!booking) {
    notFound();
  }

  const status = statusLabels[booking.status];
  const messageKey = firstParam((await searchParams).error);
  const message = messageKey ? messages[messageKey] : null;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <Link className={buttonVariants({ variant: "outline", className: "w-fit" })} href="/player/bookings">
          ← Quay lại danh sách
        </Link>

        {message ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{message.text}</div>
        ) : null}

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-primary">{booking.venue.name} - {booking.resource.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{booking.venue.address}</p>
            <p className="mt-3 text-sm font-medium text-foreground">{formatRange(booking.startAt, booking.endAt)}</p>
            {booking.playerNote ? <p className="mt-2 text-sm text-muted-foreground">Ghi chú: {booking.playerNote}</p> : null}
            {booking.decisionReason ? (
              <p className="mt-2 rounded-md border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
                Lý do từ chủ sân: {booking.decisionReason}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <form action={startBookingChatAction}>
                <input name="bookingId" type="hidden" value={booking.id} />
                <input name="role" type="hidden" value="player" />
                <Button type="submit" size="sm">Nhắn tin với chủ sân</Button>
              </form>
              {playerCanCancel(booking.status) ? (
                <form action={cancelPlayerBookingAction}>
                  <input name="bookingId" type="hidden" value={booking.id} />
                  <Button type="submit" size="sm" variant="outline">Hủy đặt sân</Button>
                </form>
              ) : null}
              <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href={`/venues/${booking.venue.id}`}>
                Xem sân
              </Link>
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
