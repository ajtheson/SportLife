import { BookingStatus } from "@prisma/client";
import { z } from "zod";

export const bookingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createBookingSchema = z.object({
  venueId: z.string().min(1),
  slotId: z.string().min(1),
  playerNote: z.string().trim().max(300).optional(),
});

export const ownerBookingDecisionSchema = z.object({
  bookingId: z.string().min(1),
  action: z.enum(["confirm", "reject", "cancel"]),
  reason: z.string().trim().max(200).optional(),
});

export const playerCancelBookingSchema = z.object({
  bookingId: z.string().min(1),
});

export const ownerBookingFilterSchema = z.object({
  venueId: z.string().optional(),
  status: z.enum(BookingStatus).optional(),
});

// Booking đang chiếm slot: chưa kết thúc và slot vẫn bị giữ chỗ.
export const activeBookingStatuses = [BookingStatus.PENDING, BookingStatus.CONFIRMED] as const;

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type OwnerBookingDecisionInput = z.infer<typeof ownerBookingDecisionSchema>;
export type PlayerCancelBookingInput = z.infer<typeof playerCancelBookingSchema>;
export type OwnerBookingFilterInput = z.infer<typeof ownerBookingFilterSchema>;
