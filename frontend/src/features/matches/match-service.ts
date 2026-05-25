import {
  ConfigStatus,
  JoinRequestStatus,
  MatchStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { createMatchNotification } from "@/features/notifications/notification-service";

import type { MatchFormInput, EditMatchInput } from "./match-schemas";

export async function getMatchFormData(userId: string) {
  const [areas, sports, profile] = await Promise.all([
    prisma.area.findMany({
      where: { city: "Hanoi", status: ConfigStatus.ACTIVE },
      orderBy: [{ type: "desc" }, { name: "asc" }],
    }),
    prisma.sport.findMany({
      where: { status: ConfigStatus.ACTIVE },
      include: {
        skillLevels: {
          where: { status: ConfigStatus.ACTIVE },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.playerProfile.findUnique({
      where: { userId },
      select: { id: true },
    }),
  ]);

  return { areas, sports, profile };
}

export async function createMatch(ownerId: string, input: MatchFormInput) {
  const expectedLevelIds = [...new Set(input.expectedLevelIds ?? [])];
  const [profile, area, sport, levels] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { userId: ownerId }, select: { id: true } }),
    prisma.area.findFirst({
      where: { id: input.areaId, city: "Hanoi", status: ConfigStatus.ACTIVE },
      select: { id: true },
    }),
    prisma.sport.findFirst({
      where: { id: input.sportId, status: ConfigStatus.ACTIVE },
      select: { id: true },
    }),
    expectedLevelIds.length > 0
      ? prisma.skillLevel.findMany({
          where: {
            id: { in: expectedLevelIds },
            sportId: input.sportId,
            status: ConfigStatus.ACTIVE,
          },
          select: { id: true },
        })
      : [],
  ]);

  if (!profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  if (!area) {
    throw new Error("INVALID_AREA");
  }

  if (!sport) {
    throw new Error("INVALID_SPORT");
  }

  if (levels.length !== expectedLevelIds.length) {
    throw new Error("INVALID_LEVEL");
  }

  await prisma.$transaction(async (tx) => {
    const match = await tx.match.create({
      data: {
        ownerId,
        sportId: input.sportId,
        areaId: input.areaId,
        time: input.time,
        detailedAddress: input.detailedAddress || null,
        requiredPlayers: input.requiredPlayers,
        expectedLevelId: expectedLevelIds[0] || null,
        description: input.description || null,
      },
      select: { id: true },
    });

    if (expectedLevelIds.length > 0) {
      await tx.matchExpectedLevel.createMany({
        data: expectedLevelIds.map((skillLevelId) => ({
          matchId: match.id,
          skillLevelId,
        })),
      });
    }
  });
}

export async function editMatch(ownerId: string, input: EditMatchInput) {
  const expectedLevelIds = [...new Set(input.expectedLevelIds ?? [])];
  const [profile, area, sport, levels, existingMatch] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { userId: ownerId }, select: { id: true } }),
    prisma.area.findFirst({
      where: { id: input.areaId, city: "Hanoi", status: ConfigStatus.ACTIVE },
      select: { id: true },
    }),
    prisma.sport.findFirst({
      where: { id: input.sportId, status: ConfigStatus.ACTIVE },
      select: { id: true },
    }),
    expectedLevelIds.length > 0
      ? prisma.skillLevel.findMany({
          where: {
            id: { in: expectedLevelIds },
            sportId: input.sportId,
            status: ConfigStatus.ACTIVE,
          },
          select: { id: true },
        })
      : [],
    prisma.match.findUnique({
      where: { id: input.matchId },
      include: {
        joinRequests: {
          where: { status: { in: [JoinRequestStatus.PENDING, JoinRequestStatus.APPROVED] } },
        },
      },
    }),
  ]);

  if (!profile) throw new Error("PROFILE_REQUIRED");
  if (!area) throw new Error("INVALID_AREA");
  if (!sport) throw new Error("INVALID_SPORT");
  if (levels.length !== expectedLevelIds.length) throw new Error("INVALID_LEVEL");
  
  if (!existingMatch || existingMatch.ownerId !== ownerId) {
    throw new Error("MATCH_NOT_FOUND");
  }

  if (existingMatch.status === MatchStatus.CLOSED || existingMatch.status === MatchStatus.CANCELED) {
    throw new Error("MATCH_NOT_EDITABLE");
  }

  await prisma.$transaction(async (tx) => {
    // 1. Cập nhật thông tin trận đấu và chuyển về trạng thái OPEN
    await tx.match.update({
      where: { id: input.matchId },
      data: {
        sportId: input.sportId,
        areaId: input.areaId,
        time: input.time,
        detailedAddress: input.detailedAddress || null,
        requiredPlayers: input.requiredPlayers,
        expectedLevelId: expectedLevelIds[0] || null,
        description: input.description || null,
        status: MatchStatus.OPEN, // Đặt lại thành OPEN trong trường hợp đã FULL
      },
    });

    // 2. Cập nhật trình độ
    await tx.matchExpectedLevel.deleteMany({ where: { matchId: input.matchId } });
    if (expectedLevelIds.length > 0) {
      await tx.matchExpectedLevel.createMany({
        data: expectedLevelIds.map((skillLevelId) => ({
          matchId: input.matchId,
          skillLevelId,
        })),
      });
    }

    // 3. Hủy các request cũ và tạo thông báo
    if (existingMatch.joinRequests.length > 0) {
      await tx.matchJoinRequest.updateMany({
        where: { id: { in: existingMatch.joinRequests.map(r => r.id) } },
        data: { status: JoinRequestStatus.CANCELED },
      });

      await tx.notification.createMany({
        data: existingMatch.joinRequests.map((request) => ({
          recipientId: request.requesterId,
          type: NotificationType.MATCH_UPDATED,
          referenceId: input.matchId,
        })),
      });
    }
  });
}

