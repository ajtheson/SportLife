import { describe, expect, it } from "vitest";

import { joinRequestSchema, matchFormSchema } from "@/features/matches/match-schemas";

describe("match schemas", () => {
  it("accepts valid match creation input", () => {
    expect(
      matchFormSchema.safeParse({
        sportId: "sport-id",
        areaId: "area-id",
        time: new Date(Date.now() + 60 * 60 * 1000),
        detailedAddress: "Court 2, 123 Hanoi Street",
        requiredPlayers: 2,
        expectedLevelIds: ["level-1", "level-2"],
        description: "Evening match",
      }).success,
    ).toBe(true);
  });

  it("rejects past match time and zero required players", () => {
    expect(
      matchFormSchema.safeParse({
        sportId: "sport-id",
        areaId: "area-id",
        time: new Date(Date.now() - 60 * 60 * 1000),
        requiredPlayers: 0,
      }).success,
    ).toBe(false);
  });

  it("limits join request messages", () => {
    expect(joinRequestSchema.safeParse({ matchId: "match-id", message: "Can join" }).success).toBe(true);
    expect(joinRequestSchema.safeParse({ matchId: "match-id", message: "x".repeat(501) }).success).toBe(false);
  });
});
