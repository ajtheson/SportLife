import { BookingStatus, TimeSlotStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  SLOT_STATUS_ON_REQUEST,
  ownerCanDecide,
  ownerDecisionTransition,
  playerCanCancel,
  playerCancelTransition,
} from "@/features/bookings/booking-transitions";

describe("booking transitions", () => {
  it("holds the slot as pending confirmation when a request is created", () => {
    expect(SLOT_STATUS_ON_REQUEST).toBe(TimeSlotStatus.PENDING_CONFIRMATION);
  });

  it("maps owner confirm to a booked slot", () => {
    expect(ownerDecisionTransition("confirm")).toEqual({
      bookingStatus: BookingStatus.CONFIRMED,
      slotStatus: TimeSlotStatus.BOOKED,
    });
  });

  it("frees the slot when the owner rejects or cancels", () => {
    expect(ownerDecisionTransition("reject")).toEqual({
      bookingStatus: BookingStatus.REJECTED,
      slotStatus: TimeSlotStatus.AVAILABLE,
    });
    expect(ownerDecisionTransition("cancel")).toEqual({
      bookingStatus: BookingStatus.CANCELED_BY_OWNER,
      slotStatus: TimeSlotStatus.AVAILABLE,
    });
  });

  it("frees the slot when a player cancels", () => {
    expect(playerCancelTransition()).toEqual({
      bookingStatus: BookingStatus.CANCELED_BY_PLAYER,
      slotStatus: TimeSlotStatus.AVAILABLE,
    });
  });

  it("only allows confirm/reject on pending bookings", () => {
    expect(ownerCanDecide(BookingStatus.PENDING, "confirm")).toBe(true);
    expect(ownerCanDecide(BookingStatus.PENDING, "reject")).toBe(true);
    expect(ownerCanDecide(BookingStatus.CONFIRMED, "confirm")).toBe(false);
    expect(ownerCanDecide(BookingStatus.REJECTED, "reject")).toBe(false);
  });

  it("allows owner cancel on pending or confirmed bookings", () => {
    expect(ownerCanDecide(BookingStatus.CONFIRMED, "cancel")).toBe(true);
    expect(ownerCanDecide(BookingStatus.PENDING, "cancel")).toBe(true);
    expect(ownerCanDecide(BookingStatus.REJECTED, "cancel")).toBe(false);
  });

  it("lets a player cancel only pending or confirmed bookings", () => {
    expect(playerCanCancel(BookingStatus.PENDING)).toBe(true);
    expect(playerCanCancel(BookingStatus.CONFIRMED)).toBe(true);
    expect(playerCanCancel(BookingStatus.REJECTED)).toBe(false);
    expect(playerCanCancel(BookingStatus.CANCELED_BY_OWNER)).toBe(false);
  });
});
