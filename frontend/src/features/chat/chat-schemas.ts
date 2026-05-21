import { z } from "zod";

export const startVenueChatSchema = z.object({
  venueId: z.string().min(1),
});

export const startMatchChatSchema = z.object({
  matchId: z.string().min(1),
  userId: z.string().min(1),
});

export const sendChatMessageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().trim().min(1, "MESSAGE_REQUIRED").max(1000, "MESSAGE_TOO_LONG"),
});
