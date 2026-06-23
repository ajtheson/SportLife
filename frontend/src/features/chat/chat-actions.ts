"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getPhoneGateRedirect } from "@/lib/authorization/phone-guard";

import { sendChatMessageSchema, startBookingChatSchema, startMatchChatSchema, startVenueChatSchema } from "./chat-schemas";
import {
  sendChatMessage,
  startBookingConversation,
  startMatchConversation,
  startVenueConversation,
} from "./chat-service";

const knownChatErrors = new Set([
  "CHAT_NOT_ALLOWED",
  "CONVERSATION_NOT_FOUND",
  "MATCH_CHAT_NOT_ALLOWED",
  "MATCH_NOT_FOUND",
  "BOOKING_NOT_FOUND",
  "BOOKING_CHAT_NOT_ALLOWED",
  "SELF_CHAT",
  "VENUE_NOT_FOUND",
]);

async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const phoneRedirect = await getPhoneGateRedirect(session.user);

  if (phoneRedirect) {
    redirect(phoneRedirect);
  }

  return session.user;
}

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function startVenueChatAction(formData: FormData) {
  const user = await requireUser();
  const parsed = startVenueChatSchema.safeParse(Object.fromEntries(formData));
  const venueId = String(formData.get("venueId") ?? "");
  const target = venueId ? `/venues/${venueId}` : "/venues";

  if (!parsed.success) {
    redirectWith(target, "error", "chat_invalid_input");
  }

  let conversationId: string;

  try {
    const conversation = await startVenueConversation(user.id, parsed.data.venueId);
    conversationId = conversation.id;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PLAYER_PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      if (error.message === "VENUE_OWNER_PROFILE_REQUIRED") {
        redirect("/venue-owner/profile");
      }

      if (knownChatErrors.has(error.message)) {
        redirectWith(target, "error", error.message.toLowerCase());
      }

      console.error("Failed to start venue chat:", error);
      redirectWith(target, "error", "chat_unavailable");
    }

    throw error;
  }

  redirect(`/chat/${conversationId}`);
}

export async function startMatchChatAction(formData: FormData) {
  const user = await requireUser();
  const parsed = startMatchChatSchema.safeParse(Object.fromEntries(formData));
  const matchId = String(formData.get("matchId") ?? "");
  const target = matchId ? `/matches/${matchId}` : "/matches";

  if (!parsed.success) {
    redirectWith(target, "error", "chat_invalid_input");
  }

  let conversationId: string;

  try {
    const conversation = await startMatchConversation(user.id, parsed.data.matchId, parsed.data.userId);
    conversationId = conversation.id;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PLAYER_PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      if (knownChatErrors.has(error.message)) {
        redirectWith(target, "error", error.message.toLowerCase());
      }

      console.error("Failed to start match chat:", error);
      redirectWith(target, "error", "chat_unavailable");
    }

    throw error;
  }

  redirect(`/chat/${conversationId}`);
}

export async function startBookingChatAction(formData: FormData) {
  const user = await requireUser();
  const parsed = startBookingChatSchema.safeParse(Object.fromEntries(formData));
  const bookingId = String(formData.get("bookingId") ?? "");
  const role = String(formData.get("role") ?? "");
  const detailBase = role === "owner" ? "/venue-owner/bookings" : "/player/bookings";
  const target = bookingId ? `${detailBase}/${bookingId}` : detailBase;

  if (!parsed.success) {
    redirectWith(target, "error", "chat_invalid_input");
  }

  let conversationId: string;

  try {
    const conversation = await startBookingConversation(user.id, parsed.data.bookingId);
    conversationId = conversation.id;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PLAYER_PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      if (error.message === "VENUE_OWNER_PROFILE_REQUIRED") {
        redirect("/venue-owner/profile");
      }

      if (knownChatErrors.has(error.message)) {
        redirectWith(target, "error", error.message.toLowerCase());
      }

      console.error("Failed to start booking chat:", error);
      redirectWith(target, "error", "chat_unavailable");
    }

    throw error;
  }

  redirect(`/chat/${conversationId}`);
}

export async function sendChatMessageAction(formData: FormData) {
  const user = await requireUser();
  const parsed = sendChatMessageSchema.safeParse(Object.fromEntries(formData));
  const conversationId = String(formData.get("conversationId") ?? "");
  const target = conversationId ? `/chat/${conversationId}` : "/chat";

  if (!parsed.success) {
    redirectWith(target, "error", "message_invalid");
  }

  try {
    await sendChatMessage(user.id, parsed.data.conversationId, parsed.data.content);
  } catch (error) {
    if (error instanceof Error) {
      if (knownChatErrors.has(error.message)) {
        redirectWith(target, "error", error.message.toLowerCase());
      }

      console.error("Failed to send chat message:", error);
      redirectWith(target, "error", "chat_unavailable");
    }

    throw error;
  }

  revalidatePath("/chat");
  revalidatePath(target);
  revalidatePath("/notifications");
  redirectWith(target, "status", "sent");
}
