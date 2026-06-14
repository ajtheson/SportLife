"use server";

import { UserRole, VenueResourceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import {
  generateVenueSlotsSchema,
  toggleVenueSlotSchema,
  venueResourceSchema,
  venueScheduleRuleSchema,
} from "./venue-schedule-schemas";
import { generateVenueSlots, saveVenueResource, saveVenueScheduleRule, toggleVenueSlot } from "./venue-schedule-service";

async function requireVenueOwner() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  return session.user;
}

function schedulePath(venueId: string, date?: string, key?: "error" | "status", value?: string) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (key && value) params.set(key, value);
  const query = params.toString();
  return `/venue-owner/venues/${venueId}/schedule${query ? `?${query}` : ""}`;
}

function redirectWith(venueId: string, date: string | undefined, key: "error" | "status", value: string): never {
  redirect(schedulePath(venueId, date, key, value));
}

export async function saveVenueResourceAction(formData: FormData) {
  const user = await requireVenueOwner();
  const venueId = String(formData.get("venueId") ?? "");
  const date = String(formData.get("date") ?? "") || undefined;

  const parsed = venueResourceSchema.safeParse({
    venueId,
    resourceId: String(formData.get("resourceId") ?? "") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status") || VenueResourceStatus.ACTIVE,
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    redirectWith(venueId, date, "error", "invalid_resource");
  }

  try {
    await saveVenueResource(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error && ["VENUE_NOT_FOUND", "RESOURCE_NOT_FOUND"].includes(error.message)) {
      redirectWith(venueId, date, "error", "not_found");
    }

    throw error;
  }

  revalidatePath(schedulePath(venueId, date));
  revalidatePath("/venue-owner");
  redirectWith(venueId, date, "status", "resource_saved");
}

export async function saveVenueScheduleRuleAction(formData: FormData) {
  const user = await requireVenueOwner();
  const venueId = String(formData.get("venueId") ?? "");
  const date = String(formData.get("date") ?? "") || undefined;

  const parsed = venueScheduleRuleSchema.safeParse({
    venueId,
    dayOfWeek: formData.get("dayOfWeek"),
    isOpen: formData.get("isOpen") === "on",
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotDurationMinutes: formData.get("slotDurationMinutes"),
  });

  if (!parsed.success) {
    redirectWith(venueId, date, "error", "invalid_rule");
  }

  try {
    await saveVenueScheduleRule(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "VENUE_NOT_FOUND") {
      redirectWith(venueId, date, "error", "not_found");
    }

    throw error;
  }

  revalidatePath(schedulePath(venueId, date));
  revalidatePath("/venue-owner");
  revalidatePath("/venues");
  redirectWith(venueId, date, "status", "rule_saved");
}

export async function generateVenueSlotsAction(formData: FormData) {
  const user = await requireVenueOwner();
  const venueId = String(formData.get("venueId") ?? "");
  const date = String(formData.get("date") ?? "");
  const parsed = generateVenueSlotsSchema.safeParse({ venueId, date });

  if (!parsed.success) {
    redirectWith(venueId, date, "error", "invalid_date");
  }

  try {
    await generateVenueSlots(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "VENUE_NOT_FOUND") {
      redirectWith(venueId, date, "error", "not_found");
    }

    throw error;
  }

  revalidatePath(schedulePath(venueId, date));
  redirectWith(venueId, date, "status", "slots_generated");
}

export async function toggleVenueSlotAction(formData: FormData) {
  const user = await requireVenueOwner();
  const venueId = String(formData.get("venueId") ?? "");
  const date = String(formData.get("date") ?? "") || undefined;
  const parsed = toggleVenueSlotSchema.safeParse({
    venueId,
    slotId: formData.get("slotId"),
    action: formData.get("action"),
    blockReason: formData.get("blockReason") || undefined,
  });

  if (!parsed.success) {
    redirectWith(venueId, date, "error", "invalid_slot");
  }

  try {
    await toggleVenueSlot(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error && ["VENUE_NOT_FOUND", "SLOT_NOT_FOUND", "SLOT_NOT_EDITABLE"].includes(error.message)) {
      redirectWith(venueId, date, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath(schedulePath(venueId, date));
  redirectWith(venueId, date, "status", parsed.data.action === "block" ? "slot_blocked" : "slot_unblocked");
}
