import { NotificationType, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { Bell, Mail, Trophy, CalendarDays, Inbox } from "lucide-react";

import { auth } from "@/auth";
import { markNotificationReadAction } from "@/features/notifications/notification-actions";
import { listUserNotifications } from "@/features/notifications/notification-service";
import { parsePage, calcTotalPages, firstParam } from "@/lib/pagination-utils";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type NotificationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 20;

function notificationText(type: NotificationType) {
  if (type === NotificationType.MATCH_JOIN_REQUESTED) return "Có người chơi muốn tham gia trận đấu của bạn.";
  if (type === NotificationType.MATCH_JOIN_APPROVED) return "Yêu cầu tham gia trận đấu của bạn đã được duyệt.";
  if (type === NotificationType.MATCH_UPDATED) return "Chủ trận đã thay đổi thông tin trận đấu, yêu cầu tham gia của bạn đã bị hủy tự động.";
  if (type === NotificationType.CHAT_MESSAGE) return "Bạn có tin nhắn mới.";
  if (type === NotificationType.BOOKING_REQUESTED) return "Có yêu cầu đặt sân mới cần bạn xác nhận.";
  if (type === NotificationType.BOOKING_CONFIRMED) return "Yêu cầu đặt sân của bạn đã được chủ sân xác nhận.";
  if (type === NotificationType.BOOKING_REJECTED) return "Yêu cầu đặt sân của bạn đã bị từ chối.";
  if (type === NotificationType.BOOKING_CANCELED) return "Một booking liên quan đến bạn đã bị hủy.";
  return "Yêu cầu tham gia trận đấu của bạn đã bị từ chối.";
}

function getNotificationIcon(type: NotificationType) {
  if (
    type === NotificationType.MATCH_JOIN_REQUESTED ||
    type === NotificationType.MATCH_JOIN_APPROVED ||
    type === NotificationType.MATCH_UPDATED
  ) {
    return <Trophy className="size-5 text-amber-500" />;
  }
  if (type === NotificationType.CHAT_MESSAGE) {
    return <Mail className="size-5 text-blue-500" />;
  }
  if (
    type === NotificationType.BOOKING_REQUESTED ||
    type === NotificationType.BOOKING_CONFIRMED ||
    type === NotificationType.BOOKING_REJECTED ||
    type === NotificationType.BOOKING_CANCELED
  ) {
    return <CalendarDays className="size-5 text-emerald-500" />;
  }
  return <Bell className="size-5 text-muted-foreground" />;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === UserRole.ADMIN) {
    redirect("/");
  }

  const params = await searchParams;
  const filters = {
    readStatus: (firstParam(params.readStatus) as "read" | "unread") || undefined,
    category: (firstParam(params.category) as "match" | "chat" | "booking") || undefined,
  };

  const { page, skip, take } = parsePage(params, PAGE_SIZE);

  const { items: notifications, totalCount } = await listUserNotifications(
    session.user.id,
    { ...filters, skip, take }
  );

  const totalPagesCount = calcTotalPages(totalCount, PAGE_SIZE);

  const paginationSearchParams: Record<string, string | undefined> = {
    readStatus: filters.readStatus,
    category: filters.category,
  };

  // Build redirect URL for the Server Action to redirect back with searchParams
  const searchParamsString = new URLSearchParams(
    Object.entries(paginationSearchParams).filter(([, v]) => v !== undefined) as string[][]
  ).toString();
  const currentPath = `/notifications${searchParamsString ? `?${searchParamsString}&page=${page}` : `?page=${page}`}`;

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-5 shadow-sm sm:p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Bell className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Thông báo</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Các hoạt động liên quan đến trận đấu, đặt sân và tin nhắn của bạn.
              </p>
            </div>
          </div>
        </header>

        {/* Filter Form */}
        <form className="grid gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trạng thái</label>
            <select
              name="readStatus"
              defaultValue={filters.readStatus ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Tất cả</option>
              <option value="unread">Chưa đọc</option>
              <option value="read">Đã đọc</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phân loại</label>
            <select
              name="category"
              defaultValue={filters.category ?? ""}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Tất cả phân loại</option>
              <option value="match">Trận đấu</option>
              <option value="chat">Tin nhắn</option>
              <option value="booking">Đặt sân</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto">Lọc thông báo</Button>
          </div>
        </form>

        <div className="grid gap-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`${notification.readAt ? "bg-muted/30 opacity-75" : "border-primary/20 shadow-sm"}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 rounded-lg p-2 ${notification.readAt ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className={`font-semibold text-foreground ${notification.readAt ? "" : "text-primary"}`}>
                          {notificationText(notification.type)}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {notification.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                        <p className="mt-1 text-[11px] font-mono text-muted-foreground/60">
                          ID tham chiếu: {notification.referenceId}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        {notification.readAt ? (
                          <Badge variant="secondary">Đã đọc</Badge>
                        ) : (
                          <form action={markNotificationReadAction}>
                            <input name="notificationId" type="hidden" value={notification.id} />
                            <input name="redirectTo" type="hidden" value={currentPath} />
                            <Button variant="outline" size="sm" type="submit">
                              Đánh dấu đã đọc
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              <Inbox className="mb-4 size-10 text-muted-foreground/50" />
              <p className="text-sm">Không tìm thấy thông báo nào phù hợp.</p>
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
              basePath="/notifications"
            />
          </div>
        )}
      </div>
    </main>
  );
}
