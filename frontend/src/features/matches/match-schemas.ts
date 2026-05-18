import { z } from "zod";

export const matchFormSchema = z.object({
  sportId: z.string().min(1),
  areaId: z.string().min(1),
  time: z.coerce.date().refine((value) => value > new Date(), "Match time must be in the future."),
  detailedAddress: z.string().trim().max(240).optional(),
  requiredPlayers: z.coerce.number().int().min(1).max(50),
  expectedLevelIds: z.array(z.string().min(1)).max(10).optional(),
  description: z.string().trim().max(1000).optional(),
});

export const matchIdSchema = z.object({
  matchId: z.string().min(1),
});

export const joinRequestSchema = z.object({
  matchId: z.string().min(1),
  message: z.string().trim().max(500).optional(),
});

export const joinRequestIdSchema = z.object({
  joinRequestId: z.string().min(1),
});

export const matchStatusActionSchema = z.object({
  matchId: z.string().min(1),
});

export type MatchFormInput = z.infer<typeof matchFormSchema>;
