import { describe, expect, it } from "vitest";

import { generatePlainToken, hashToken } from "@/lib/auth/tokens";

describe("auth tokens", () => {
  it("generates non-empty random tokens and hashes them deterministically", () => {
    const token = generatePlainToken();
    const secondToken = generatePlainToken();

    expect(token.length).toBeGreaterThan(20);
    expect(token).not.toBe(secondToken);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
