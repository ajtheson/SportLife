import { NotificationType, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { markNotificationReadAction } from "@/features/notifications/notification-actions";
import { listUserNotifications } from "@/features/notifications/notification-service";

function notificationText(type: NotificationType) {
  if (type === NotificationType.MATCH_JOIN_REQUESTED) return "A player requested to join your match.";
  if (type === NotificationType.MATCH_JOIN_APPROVED) return "Your match join request was approved.";
  return "Your match join request was rejected.";
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
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="mt-3 text-[#5f6b63]">Match join request activity appears here.</p>
        </div>

        <div className="grid gap-3">
          {notifications.map((notification) => (
            <article key={notification.id} className="rounded-lg border border-[#d9d2c1] bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{notificationText(notification.type)}</h2>
                  <p className="mt-2 text-sm text-[#5f6b63]">{notification.createdAt.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-[#6d766f]">Reference: {notification.referenceId}</p>
                </div>
                {notification.readAt ? (
                  <span className="rounded-md bg-[#eef1ec] px-2 py-1 text-xs font-semibold">Read</span>
                ) : (
                  <form action={markNotificationReadAction}>
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <button className="rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" type="submit">
                      Mark read
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}

          {notifications.length === 0 ? (
            <div className="rounded-lg border border-[#d9d2c1] bg-white p-5 text-sm text-[#5f6b63]">
              No notifications yet.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