export type MatchListTab = "open" | "full" | "mine" | "requests";

export async function listMatches(filters: { sportId?: string; areaId?: string; tab?: MatchListTab; viewerId?: string }) {
  const tab = filters.tab ?? "open";

  return prisma.match.findMany({
    where: {
      status:
        tab === "open"
          ? MatchStatus.OPEN
          : tab === "full"
            ? MatchStatus.FULL
            : { in: [MatchStatus.OPEN, MatchStatus.FULL, MatchStatus.CLOSED, MatchStatus.CANCELED] },
      ownerId: tab === "mine" ? filters.viewerId : undefined,
      joinRequests:
        tab === "requests" && filters.viewerId
          ? {
              some: {
                requesterId: filters.viewerId,
              },
            }
          : undefined,
      sportId: filters.sportId || undefined,
      areaId: filters.areaId || undefined,
      time: { gte: new Date() },
    },
    include: {
      owner: { select: { id: true, email: true, playerProfile: true } },
      sport: true,
      area: true,
      expectedLevel: true,
      expectedLevels: { include: { skillLevel: true } },
      joinRequests: true,
    },
    orderBy: { time: "asc" },
  });
}

export async function getMatchDetail(matchId: string, viewerId?: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      owner: { select: { id: true, email: true, playerProfile: true } },
      sport: true,
      area: true,
      expectedLevel: true,
      expectedLevels: { include: { skillLevel: true } },
      joinRequests: {
        include: {
          requester: { select: { id: true, email: true, playerProfile: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!match) {
    return null;
  }

  const viewerRequest = viewerId
    ? match.joinRequests.find((request) => request.requesterId === viewerId)
    : undefined;

  return { match, viewerRequest };
}

export async function requestJoinMatch(requesterId: string, matchId: string, message?: string) {
  const [profile, match] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { userId: requesterId }, select: { id: true } }),
    prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, ownerId: true, status: true },
    }),
  ]);

  if (!profile) {
    throw new Error("PROFILE_REQUIRED");
  }

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  if (match.ownerId === requesterId) {
    throw new Error("SELF_JOIN");
  }

  if (match.status !== MatchStatus.OPEN) {
    throw new Error("MATCH_NOT_OPEN");
  }

  let joinRequest;

  try {
    joinRequest = await prisma.matchJoinRequest.create({
      data: {
        matchId,
        requesterId,
        message: message || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("DUPLICATE_JOIN_REQUEST");
    }

    throw error;
  }

  await createMatchNotification({
    recipientId: match.ownerId,
    type: NotificationType.MATCH_JOIN_REQUESTED,
    referenceId: joinRequest.id,
  });
}

export async function approveJoinRequest(ownerId: string, joinRequestId: string) {
  await prisma.$transaction(async (tx) => {
    const joinRequest = await tx.matchJoinRequest.findUnique({
      where: { id: joinRequestId },
      include: { match: true },
    });

    if (!joinRequest || joinRequest.match.ownerId !== ownerId) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new Error("JOIN_REQUEST_NOT_PENDING");
    }

    if (joinRequest.match.status !== MatchStatus.OPEN) {
      throw new Error("MATCH_NOT_OPEN");
    }

    await tx.matchJoinRequest.update({
      where: { id: joinRequestId },
      data: { status: JoinRequestStatus.APPROVED },
    });

    const approvedCount = await tx.matchJoinRequest.count({
      where: {
        matchId: joinRequest.matchId,
        status: JoinRequestStatus.APPROVED,
      },
    });

    if (approvedCount >= joinRequest.match.requiredPlayers) {
      await tx.match.update({
        where: { id: joinRequest.matchId },
        data: { status: MatchStatus.FULL },
      });
    }

    await tx.notification.create({
      data: {
        recipientId: joinRequest.requesterId,
        type: NotificationType.MATCH_JOIN_APPROVED,
        referenceId: joinRequest.id,
      },
    });
  });
}

