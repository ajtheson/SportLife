import { ConfigStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type { PlayerProfileInput } from "./player-profile-schemas";

export async function getPlayerProfileFormData(userId: string) {
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
      include: { sportLevels: true },
    }),
  ]);

  return { areas, sports, profile };
}

export async function userHasPlayerProfile(userId: string) {
  const profile = await prisma.playerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  return Boolean(profile);
}

export async function savePlayerProfile(userId: string, input: PlayerProfileInput) {
  const [area, sports, existingPhoneOwner, existingProfile] = await Promise.all([
    prisma.area.findFirst({
      where: {
        id: input.areaId,
        city: "Hanoi",
        status: ConfigStatus.ACTIVE,
      },
      select: { id: true },
    }),
    prisma.sport.findMany({
      where: {
        id: { in: input.sportLevels.map((item) => item.sportId) },
        status: ConfigStatus.ACTIVE,
      },
      include: {
        skillLevels: {
          where: { status: ConfigStatus.ACTIVE },
          select: { id: true, sportId: true },
        },
      },
    }),
    prisma.playerProfile.findUnique({
      where: { phone: input.phone },
      select: { userId: true },
    }),
    prisma.playerProfile.findUnique({
      where: { userId },
      select: { id: true, phone: true },
    }),
  ]);

  if (!area) {
    throw new Error("INVALID_AREA");
  }

  if (existingPhoneOwner && existingPhoneOwner.userId !== userId) {
    throw new Error("PHONE_ALREADY_EXISTS");
  }

  const activeSports = new Map(sports.map((sport) => [sport.id, sport]));
  const selectedSportIds = new Set(input.sportLevels.map((item) => item.sportId));

  if (activeSports.size !== selectedSportIds.size) {
    throw new Error("INVALID_SPORT_LEVEL");
  }

  for (const selected of input.sportLevels) {
    const sport = activeSports.get(selected.sportId);
    const levelBelongsToSport = sport?.skillLevels.some((level) => level.id === selected.skillLevelId);

    if (!levelBelongsToSport) {
      throw new Error("INVALID_SPORT_LEVEL");
    }
  }

  const profileData = {
    displayName: input.displayName,
    phone: input.phone,
    areaId: input.areaId,
    introduction: input.introduction || null,
    availability: input.availability || null,
    ...(input.avatarUrl ? { avatarUrl: input.avatarUrl } : {}),
  };

  await prisma.$transaction(async (tx) => {
    const profile = existingProfile
      ? await tx.playerProfile.update({
          where: { userId },
          data: profileData,
          select: { id: true },
        })
      : await tx.playerProfile.create({
          data: {
            userId,
            ...profileData,
          },
          select: { id: true },
        });

    if (existingProfile && existingProfile.phone !== input.phone) {
      await tx.user.update({
        where: { id: userId },
        data: { phoneVerifiedAt: null },
      });
    }

    await tx.playerSportLevel.deleteMany({
      where: { playerProfileId: profile.id },
    });

    await tx.playerSportLevel.createMany({
      data: input.sportLevels.map((item) => ({
        playerProfileId: profile.id,
        sportId: item.sportId,
        skillLevelId: item.skillLevelId,
      })),
    });
  });
}
