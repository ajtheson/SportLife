import { CommunityPostType } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { commentFormSchema, communityPostFormSchema } from "@/features/community/community-schemas";

describe("community schemas", () => {
  it("accepts a sport-tagged discussion post without match scheduling fields", () => {
    expect(
      communityPostFormSchema.safeParse({
        title: "Beginner racket advice",
        sportId: "sport-id",
        postType: CommunityPostType.ADVICE,
        content: "Which badminton racket is best for beginner defensive players?",
      }).success,
    ).toBe(true);
  });

  it("rejects short posts and comments", () => {
    expect(
      communityPostFormSchema.safeParse({
        title: "Bad",
        sportId: "sport-id",
        postType: CommunityPostType.DISCUSSION,
        content: "short",
      }).success,
    ).toBe(false);

    expect(commentFormSchema.safeParse({ postId: "post-id", content: "" }).success).toBe(false);
  });
});
