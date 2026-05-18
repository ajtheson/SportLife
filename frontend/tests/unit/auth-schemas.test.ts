import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { registerSchema, resetPasswordSchema } from "@/features/auth/auth-schemas";

describe("auth schemas", () => {
  it("allows public player and venue owner registration", () => {
    expect(
      registerSchema.safeParse({
        email: "PLAYER@EXAMPLE.COM",
        password: "password123",
        confirmPassword: "password123",
        role: UserRole.PLAYER,
      }).success,
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        email: "owner@example.com",
        password: "password123",
        confirmPassword: "password123",
        role: UserRole.VENUE_OWNER,
      }).success,
    ).toBe(true);
  });

  it("rejects admin self-registration", () => {
    expect(
      registerSchema.safeParse({
        email: "admin@example.com",
        password: "password123",
        confirmPassword: "password123",
        role: UserRole.ADMIN,
      }).success,
    ).toBe(false);
  });

  it("requires matching reset passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "token",
        password: "password123",
        confirmPassword: "different123",
      }).success,
    ).toBe(false);
  });
});
