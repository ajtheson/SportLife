"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { venueOwnerProfileSchema } from "./venue-owner-profile-schemas";
import { saveVenueOwnerProfile } from "./venue-owner-profile-service";

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function saveVenueOwnerProfileAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  const parsed = venueOwnerProfileSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/venue-owner/profile", "error", "invalid_input");
  }

  try {
    await saveVenueOwnerProfile(session.user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "PHONE_ALREADY_EXISTS") {
      redirectWith("/venue-owner/profile", "error", "phone_exists");
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/venue-owner");
  revalidatePath("/venue-owner/profile");
  redirectWith("/venue-owner/profile", "status", "saved");
}
