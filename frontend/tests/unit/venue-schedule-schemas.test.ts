import { VenueResourceStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  generateVenueSlotsSchema,
  toggleVenueSlotSchema,
  venueResourceSchema,
  venueScheduleRuleSchema,
} from "@/features/venue-schedule/venue-schedule-schemas";

describe("venue schedule schemas", () => {
  it("accepts a valid venue resource", () => {
    expect(
      venueResourceSchema.safeParse({
        venueId: "venue-id",
        name: "Court A",
        description: "Near the entrance",
        status: VenueResourceStatus.ACTIVE,
        sortOrder: 1,
      }).success,
    ).toBe(true);
  });

  it("requires operating hours to be ordered when a day is open", () => {
    expect(
      venueScheduleRuleSchema.safeParse({
        venueId: "venue-id",
        dayOfWeek: 1,
        isOpen: true,
        startTime: "06:00",
        endTime: "22:00",
        slotDurationMinutes: 60,
      }).success,
    ).toBe(true);

    expect(
      venueScheduleRuleSchema.safeParse({
        venueId: "venue-id",
        dayOfWeek: 1,
        isOpen: true,
        startTime: "22:00",
        endTime: "06:00",
        slotDurationMinutes: 60,
      }).success,
    ).toBe(false);
  });

  it("allows only supported slot durations", () => {
    expect(
      venueScheduleRuleSchema.safeParse({
        venueId: "venue-id",
        dayOfWeek: 2,
        isOpen: true,
        startTime: "07:00",
        endTime: "11:00",
        slotDurationMinutes: 45,
      }).success,
    ).toBe(false);
  });

  it("validates slot generation and manual block inputs", () => {
    expect(generateVenueSlotsSchema.safeParse({ venueId: "venue-id", date: "2026-06-13" }).success).toBe(true);
    expect(generateVenueSlotsSchema.safeParse({ venueId: "venue-id", date: "13/06/2026" }).success).toBe(false);
    expect(toggleVenueSlotSchema.safeParse({ venueId: "venue-id", slotId: "slot-id", action: "block" }).success).toBe(
      true,
    );
    expect(toggleVenueSlotSchema.safeParse({ venueId: "venue-id", slotId: "slot-id", action: "book" }).success).toBe(
      false,
    );
  });
});
