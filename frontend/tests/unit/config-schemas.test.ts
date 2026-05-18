import { ConfigStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  createAreaSchema,
  createSkillLevelSchema,
  updateAreaSchema,
  updateSkillLevelSchema,
  updateSportSchema,
  updateSportStatusSchema,
} from "@/features/config/config-schemas";

describe("config schemas", () => {
  it("accepts valid Hanoi area types", () => {
    expect(createAreaSchema.safeParse({ name: "Phường Ba Đình", type: "ward" }).success).toBe(true);
    expect(createAreaSchema.safeParse({ name: "Xã Sóc Sơn", type: "commune" }).success).toBe(true);
  });

  it("rejects unsupported area types", () => {
    expect(createAreaSchema.safeParse({ name: "Ba Dinh", type: "district" }).success).toBe(false);
  });

  it("requires integer skill level order", () => {
    expect(createSkillLevelSchema.safeParse({ sportId: "sport-id", name: "Beginner", order: "1" }).success).toBe(true);
    expect(createSkillLevelSchema.safeParse({ sportId: "sport-id", name: "Beginner", order: "1.5" }).success).toBe(
      false,
    );
  });

  it("restricts config statuses", () => {
    expect(updateSportStatusSchema.safeParse({ sportId: "sport-id", status: ConfigStatus.ACTIVE }).success).toBe(true);
    expect(updateSportStatusSchema.safeParse({ sportId: "sport-id", status: "DELETED" }).success).toBe(false);
  });

  it("validates update forms", () => {
    expect(updateSportSchema.safeParse({ sportId: "sport-id", name: "Badminton" }).success).toBe(true);
    expect(updateAreaSchema.safeParse({ areaId: "area-id", name: "Phường Ba Đình", type: "ward" }).success).toBe(true);
    expect(updateSkillLevelSchema.safeParse({ skillLevelId: "level-id", name: "Advanced", order: 3 }).success).toBe(
      true,
    );
  });
});
