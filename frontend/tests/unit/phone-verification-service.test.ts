import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { generateOtpCode } from "@/lib/auth/tokens";
import { maskPhone, userNeedsPhoneVerification } from "@/features/auth/phone-verification-service";

describe("generateOtpCode", () => {
  it("generates a 6-character string of digits", () => {
    const code = generateOtpCode();
    expect(code).toHaveLength(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("generates codes in range 000000–999999", () => {
    const numeric = parseInt(generateOtpCode(), 10);
    expect(numeric).toBeGreaterThanOrEqual(0);
    expect(numeric).toBeLessThanOrEqual(999_999);
  });

  it("produces unique codes across calls (probabilistically)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateOtpCode()));
    // With 1M possible codes, 20 draws being all unique is overwhelmingly likely
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("maskPhone", () => {
  it("masks middle digits of a 10-digit phone number", () => {
    expect(maskPhone("0912345678")).toBe("09****678");
  });

  it("preserves the first 2 characters and last 3 characters", () => {
    const masked = maskPhone("0987654321");
    expect(masked.startsWith("09")).toBe(true);
    expect(masked.endsWith("321")).toBe(true);
    expect(masked).toContain("****");
  });

  it("returns the phone as-is when shorter than 4 characters", () => {
    expect(maskPhone("09")).toBe("09");
    expect(maskPhone("")).toBe("");
  });
});

describe("userNeedsPhoneVerification", () => {
  it("returns true for PLAYER without phoneVerifiedAt", () => {
    expect(
      userNeedsPhoneVerification({ role: UserRole.PLAYER, phoneVerifiedAt: null }),
    ).toBe(true);
  });

  it("returns true for VENUE_OWNER without phoneVerifiedAt", () => {
    expect(
      userNeedsPhoneVerification({ role: UserRole.VENUE_OWNER, phoneVerifiedAt: null }),
    ).toBe(true);
  });

  it("returns false for PLAYER who already verified", () => {
    expect(
      userNeedsPhoneVerification({ role: UserRole.PLAYER, phoneVerifiedAt: new Date() }),
    ).toBe(false);
  });

  it("returns false for ADMIN regardless of phoneVerifiedAt", () => {
    expect(
      userNeedsPhoneVerification({ role: UserRole.ADMIN, phoneVerifiedAt: null }),
    ).toBe(false);
    expect(
      userNeedsPhoneVerification({ role: UserRole.ADMIN, phoneVerifiedAt: new Date() }),
    ).toBe(false);
  });
});
