"use server";

import { UserRole, VisibilityStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  isUploadedFile,
  saveLocalImageFiles,
  VENUE_IMAGE_MAX_BYTES,
  VENUE_IMAGE_MAX_COUNT,
} from "@/lib/storage/storage-service";

import { rejectVenueSchema, venueFormSchema, venueIdSchema } from "./venue-schemas";
import { approveVenue, rejectVenue, saveOwnerVenue, setVenueVisibility } from "./venue-service";

async function requireRole(role: UserRole) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== role) {
    redirect("/");
  }

  return session.user;
}

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

function imageUrlsFromForm(formData: FormData) {
  return formData
    .getAll("imageUrls")
    .flatMap((value) => String(value).split(/\r?\n/))
    .map((url) => url.trim())
    .filter(Boolean);
}

function venueFormTarget(formData: FormData) {
  const venueId = String(formData.get("venueId") ?? "");
  return venueId ? `/venue-owner/venues/${venueId}/edit` : "/venue-owner/venues/new";
}

export async function saveVenueAction(formData: FormData) {
  const user = await requireRole(UserRole.VENUE_OWNER);
  const target = venueFormTarget(formData);
  const uploadedImageFiles = formData.getAll("venueImages").filter(isUploadedFile);
  let imageUrls = imageUrlsFromForm(formData);

  if (uploadedImageFiles.length > 0) {
    if (uploadedImageFiles.length > VENUE_IMAGE_MAX_COUNT) {
      redirectWith(target, "error", "invalid_images");
    }

    try {
      const uploadedImages = await saveLocalImageFiles(uploadedImageFiles, "venues", VENUE_IMAGE_MAX_BYTES);
      imageUrls = uploadedImages.map((image) => image.url);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "INVALID_IMAGE_TYPE" || error.message === "IMAGE_TOO_LARGE")
      ) {
        redirectWith(target, "error", "invalid_images");
      }

      throw error;
    }
  }

  const parsed = venueFormSchema.safeParse({
    venueId: String(formData.get("venueId") ?? "") || undefined,
    name: formData.get("name"),
    address: formData.get("address"),
    areaId: formData.get("areaId"),
    phone: formData.get("phone"),
    description: formData.get("description") || undefined,
    availabilityNote: formData.get("availabilityNote") || undefined,
    openingHours: formData.get("openingHours") || undefined,
    referencePrice: formData.get("referencePrice") || undefined,
    sportId: formData.get("sportId"),
    imageUrls,
  });

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await saveOwnerVenue(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROFILE_REQUIRED") {
        redirect("/venue-owner/profile");
      }

      if (["INVALID_AREA", "INVALID_SPORT", "VENUE_NOT_FOUND"].includes(error.message)) {
        redirectWith(target, "error", "invalid_input");
      }
    }

    throw error;
  }

  revalidatePath("/venue-owner");
  revalidatePath("/venues");
  redirectWith("/venue-owner", "status", "submitted");
}

export async function approveVenueAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = venueIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/venues", "error", "invalid_input");
  }

  await approveVenue(parsed.data.venueId);
  revalidatePath("/admin/venues");
  revalidatePath("/venues");
  redirectWith("/admin/venues", "status", "approved");
}

export async function rejectVenueAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = rejectVenueSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/venues", "error", "invalid_input");
  }

  await rejectVenue(parsed.data.venueId, parsed.data.rejectionReason);
  revalidatePath("/admin/venues");
  revalidatePath("/venues");
  redirectWith("/admin/venues", "status", "rejected");
}

export async function hideVenueAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = venueIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/venues", "error", "invalid_input");
  }

  await setVenueVisibility(parsed.data.venueId, VisibilityStatus.HIDDEN);
  revalidatePath("/admin/venues");
  revalidatePath("/venues");
  redirectWith("/admin/venues", "status", "updated");
}

export async function showVenueAction(formData: FormData) {
  await requireRole(UserRole.ADMIN);
  const parsed = venueIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/venues", "error", "invalid_input");
  }

  await setVenueVisibility(parsed.data.venueId, VisibilityStatus.ACTIVE);
  revalidatePath("/admin/venues");
  revalidatePath("/venues");
  redirectWith("/admin/venues", "status", "updated");
}
