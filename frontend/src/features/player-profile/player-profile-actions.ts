"use server";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

import { playerProfileSchema } from "./player-profile-schemas";
import { savePlayerProfile } from "./player-profile-service";

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function savePlayerProfileAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const sportIds = formData.getAll("sportIds").map(String);
  const parsed = playerProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    phone: formData.get("phone"),
    areaId: formData.get("areaId"),
    introduction: formData.get("introduction") || undefined,
    availability: formData.get("availability") || undefined,
    sportLevels: sportIds.map((sportId) => ({
      sportId,
      skillLevelId: String(formData.get(`skillLevel_${sportId}`) ?? ""),
    })),
  });

  if (!parsed.success) {
    redirectWith("/player/profile", "error", "invalid_input");
  }

  try {
    await savePlayerProfile(session.user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PHONE_ALREADY_EXISTS") {
        redirectWith("/player/profile", "error", "phone_exists");
      }

      if (error.message === "INVALID_AREA" || error.message === "INVALID_SPORT_LEVEL") {
        redirectWith("/player/profile", "error", "invalid_input");
      }
    }

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/player/profile");
  redirectWith("/player/profile", "status", "saved");
}
