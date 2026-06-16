import { TimeSlotStatus, UserRole, VenueResourceStatus } from "@prisma/client";
import { CalendarDays, Lock, Plus, RefreshCw, Unlock } from "lucide-react";
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
import {
  generateVenueSlotsAction,
  saveVenueResourceAction,
  saveVenueScheduleRuleAction,
  toggleVenueSlotAction,
} from "@/features/venue-schedule/venue-schedule-actions";
import { getOwnerVenueScheduleData, weekdayLabels } from "@/features/venue-schedule/venue-schedule-service";

type VenueSchedulePageProps = {
  params: Promise<{ venueId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const resourceStatusLabels: Record<VenueResourceStatus, string> = {
  ACTIVE: "Đang dùng",
  INACTIVE: "Tạm ẩn",
  MAINTENANCE: "Bảo trì",
};

const slotStatusLabels: Record<TimeSlotStatus, string> = {
  AVAILABLE: "Trống",
  HELD: "Đang giữ",
  PENDING_CONFIRMATION: "Chờ xác nhận",
  BOOKED: "Đã đặt",
  BLOCKED: "Đã khóa",
  CANCELED: "Đã hủy",
};

const slotStatusVariants: Record<TimeSlotStatus, "default" | "secondary" | "destructive" | "outline"> = {
  AVAILABLE: "secondary",
  HELD: "outline",
  PENDING_CONFIRMATION: "default",
  BOOKED: "default",
  BLOCKED: "destructive",
  CANCELED: "outline",
};

function todayInHanoi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  const status = firstParam(params.status);
  const error = firstParam(params.error);

  if (status === "resource_saved") return { tone: "success", text: "Đã lưu sân con." };
  if (status === "rule_saved") return { tone: "success", text: "Đã lưu giờ hoạt động." };
  if (status === "slots_generated") return { tone: "success", text: "Đã sinh slot trống cho ngày đã chọn." };
  if (status === "slot_blocked") return { tone: "success", text: "Đã khóa slot." };
  if (status === "slot_unblocked") return { tone: "success", text: "Đã mở lại slot." };
  if (error) return { tone: "error", text: "Không thể lưu thay đổi. Vui lòng kiểm tra dữ liệu và thử lại." };
  return null;
}

export default async function VenueSchedulePage({ params, searchParams }: VenueSchedulePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  const [{ venueId }, paramsValue] = await Promise.all([params, searchParams]);
  const selectedDate = firstParam(paramsValue.date) ?? todayInHanoi();
  const [scheduleData, message] = await Promise.all([
    getOwnerVenueScheduleData(session.user.id, venueId, selectedDate),
    pageMessage(searchParams),
  ]);

  if (!scheduleData) {
    notFound();
  }

  const { venue, resources, rules, slots } = scheduleData;
  const slotsByResource = new Map(resources.map((resource) => [resource.id, slots.filter((slot) => slot.resourceId === resource.id)]));

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <AutoRefresh />
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link className={buttonVariants({ variant: "outline", className: "mb-4 w-fit" })} href="/venue-owner">
              Quay lại sân của tôi
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Lịch sân</h1>
            <p className="mt-3 text-muted-foreground">{venue.name} - {venue.address}</p>
          </div>
          <form className="flex flex-wrap items-end gap-3" action={`/venue-owner/venues/${venue.id}/schedule`}>
            <div className="grid gap-2">
              <Label htmlFor="date">Ngày xem lịch</Label>
              <Input id="date" name="date" type="date" defaultValue={selectedDate} />
            </div>
            <Button type="submit" variant="outline">
              <CalendarDays className="mr-2 size-4" aria-hidden="true" />
              Xem ngày
            </Button>
          </form>
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

        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sân con / court / bàn</CardTitle>
                <CardDescription>Khai báo các đơn vị có thể mở slot trong venue.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <form action={saveVenueResourceAction} className="grid gap-3 rounded-md border border-border p-4">
                  <input name="venueId" type="hidden" value={venue.id} />
                  <input name="date" type="hidden" value={selectedDate} />
                  <div className="grid gap-2">
                    <Label>Tên sân con</Label>
                    <Input name="name" required maxLength={80} placeholder="Ví dụ: Sân 1, Court A, Bàn 3" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Mô tả ngắn</Label>
                    <Input name="description" maxLength={240} placeholder="Vị trí, sức chứa hoặc ghi chú vận hành" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Thứ tự</Label>
                      <Input name="sortOrder" type="number" min={0} defaultValue={resources.length + 1} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Trạng thái</Label>
                      <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="status" defaultValue="ACTIVE">
                        {Object.values(VenueResourceStatus).map((status) => (
                          <option key={status} value={status}>{resourceStatusLabels[status]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button type="submit" className="w-fit">
                    <Plus className="mr-2 size-4" aria-hidden="true" />
                    Thêm sân con
                  </Button>
                </form>

                <div className="grid gap-3">
                  {resources.map((resource) => (
                    <form key={resource.id} action={saveVenueResourceAction} className="grid gap-3 rounded-md border border-border p-4">
                      <input name="venueId" type="hidden" value={venue.id} />
                      <input name="resourceId" type="hidden" value={resource.id} />
                      <input name="date" type="hidden" value={selectedDate} />
                      <div className="grid gap-2">
                        <Label>Tên sân con</Label>
                        <Input name="name" defaultValue={resource.name} required maxLength={80} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Mô tả</Label>
                        <Input name="description" defaultValue={resource.description ?? ""} maxLength={240} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Thứ tự</Label>
                          <Input name="sortOrder" type="number" min={0} defaultValue={resource.sortOrder} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Trạng thái</Label>
                          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="status" defaultValue={resource.status}>
                            {Object.values(VenueResourceStatus).map((status) => (
                              <option key={status} value={status}>{resourceStatusLabels[status]}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Button type="submit" variant="outline" className="w-fit">Lưu sân con</Button>
                    </form>
                  ))}
                  {resources.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có sân con nào.</p> : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Giờ hoạt động theo ngày</CardTitle>
                <CardDescription>Rule này dùng để sinh slot trống cho các sân con đang hoạt động.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {rules.map((rule) => (
                  <form key={rule.dayOfWeek} action={saveVenueScheduleRuleAction} className="grid gap-3 rounded-md border border-border p-4">
                    <input name="venueId" type="hidden" value={venue.id} />
                    <input name="date" type="hidden" value={selectedDate} />
                    <input name="dayOfWeek" type="hidden" value={rule.dayOfWeek} />
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-primary">{weekdayLabels[rule.dayOfWeek]}</div>
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input name="isOpen" type="checkbox" defaultChecked={rule.isOpen} />
                        Mở cửa
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <Label>Bắt đầu</Label>
                        <Input name="startTime" type="time" defaultValue={rule.startTime} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Kết thúc</Label>
                        <Input name="endTime" type="time" defaultValue={rule.endTime} required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Độ dài slot</Label>
                        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" name="slotDurationMinutes" defaultValue={rule.slotDurationMinutes}>
                          {[30, 60, 90, 120].map((duration) => (
                            <option key={duration} value={duration}>{duration} phút</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button type="submit" variant="outline" className="w-fit">Lưu ngày này</Button>
                  </form>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>Slot ngày {selectedDate}</CardTitle>
                  <CardDescription>Sinh slot theo giờ hoạt động, sau đó khóa hoặc mở lại từng slot khi cần.</CardDescription>
                </div>
                <form action={generateVenueSlotsAction}>
                  <input name="venueId" type="hidden" value={venue.id} />
                  <input name="date" type="hidden" value={selectedDate} />
                  <Button type="submit" disabled={!resources.some((r) => r.status === VenueResourceStatus.ACTIVE)}>
                    <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                    Sinh slot trống
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              {resources.map((resource) => {
                const resourceSlots = slotsByResource.get(resource.id) ?? [];
                return (
                  <section key={resource.id} className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-primary">{resource.name}</h2>
                      <Badge variant={resource.status === "ACTIVE" ? "secondary" : "outline"}>{resourceStatusLabels[resource.status]}</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                      {resourceSlots.map((slot) => (
                        <div key={slot.id} className="grid gap-3 rounded-md border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">
                                {slot.startAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {slot.endAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                              {slot.blockReason ? <p className="mt-1 text-xs text-muted-foreground">{slot.blockReason}</p> : null}
                            </div>
                            <Badge variant={slotStatusVariants[slot.status]}>{slotStatusLabels[slot.status]}</Badge>
                          </div>
                          {slot.status === TimeSlotStatus.AVAILABLE ? (
                            <form action={toggleVenueSlotAction} className="grid gap-2">
                              <input name="venueId" type="hidden" value={venue.id} />
                              <input name="date" type="hidden" value={selectedDate} />
                              <input name="slotId" type="hidden" value={slot.id} />
                              <input name="action" type="hidden" value="block" />
                              <Textarea name="blockReason" maxLength={200} placeholder="Lý do khóa, ví dụ: bảo trì mặt sân" />
                              <Button type="submit" variant="outline" size="sm" className="w-fit">
                                <Lock className="mr-2 size-4" aria-hidden="true" />
                                Khóa slot
                              </Button>
                            </form>
                          ) : null}
                          {slot.status === TimeSlotStatus.BLOCKED ? (
                            <form action={toggleVenueSlotAction}>
                              <input name="venueId" type="hidden" value={venue.id} />
                              <input name="date" type="hidden" value={selectedDate} />
                              <input name="slotId" type="hidden" value={slot.id} />
                              <input name="action" type="hidden" value="unblock" />
                              <Button type="submit" variant="outline" size="sm" className="w-fit">
                                <Unlock className="mr-2 size-4" aria-hidden="true" />
                                Mở lại
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {resourceSlots.length === 0 ? (
                      <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Chưa có slot cho sân con này trong ngày đã chọn.
                      </div>
                    ) : null}
                  </section>
                );
              })}

              {resources.length === 0 ? (
                <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Hãy thêm ít nhất một sân con trước khi sinh slot.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
