import { z } from "zod";

export const venueOwnerProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits."),
});

export type VenueOwnerProfileInput = z.infer<typeof venueOwnerProfileSchema>;
