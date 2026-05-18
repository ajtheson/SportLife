import { ConfigStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import type {
  createAreaSchema,
  createSkillLevelSchema,
  createSportSchema,
  updateAreaSchema,
  updateAreaStatusSchema,
  updateSkillLevelSchema,
  updateSkillLevelStatusSchema,
  updateSportSchema,
  updateSportStatusSchema,
} from "./config-schemas";
import type { z } from "zod";

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function getConfigDashboardCounts() {
  const [sports, skillLevels, areas] = await Promise.all([
    prisma.sport.count({ where: { status: ConfigStatus.ACTIVE } }),
    prisma.skillLevel.count({ where: { status: ConfigStatus.ACTIVE } }),
    prisma.area.count({ where: { city: "Hanoi", status: ConfigStatus.ACTIVE } }),
  ]);

  return { sports, skillLevels, areas };
}

export async function listSports() {
  return prisma.sport.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { skillLevels: true, playerSportLevels: true, venueSports: true, matches: true },
      },
    },
  });
}

export async function createSport(input: z.infer<typeof createSportSchema>) {
  await prisma.sport.create({
    data: {
      name: input.name,
      status: ConfigStatus.ACTIVE,
    },
  });
}

export async function updateSportStatus(input: z.infer<typeof updateSportStatusSchema>) {
  await prisma.sport.update({
    where: { id: input.sportId },
    data: { status: input.status },
  });
}

export async function updateSport(input: z.infer<typeof updateSportSchema>) {
  await prisma.sport.update({
    where: { id: input.sportId },
    data: { name: input.name },
  });
}

export async function listSkillLevels() {
  return prisma.sport.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      skillLevels: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function createSkillLevel(input: z.infer<typeof createSkillLevelSchema>) {
  const sport = await prisma.sport.findFirst({
    where: { id: input.sportId, status: ConfigStatus.ACTIVE },
    select: { id: true },
  });

  if (!sport) {
    throw new Error("INVALID_SPORT");
  }

  await prisma.skillLevel.create({
    data: {
      sportId: input.sportId,
      name: input.name,
      order: input.order,
      status: ConfigStatus.ACTIVE,
    },
  });
}

export async function updateSkillLevelStatus(input: z.infer<typeof updateSkillLevelStatusSchema>) {
  await prisma.skillLevel.update({
    where: { id: input.skillLevelId },
    data: { status: input.status },
  });
}

export async function updateSkillLevel(input: z.infer<typeof updateSkillLevelSchema>) {
  await prisma.skillLevel.update({
    where: { id: input.skillLevelId },
    data: {
      name: input.name,
      order: input.order,
    },
  });
}

export async function listAreas() {
  return prisma.area.findMany({
    where: { city: "Hanoi" },
    orderBy: [{ status: "asc" }, { type: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: { playerProfiles: true, venues: true, matches: true, communityPosts: true },
      },
    },
  });
}

export async function createArea(input: z.infer<typeof createAreaSchema>) {
  await prisma.area.create({
    data: {
      city: "Hanoi",
      name: input.name,
      type: input.type,
      status: ConfigStatus.ACTIVE,
    },
  });
}

export async function updateAreaStatus(input: z.infer<typeof updateAreaStatusSchema>) {
  await prisma.area.update({
    where: { id: input.areaId },
    data: { status: input.status },
  });
}

export async function updateArea(input: z.infer<typeof updateAreaSchema>) {
  await prisma.area.update({
    where: { id: input.areaId },
    data: {
      name: input.name,
      type: input.type,
    },
  });
}
