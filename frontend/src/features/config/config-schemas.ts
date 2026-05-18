import { ConfigStatus } from "@prisma/client";
import { z } from "zod";

export const configStatusSchema = z.enum([ConfigStatus.ACTIVE, ConfigStatus.INACTIVE]);

export const createSportSchema = z.object({
  name: z.string().trim().min(2).max(60),
});

export const updateSportStatusSchema = z.object({
  sportId: z.string().min(1),
  status: configStatusSchema,
});

export const updateSportSchema = z.object({
  sportId: z.string().min(1),
  name: z.string().trim().min(2).max(60),
});

export const createSkillLevelSchema = z.object({
  sportId: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  order: z.coerce.number().int().min(1).max(100),
});

export const updateSkillLevelStatusSchema = z.object({
  skillLevelId: z.string().min(1),
  status: configStatusSchema,
});

export const updateSkillLevelSchema = z.object({
  skillLevelId: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  order: z.coerce.number().int().min(1).max(100),
});

export const createAreaSchema = z.object({
  name: z.string().trim().min(2).max(100),
  type: z.enum(["ward", "commune"]),
});

export const updateAreaStatusSchema = z.object({
  areaId: z.string().min(1),
  status: configStatusSchema,
});

export const updateAreaSchema = z.object({
  areaId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  type: z.enum(["ward", "commune"]),
});
