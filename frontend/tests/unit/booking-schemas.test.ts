import { describe, expect, it } from "vitest";

import {
  createBookingSchema,
  ownerBookingDecisionSchema,
  playerCancelBookingSchema,
} from "@/features/bookings/booking-schemas";

describe("booking schemas", () => {
  it("accepts a valid booking request", () => {
    expect(
      createBookingSchema.safeParse({
        venueId: "venue-id",
        slotId: "slot-id",
        playerNote: "Đến lúc 19h",
      }).success,
    ).toBe(true);
  });

  it("rejects a booking request missing the slot", () => {
    expect(createBookingSchema.safeParse({ venueId: "venue-id" }).success).toBe(false);
  });

  it("rejects a player note longer than 300 characters", () => {
    expect(
      createBookingSchema.safeParse({
        venueId: "venue-id",
        slotId: "slot-id",
        playerNote: "x".repeat(301),
      }).success,
    ).toBe(false);
  });

  it("accepts supported owner decisions and rejects unknown ones", () => {
    expect(ownerBookingDecisionSchema.safeParse({ bookingId: "b1", action: "confirm" }).success).toBe(true);
    expect(ownerBookingDecisionSchema.safeParse({ bookingId: "b1", action: "reject", reason: "Bận" }).success).toBe(true);
    expect(ownerBookingDecisionSchema.safeParse({ bookingId: "b1", action: "approve" }).success).toBe(false);
  });

  it("requires a booking id when a player cancels", () => {
    expect(playerCancelBookingSchema.safeParse({ bookingId: "b1" }).success).toBe(true);
    expect(playerCancelBookingSchema.safeParse({ bookingId: "" }).success).toBe(false);
  });
});
