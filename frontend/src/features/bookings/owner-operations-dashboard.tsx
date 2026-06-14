import { BookingStatus } from "@prisma/client";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { getOwnerDashboardData } from "./booking-service";

type OwnerDashboardData = Awaited<ReturnType<typeof getOwnerDashboardData>>;

type OwnerOperationsDashboardProps = {
  dashboard: OwnerDashboardData;
  showHeading?: boolean;
};

function formatRange(startAt: Date, endAt: Date) {
  const date = startAt.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
  const start = startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const end = endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${start} - ${end}`;
}

function bookingStatusLabel(status: BookingStatus) {
  return status === BookingStatus.PENDING ? "Chờ xác nhận" : "Đã xác nhận";
}

export function OwnerOperationsDashboard({ dashboard, showHeading = true }: OwnerOperationsDashboardProps) {
  return (
    <section className="grid gap-4">
      {showHeading ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Vận hành hôm nay</h2>
            <p className="mt-2 text-sm text-muted-foreground">Theo dõi booking cần xử lý và slot trống trong ngày.</p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/venue-owner/bookings?status=PENDING">
            Xử lý booking chờ
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/venue-owner/bookings?status=PENDING">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
              <p className="mt-2 text-3xl font-bold text-primary">{dashboard.totals.pendingCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/venue-owner/bookings">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Booking hôm nay</p>
              <p className="mt-2 text-3xl font-bold text-primary">{dashboard.totals.todayBookingCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Slot trống hôm nay</p>
            <p className="mt-2 text-3xl font-bold text-primary">{dashboard.totals.todayAvailableSlots}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo từng sân</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.perVenue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bạn chưa có sân nào.</p>
            ) : (
              <div className="grid gap-2">
                {dashboard.perVenue.map((venue) => (
                  <Link
                    key={venue.venueId}
                    className="grid gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/50 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
                    href={`/venue-owner/venues/${venue.venueId}/schedule`}
                  >
                    <span className="font-medium text-foreground">{venue.venueName}</span>
                    <Badge variant={venue.pendingCount > 0 ? "default" : "outline"}>{venue.pendingCount} chờ xác nhận</Badge>
                    <Badge variant="secondary">{venue.todayBookingCount} booking hôm nay</Badge>
                    <Badge variant="outline">{venue.availableSlotCount} slot trống</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slot trống sắp tới</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingAvailableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không còn slot trống sắp tới trong ngày đã chọn.</p>
            ) : (
              <ul className="grid gap-2">
                {dashboard.upcomingAvailableSlots.map((slot) => (
                  <li key={slot.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="font-medium text-foreground">
                      {slot.venue.name} - {slot.resource.name}
                    </div>
                    <div className="mt-1 text-muted-foreground">{formatRange(slot.startAt, slot.endAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Booking cần xử lý hôm nay</CardTitle>
            <Link className="text-sm text-primary hover:underline" href="/venue-owner/bookings">
              Xem tất cả
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {dashboard.todayBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Hôm nay chưa có booking nào.</p>
          ) : (
            <ul className="grid gap-2">
              {dashboard.todayBookings.map((booking) => {
                const playerName = booking.player.playerProfile?.displayName ?? booking.player.email ?? "Người chơi";
                return (
                  <li key={booking.id}>
                    <Link
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted/50"
                      href={`/venue-owner/bookings/${booking.id}`}
                    >
                      <span className="font-medium text-foreground">
                        {booking.venue.name} - {booking.resource.name}
                      </span>
                      <span className="text-muted-foreground">{formatRange(booking.startAt, booking.endAt)}</span>
                      <span className="text-muted-foreground">{playerName}</span>
                      <Badge variant={booking.status === BookingStatus.PENDING ? "default" : "secondary"}>
                        {bookingStatusLabel(booking.status)}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
