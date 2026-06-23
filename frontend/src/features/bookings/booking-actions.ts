"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getPhoneGateRedirect } from "@/lib/authorization/phone-guard";

import {
  createBookingSchema,
  ownerBookingDecisionSchema,
  playerCancelBookingSchema,
} from "./booking-schemas";
import { cancelBookingByPlayer, createBooking, decideOwnerBooking } from "./booking-service";

async function requireRole(role: UserRole) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== role) {
    redirect("/");
  }

  const phoneRedirect = await getPhoneGateRedirect(session.user);

  if (phoneRedirect) {
    redirect(phoneRedirect);
  }

  return session.user;
}

function withQuery(path: string, key: "status" | "error", value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${value}`;
}

export async function createBookingAction(formData: FormData) {
  const user = await requireRole(UserRole.PLAYER);
  const venueId = String(formData.get("venueId") ?? "");
  const date = String(formData.get("date") ?? "") || undefined;
  const basePath = `/venues/${venueId}/booking${date ? `?date=${date}` : ""}`;

  const parsed = createBookingSchema.safeParse({
    venueId,
    slotId: formData.get("slotId"),
    playerNote: formData.get("playerNote") || undefined,
  });

  if (!parsed.success) {
    redirect(withQuery(basePath, "error", "invalid_booking"));
  }

  try {
    await createBooking(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      const known = [
        "VENUE_NOT_FOUND",
        "SLOT_NOT_FOUND",
        "SLOT_IN_PAST",
        "SLOT_NOT_AVAILABLE",
        "PLAYER_PROFILE_REQUIRED",
        "BOOKING_NOT_ALLOWED",
      ];
      if (known.includes(error.message)) {
        redirect(withQuery(basePath, "error", error.message.toLowerCase()));
      }
    }
    throw error;
  }

  revalidatePath(basePath);
  revalidatePath("/player/bookings");
  redirect(withQuery("/player/bookings", "status", "booking_requested"));
}

export async function decideOwnerBookingAction(formData: FormData) {
  const user = await requireRole(UserRole.VENUE_OWNER);

  const parsed = ownerBookingDecisionSchema.safeParse({
    bookingId: formData.get("bookingId"),
    action: formData.get("action"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    redirect(withQuery("/venue-owner/bookings", "error", "invalid_decision"));
  }

  try {
    await decideOwnerBooking(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      const known = ["BOOKING_NOT_FOUND", "BOOKING_NOT_DECIDABLE", "REASON_REQUIRED"];
      if (known.includes(error.message)) {
        redirect(withQuery("/venue-owner/bookings", "error", error.message.toLowerCase()));
      }
    }
    throw error;
  }

  revalidatePath("/venue-owner/bookings");
  const statusValue =
    parsed.data.action === "confirm"
      ? "booking_confirmed"
      : parsed.data.action === "reject"
        ? "booking_rejected"
        : "booking_canceled";
  redirect(withQuery("/venue-owner/bookings", "status", statusValue));
}

export async function cancelPlayerBookingAction(formData: FormData) {
  const user = await requireRole(UserRole.PLAYER);

  const parsed = playerCancelBookingSchema.safeParse({
    bookingId: formData.get("bookingId"),
  });

  if (!parsed.success) {
    redirect(withQuery("/player/bookings", "error", "invalid_cancel"));
  }

  try {
    await cancelBookingByPlayer(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      const known = ["BOOKING_NOT_FOUND", "BOOKING_NOT_CANCELABLE"];
      if (known.includes(error.message)) {
        redirect(withQuery("/player/bookings", "error", error.message.toLowerCase()));
      }
    }
    throw error;
  }

  revalidatePath("/player/bookings");
  redirect(withQuery("/player/bookings", "status", "booking_canceled_by_player"));
}
