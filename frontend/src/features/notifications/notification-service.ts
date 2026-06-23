import { NotificationType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

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

export async function listUserNotifications(
  userId: string,
  filters: {
    readStatus?: "unread" | "read";
    category?: "match" | "chat" | "booking";
    skip?: number;
    take?: number;
  } = {},
) {
  const matchTypes = [
    NotificationType.MATCH_JOIN_REQUESTED,
    NotificationType.MATCH_JOIN_APPROVED,
    NotificationType.MATCH_UPDATED,
  ];
  const chatTypes = [NotificationType.CHAT_MESSAGE];
  const bookingTypes = [
    NotificationType.BOOKING_REQUESTED,
    NotificationType.BOOKING_CONFIRMED,
    NotificationType.BOOKING_REJECTED,
    NotificationType.BOOKING_CANCELED,
  ];

  const where: Prisma.NotificationWhereInput = {
    recipientId: userId,
    readAt:
      filters.readStatus === "unread"
        ? null
        : filters.readStatus === "read"
          ? { not: null }
          : undefined,
    type:
      filters.category === "match"
        ? { in: matchTypes }
        : filters.category === "chat"
          ? { in: chatTypes }
          : filters.category === "booking"
            ? { in: bookingTypes }
            : undefined,
  };

  const [totalCount, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: filters.skip,
      take: filters.take,
    }),
  ]);

  return { items, totalCount };
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
