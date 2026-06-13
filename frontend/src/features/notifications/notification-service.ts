import { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function createMatchNotification(input: {
  recipientId: string;
  type: NotificationType;
  referenceId: string;
}) {
  await prisma.notification.create({
    data: input,
  });
}

export async function listUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { recipientId: userId, readAt: null },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientId: userId,
    },
    data: { readAt: new Date() },
  });
}
