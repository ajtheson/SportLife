import { ApprovalStatus, JoinRequestStatus, NotificationType, UserRole, UserStatus, VisibilityStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

function orderedUserIds(userId: string, otherUserId: string) {
  return [userId, otherUserId].sort() as [string, string];
}

async function assertChatReady(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      emailVerified: true,
      playerProfile: { select: { id: true } },
      venueOwnerProfile: { select: { id: true } },
    },
  });

  if (!user || user.status !== UserStatus.ACTIVE || !user.emailVerified) {
    throw new Error("CHAT_NOT_ALLOWED");
  }

  if (user.role === UserRole.PLAYER && !user.playerProfile) {
    throw new Error("PLAYER_PROFILE_REQUIRED");
  }

  if (user.role === UserRole.VENUE_OWNER && !user.venueOwnerProfile) {
    throw new Error("VENUE_OWNER_PROFILE_REQUIRED");
  }

  if (user.role === UserRole.ADMIN) {
    throw new Error("CHAT_NOT_ALLOWED");
  }

  return user;
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string,
  context?: { venueId?: string; matchId?: string; bookingId?: string },
) {
  if (userId === otherUserId) {
    throw new Error("SELF_CHAT");
  }

  await Promise.all([assertChatReady(userId), assertChatReady(otherUserId)]);

  const [userAId, userBId] = orderedUserIds(userId, otherUserId);

  return prisma.conversation.upsert({
    where: {
      userAId_userBId: {
        userAId,
        userBId,
      },
    },
    update: {
      venueContextId: context?.venueId ?? undefined,
      matchContextId: context?.matchId ?? undefined,
      bookingContextId: context?.bookingId ?? undefined,
    },
    create: {
      userAId,
      userBId,
      venueContextId: context?.venueId,
      matchContextId: context?.matchId,
      bookingContextId: context?.bookingId,
    },
  });
}

export async function startVenueConversation(userId: string, venueId: string) {
  const user = await assertChatReady(userId);

  if (user.role !== UserRole.PLAYER) {
    throw new Error("CHAT_NOT_ALLOWED");
  }

  const venue = await prisma.venue.findFirst({
    where: {
      id: venueId,
      approvalStatus: ApprovalStatus.APPROVED,
      visibilityStatus: VisibilityStatus.ACTIVE,
    },
    select: { ownerId: true },
  });

  if (!venue) {
    throw new Error("VENUE_NOT_FOUND");
  }

  return getOrCreateConversation(userId, venue.ownerId, { venueId });
}

export async function startMatchConversation(userId: string, matchId: string, otherUserId: string) {
  const user = await assertChatReady(userId);

  if (user.role !== UserRole.PLAYER) {
    throw new Error("CHAT_NOT_ALLOWED");
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      joinRequests: {
        where: { status: JoinRequestStatus.APPROVED },
        select: { requesterId: true },
      },
    },
  });

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  const approvedPlayerIds = new Set([match.ownerId, ...match.joinRequests.map((request) => request.requesterId)]);

  if (!approvedPlayerIds.has(userId) || !approvedPlayerIds.has(otherUserId)) {
    throw new Error("MATCH_CHAT_NOT_ALLOWED");
  }

  return getOrCreateConversation(userId, otherUserId, { matchId });
}

export async function startBookingConversation(userId: string, bookingId: string) {
  await assertChatReady(userId);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, playerId: true, venue: { select: { ownerId: true } } },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  const ownerId = booking.venue.ownerId;
  let otherUserId: string;

  if (userId === booking.playerId) {
    otherUserId = ownerId;
  } else if (userId === ownerId) {
    otherUserId = booking.playerId;
  } else {
    throw new Error("BOOKING_CHAT_NOT_ALLOWED");
  }

  return getOrCreateConversation(userId, otherUserId, { bookingId });
}

export async function listConversations(userId: string) {
  await assertChatReady(userId);

  return prisma.conversation.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, email: true, playerProfile: true, venueOwnerProfile: true } },
      userB: { select: { id: true, email: true, playerProfile: true, venueOwnerProfile: true } },
      venueContext: { select: { id: true, name: true } },
      matchContext: { select: { id: true, sport: { select: { name: true } }, area: { select: { name: true } }, time: true } },
      bookingContext: {
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
          venue: { select: { name: true } },
          resource: { select: { name: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function countUnreadMessages(userId: string) {
  return prisma.chatMessage.count({
    where: {
      senderId: { not: userId },
      readAt: null,
      conversation: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    },
  });
}

export async function getConversationDetail(userId: string, conversationId: string) {
  await assertChatReady(userId);

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { select: { id: true, email: true, playerProfile: true, venueOwnerProfile: true } },
      userB: { select: { id: true, email: true, playerProfile: true, venueOwnerProfile: true } },
      venueContext: { select: { id: true, name: true } },
      matchContext: { select: { id: true, sport: { select: { name: true } }, area: { select: { name: true } }, time: true } },
      bookingContext: {
        select: {
          id: true,
          status: true,
          startAt: true,
          endAt: true,
          playerId: true,
          venue: { select: { name: true } },
          resource: { select: { name: true } },
        },
      },
      messages: {
        include: {
          sender: { select: { id: true, email: true, playerProfile: true, venueOwnerProfile: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });

  if (!conversation) {
    return null;
  }

  await prisma.chatMessage.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return conversation;
}

export async function sendChatMessage(userId: string, conversationId: string, content: string) {
  await assertChatReady(userId);

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    select: { id: true, userAId: true, userBId: true },
  });

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const recipientId = conversation.userAId === userId ? conversation.userBId : conversation.userAId;

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
    });

    await tx.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: createdMessage.createdAt },
    });

    await tx.notification.create({
      data: {
        recipientId,
        type: NotificationType.CHAT_MESSAGE,
        referenceId: conversationId,
      },
    });

    return createdMessage;
  });

  return message;
}

export function chatParticipantName(participant: {
  email: string | null;
  playerProfile: { displayName: string } | null;
  venueOwnerProfile: { businessName: string } | null;
}) {
  return participant.playerProfile?.displayName ?? participant.venueOwnerProfile?.businessName ?? participant.email ?? "Người dùng";
}
