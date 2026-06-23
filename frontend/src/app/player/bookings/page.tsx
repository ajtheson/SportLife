import { BookingStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cancelPlayerBookingAction } from "@/features/bookings/booking-actions";
import { listPlayerBookings } from "@/features/bookings/booking-service";
import { playerCanCancel } from "@/features/bookings/booking-transitions";
import { userHasPlayerProfile } from "@/features/player-profile/player-profile-service";
import { getPhoneGateRedirect } from "@/lib/authorization/phone-guard";

type PageProps = {
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

  const [bookings, params] = await Promise.all([listPlayerBookings(session.user.id), searchParams]);
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
              Bạn chưa đặt sân nào. <Link className="text-primary underline" href="/venues">Tìm sân để đặt</Link>.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
