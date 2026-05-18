import { describe, expect, it } from "vitest";

import { rejectVenueSchema, venueFormSchema } from "@/features/venues/venue-schemas";
import { venueOwnerProfileSchema } from "@/features/venue-owner-profile/venue-owner-profile-schemas";

describe("venue schemas", () => {
  it("accepts a valid venue owner profile", () => {
    expect(venueOwnerProfileSchema.safeParse({ businessName: "SportLife Club", phone: "0912345678" }).success).toBe(
      true,
    );
  });

  it("requires 10 digit phone numbers", () => {
    expect(venueOwnerProfileSchema.safeParse({ businessName: "SportLife Club", phone: "091234567" }).success).toBe(
      false,
    );
    expect(
      venueFormSchema.safeParse({
        name: "Badminton Club",
        address: "123 Hanoi Street",
        areaId: "area-id",
        phone: "091234567a",
        sportId: "sport-id",
      }).success,
    ).toBe(false);
  });

  it("requires one sport and valid image urls", () => {
    expect(
      venueFormSchema.safeParse({
        name: "Badminton Club",
        address: "123 Hanoi Street",
        areaId: "area-id",
        phone: "0912345678",
        sportId: "",
      }).success,
    ).toBe(false);

    expect(
      venueFormSchema.safeParse({
        name: "Badminton Club",
        address: "123 Hanoi Street",
        areaId: "area-id",
        phone: "0912345678",
        sportId: "sport-id",
        availabilityNote: "Available weekday evenings",
        imageUrls: ["not-a-url"],
      }).success,
    ).toBe(false);
  });

  it("requires rejection reason", () => {
    expect(rejectVenueSchema.safeParse({ venueId: "venue-id", rejectionReason: "Missing address detail" }).success).toBe(
      true,
    );
    expect(rejectVenueSchema.safeParse({ venueId: "venue-id", rejectionReason: "" }).success).toBe(false);
  });
});
