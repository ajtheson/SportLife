import { z } from "zod";

export const venueOwnerProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, "Số điện thoại phải có đúng 10 chữ số."),
});

export type VenueOwnerProfileInput = z.infer<typeof venueOwnerProfileSchema>;
