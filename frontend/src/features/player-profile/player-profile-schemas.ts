import { z } from "zod";

export const playerProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\d{10}$/, "Số điện thoại phải có đúng 10 chữ số."),
  areaId: z.string().min(1),
  introduction: z.string().trim().max(500).optional(),
  availability: z.string().trim().max(300).optional(),
  sportLevels: z
    .array(
      z.object({
        sportId: z.string().min(1),
        skillLevelId: z.string().min(1),
      }),
    )
    .min(1),
});

export type PlayerProfileInput = z.infer<typeof playerProfileSchema>;
