import { describe, expect, it } from "vitest";

import { phoneOtpSchema } from "@/features/auth/auth-schemas";

describe("phoneOtpSchema", () => {
  it("accepts a valid 6-digit code", () => {
    expect(phoneOtpSchema.safeParse({ code: "123456" }).success).toBe(true);
    expect(phoneOtpSchema.safeParse({ code: "000000" }).success).toBe(true);
    expect(phoneOtpSchema.safeParse({ code: "999999" }).success).toBe(true);
  });

  it("rejects codes shorter or longer than 6 digits", () => {
    expect(phoneOtpSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(phoneOtpSchema.safeParse({ code: "1234567" }).success).toBe(false);
    expect(phoneOtpSchema.safeParse({ code: "" }).success).toBe(false);
  });

  it("rejects codes with non-digit characters", () => {
    expect(phoneOtpSchema.safeParse({ code: "12345a" }).success).toBe(false);
    expect(phoneOtpSchema.safeParse({ code: "12 345" }).success).toBe(false);
    expect(phoneOtpSchema.safeParse({ code: "12345!" }).success).toBe(false);
  });

  it("trims whitespace before validating", () => {
    // z.string().trim() normalises "  123456  " to "123456" which is valid
    expect(phoneOtpSchema.safeParse({ code: "  123456  " }).success).toBe(true);
  });
});