export async function rejectJoinRequest(ownerId: string, joinRequestId: string) {
  await prisma.$transaction(async (tx) => {
    const joinRequest = await tx.matchJoinRequest.findUnique({
      where: { id: joinRequestId },
      include: { match: true },
    });

    if (!joinRequest || joinRequest.match.ownerId !== ownerId) {
      throw new Error("JOIN_REQUEST_NOT_FOUND");
    }

    if (joinRequest.status !== JoinRequestStatus.PENDING) {
      throw new Error("JOIN_REQUEST_NOT_PENDING");
    }

    await tx.matchJoinRequest.update({
      where: { id: joinRequestId },
      data: { status: JoinRequestStatus.REJECTED },
    });

    await tx.notification.create({
      data: {
        recipientId: joinRequest.requesterId,
        type: NotificationType.MATCH_JOIN_REJECTED,
        referenceId: joinRequest.id,
      },
    });
  });
}

export async function closeMatch(ownerId: string, matchId: string) {
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      select: { id: true, ownerId: true, status: true, time: true },
    });

    if (!match || match.ownerId !== ownerId || (match.status !== MatchStatus.OPEN && match.status !== MatchStatus.FULL)) {
      throw new Error("MATCH_NOT_FOUND");
    }

    if (match.status !== MatchStatus.FULL && match.time > new Date()) {
      throw new Error("MATCH_CANNOT_CLOSE_YET");
    }

    await tx.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.CLOSED },
    });

    await tx.matchJoinRequest.updateMany({
      where: {
        matchId,
        status: JoinRequestStatus.PENDING,
      },
      data: { status: JoinRequestStatus.CANCELED },
    });
  });
}

export async function cancelMatch(ownerId: string, matchId: string) {
  await prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({
      where: { id: matchId },
      select: { id: true, ownerId: true, status: true, time: true },
    });

    if (!match || match.ownerId !== ownerId || (match.status !== MatchStatus.OPEN && match.status !== MatchStatus.FULL)) {
      throw new Error("MATCH_NOT_FOUND");
    }

    if (match.time <= new Date()) {
      throw new Error("MATCH_CANNOT_CANCEL_AFTER_START");
    }

    await tx.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.CANCELED },
    });

    await tx.matchJoinRequest.updateMany({
      where: {
        matchId,
        status: JoinRequestStatus.PENDING,
      },
      data: { status: JoinRequestStatus.CANCELED },
    });
  });
}
