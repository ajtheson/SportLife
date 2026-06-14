import { describe, expect, it } from "vitest";

import { startBookingChatSchema } from "@/features/chat/chat-schemas";

describe("chat schemas", () => {
  it("accepts a valid booking chat request", () => {
    expect(startBookingChatSchema.safeParse({ bookingId: "booking-id" }).success).toBe(true);
  });

  it("rejects a booking chat request with an empty id", () => {
    expect(startBookingChatSchema.safeParse({ bookingId: "" }).success).toBe(false);
  });

  it("rejects a booking chat request missing the id", () => {
    expect(startBookingChatSchema.safeParse({}).success).toBe(false);
  });
});
