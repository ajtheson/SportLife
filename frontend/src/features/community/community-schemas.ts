import { CommunityPostType, ContentStatus } from "@prisma/client";
import { z } from "zod";

export const communityPostFormSchema = z.object({
  postId: z.string().min(1).optional(),
  title: z.string().trim().min(5).max(80),
  sportId: z.string().min(1),
  postType: z.enum(CommunityPostType),
  areaId: z.string().min(1).optional(),
  content: z.string().trim().min(10).max(3000),
});

export const commentFormSchema = z.object({
  postId: z.string().min(1),
  content: z.string().trim().min(1).max(1000),
});

export const postIdSchema = z.object({
  postId: z.string().min(1),
});

export const commentIdSchema = z.object({
  commentId: z.string().min(1),
  postId: z.string().min(1),
});

export const contentTargetTypeSchema = z.enum(["POST", "COMMENT"]);

export const moderationStatusSchema = z.object({
  targetType: contentTargetTypeSchema,
  targetId: z.string().min(1),
  status: z.enum(ContentStatus),
});

export type CommunityPostFormInput = z.infer<typeof communityPostFormSchema>;
export type CommentFormInput = z.infer<typeof commentFormSchema>;
export type ContentTargetType = z.infer<typeof contentTargetTypeSchema>;
