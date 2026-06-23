import { TimeSlotStatus, UserRole } from "@prisma/client";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AutoRefresh } from "@/components/auto-refresh";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBookingAction } from "@/features/bookings/booking-actions";
import { getPublicVenueAvailability } from "@/features/bookings/booking-service";
import { userHasPlayerProfile } from "@/features/player-profile/player-profile-service";
import { getPhoneGateRedirect } from "@/lib/authorization/phone-guard";

type BookingPageProps = {
  params: Promise<{ venueId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function todayInHanoi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const errorMessages: Record<string, string> = {
  invalid_booking: "Thông tin đặt sân không hợp lệ. Vui lòng thử lại.",
  venue_not_found: "Không tìm thấy sân hoặc sân chưa được duyệt.",
  slot_not_found: "Không tìm thấy khung giờ.",
  slot_in_past: "Không thể đặt khung giờ trong quá khứ.",
  slot_not_available: "Khung giờ này vừa được người khác đặt. Vui lòng chọn khung giờ khác.",
  player_profile_required: "Bạn cần hoàn thiện hồ sơ người chơi trước khi đặt sân.",
  booking_not_allowed: "Tài khoản của bạn chưa thể đặt sân.",
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export default async function VenueBookingPage({ params, searchParams }: BookingPageProps) {
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

  const [{ venueId }, paramsValue] = await Promise.all([params, searchParams]);
  const selectedDate = firstParam(paramsValue.date) ?? todayInHanoi();
  const errorKey = firstParam(paramsValue.error);

  const availability = await getPublicVenueAvailability(venueId, selectedDate);

  if (!availability) {
    notFound();
  }

  const { venue, resources, slots } = availability;
  const slotsByResource = new Map(resources.map((resource) => [resource.id, slots.filter((slot) => slot.resourceId === resource.id)]));
  const todayValue = todayInHanoi();

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <AutoRefresh />
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link className={buttonVariants({ variant: "outline", className: "mb-4 w-fit" })} href={`/venues/${venue.id}`}>
              ← Quay lại chi tiết sân
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Đặt sân</h1>
            <p className="mt-3 text-muted-foreground">{venue.name} - {venue.address}</p>
          </div>
          <form className="flex flex-wrap items-end gap-3" action={`/venues/${venue.id}/booking`}>
            <div className="grid gap-2">
              <Label htmlFor="date">Chọn ngày</Label>
              <Input id="date" name="date" type="date" min={todayValue} defaultValue={selectedDate} />
            </div>
            <Button type="submit" variant="outline">
              <CalendarDays className="mr-2 size-4" aria-hidden="true" />
              Xem lịch
            </Button>
          </form>
        </div>

        {errorKey ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {errorMessages[errorKey] ?? "Không thể đặt sân. Vui lòng thử lại."}
          </div>
        ) : null}

        {resources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Sân này chưa mở lịch đặt. Vui lòng liên hệ trực tiếp chủ sân.
          </div>
        ) : null}

        {resources.map((resource) => {
          const resourceSlots = slotsByResource.get(resource.id) ?? [];
          const bookableSlots = resourceSlots.filter((slot) => slot.status === TimeSlotStatus.AVAILABLE && slot.startAt.getTime() > Date.now());

          return (
            <Card key={resource.id}>
              <CardHeader>
                <CardTitle>{resource.name}</CardTitle>
                {resource.description ? <CardDescription>{resource.description}</CardDescription> : null}
              </CardHeader>
              <CardContent className="grid gap-3">
                {resourceSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có khung giờ cho ngày này.</p>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {resourceSlots.map((slot) => {
                    const bookable = slot.status === TimeSlotStatus.AVAILABLE && slot.startAt.getTime() > Date.now();
                    return (
                      <div key={slot.id} className="grid gap-2 rounded-md border border-border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{formatTime(slot.startAt)} - {formatTime(slot.endAt)}</span>
                          {bookable ? (
                            <Badge variant="secondary">Trống</Badge>
                          ) : (
                            <Badge variant="outline">Đã có người đặt</Badge>
                          )}
                        </div>
                        {bookable ? (
                          <form action={createBookingAction} className="grid gap-2">
                            <input name="venueId" type="hidden" value={venue.id} />
                            <input name="date" type="hidden" value={selectedDate} />
                            <input name="slotId" type="hidden" value={slot.id} />
                            <Textarea name="playerNote" maxLength={300} placeholder="Ghi chú cho chủ sân (không bắt buộc)" />
                            <Button type="submit" size="sm" className="w-fit">Gửi yêu cầu đặt</Button>
                          </form>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {resourceSlots.length > 0 && bookableSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không còn khung giờ trống cho ngày này.</p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
