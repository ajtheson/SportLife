import { z } from "zod";

const venueImageUrlSchema = z
  .string()
  .trim()
  .refine((value) => {
    if (value.startsWith("/uploads/venues/")) {
      return true;
    }

    return z.string().url().safeParse(value).success;
  }, "Ảnh sân phải là URL hợp lệ hoặc ảnh đã tải lên.");

export const venueFormSchema = z.object({
  venueId: z.string().optional(),
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(240),
  areaId: z.string().min(1),
  phone: z.string().trim().regex(/^\d{10}$/, "Số điện thoại phải có đúng 10 chữ số."),
  description: z.string().trim().max(1000).optional(),
  availabilityNote: z.string().trim().max(300).optional(),
  openingHours: z.string().trim().max(300).optional(),
  referencePrice: z.string().trim().max(120).optional(),
  sportId: z.string().min(1),
  imageUrls: z.array(venueImageUrlSchema).max(5).optional(),
});

export const venueIdSchema = z.object({
  venueId: z.string().min(1),
});

export const rejectVenueSchema = z.object({
  venueId: z.string().min(1),
  rejectionReason: z.string().trim().min(3).max(500),
});

export type VenueFormInput = z.infer<typeof venueFormSchema>;
