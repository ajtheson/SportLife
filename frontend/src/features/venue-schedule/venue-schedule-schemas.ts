import { TimeSlotStatus, VenueResourceStatus } from "@prisma/client";
import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const scheduleDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const venueResourceSchema = z.object({
  venueId: z.string().min(1),
  resourceId: z.string().optional(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
  status: z.enum(VenueResourceStatus).default(VenueResourceStatus.ACTIVE),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const venueScheduleRuleSchema = z
  .object({
    venueId: z.string().min(1),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    isOpen: z.coerce.boolean().default(false),
    startTime: timeSchema,
    endTime: timeSchema,
    slotDurationMinutes: z.coerce.number().int().refine((value) => [30, 60, 90, 120].includes(value)),
  })
  .refine((value) => !value.isOpen || value.startTime < value.endTime, {
    message: "Giờ kết thúc phải sau giờ bắt đầu.",
    path: ["endTime"],
  });

export const generateVenueSlotsSchema = z.object({
  venueId: z.string().min(1),
  date: scheduleDateSchema,
});

export const toggleVenueSlotSchema = z.object({
  venueId: z.string().min(1),
  slotId: z.string().min(1),
  action: z.enum(["block", "unblock"]),
  blockReason: z.string().trim().max(200).optional(),
});

export const editableTimeSlotStatuses = new Set<TimeSlotStatus>([
  TimeSlotStatus.AVAILABLE,
  TimeSlotStatus.BLOCKED,
]);

export type VenueResourceInput = z.infer<typeof venueResourceSchema>;
export type VenueScheduleRuleInput = z.infer<typeof venueScheduleRuleSchema>;
export type GenerateVenueSlotsInput = z.infer<typeof generateVenueSlotsSchema>;
export type ToggleVenueSlotInput = z.infer<typeof toggleVenueSlotSchema>;
