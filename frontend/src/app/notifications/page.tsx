import { NotificationType, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { markNotificationReadAction } from "@/features/notifications/notification-actions";
import { listUserNotifications } from "@/features/notifications/notification-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function notificationText(type: NotificationType) {
  if (type === NotificationType.MATCH_JOIN_REQUESTED) return "Có người chơi muốn tham gia trận đấu của bạn.";
  if (type === NotificationType.MATCH_JOIN_APPROVED) return "Yêu cầu tham gia trận đấu của bạn đã được duyệt.";
  return "Yêu cầu tham gia trận đấu của bạn đã bị từ chối.";
}

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const notifications = await listUserNotifications(session.user.id);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Thông báo</h1>
          <p className="mt-3 text-muted-foreground">Các hoạt động liên quan đến trận đấu của bạn sẽ xuất hiện tại đây.</p>
        </div>

        <div className="grid gap-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={notification.readAt ? "bg-muted/30" : ""}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground">{notificationText(notification.type)}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{notification.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">Mã tham chiếu: {notification.referenceId}</p>
                  </div>
                  {notification.readAt ? (
                    <Badge variant="secondary">Đã đọc</Badge>
                  ) : (
                    <form action={markNotificationReadAction}>
                      <input name="notificationId" type="hidden" value={notification.id} />
                      <Button variant="outline" size="sm" type="submit">
                        Đánh dấu đã đọc
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {notifications.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Chưa có thông báo nào.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
