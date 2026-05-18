"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { joinRequestIdSchema, joinRequestSchema, matchFormSchema, matchStatusActionSchema } from "./match-schemas";
import {
  approveJoinRequest,
  cancelMatch,
  closeMatch,
  createMatch,
  rejectJoinRequest,
  requestJoinMatch,
} from "./match-service";

async function requirePlayer() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  return session.user;
}

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function createMatchAction(formData: FormData) {
  const user = await requirePlayer();
  const parsed = matchFormSchema.safeParse({
    sportId: formData.get("sportId"),
    areaId: formData.get("areaId"),
    time: formData.get("time"),
    detailedAddress: formData.get("detailedAddress") || undefined,
    requiredPlayers: formData.get("requiredPlayers"),
    expectedLevelIds: formData.getAll("expectedLevelIds").map(String),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    redirectWith("/matches/new", "error", "invalid_input");
  }

  try {
    await createMatch(user.id, parsed.data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      if (["INVALID_AREA", "INVALID_SPORT", "INVALID_LEVEL"].includes(error.message)) {
        redirectWith("/matches/new", "error", "invalid_input");
      }
    }

    throw error;
  }

  revalidatePath("/matches");
  redirectWith("/matches", "status", "created");
}

export async function requestJoinMatchAction(formData: FormData) {
  const user = await requirePlayer();
  const parsed = joinRequestSchema.safeParse(Object.fromEntries(formData));
  const matchId = String(formData.get("matchId") ?? "");
  const target = matchId ? `/matches/${matchId}` : "/matches";

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await requestJoinMatch(user.id, parsed.data.matchId, parsed.data.message);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      if (
        ["MATCH_NOT_FOUND", "SELF_JOIN", "MATCH_NOT_OPEN", "DUPLICATE_JOIN_REQUEST"].includes(error.message)
      ) {
        redirectWith(target, "error", error.message.toLowerCase());
      }
    }

    throw error;
  }

  revalidatePath(target);
  revalidatePath("/notifications");
  redirectWith(target, "status", "requested");
}

export async function approveJoinRequestAction(formData: FormData) {
  const user = await requirePlayer();
  const parsed = joinRequestIdSchema.safeParse(Object.fromEntries(formData));
  const matchId = String(formData.get("matchId") ?? "");
  const target = matchId ? `/matches/${matchId}` : "/matches";

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await approveJoinRequest(user.id, parsed.data.joinRequestId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWith(target, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath(target);
  revalidatePath("/matches");
  revalidatePath("/notifications");
  redirectWith(target, "status", "approved");
}

export async function rejectJoinRequestAction(formData: FormData) {
  const user = await requirePlayer();
  const parsed = joinRequestIdSchema.safeParse(Object.fromEntries(formData));
  const matchId = String(formData.get("matchId") ?? "");
  const target = matchId ? `/matches/${matchId}` : "/matches";

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await rejectJoinRequest(user.id, parsed.data.joinRequestId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWith(target, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath(target);
  revalidatePath("/notifications");
  redirectWith(target, "status", "rejected");
}

export async function closeMatchAction(formData: FormData) {
  const user = await requirePlayer();
  const parsed = matchStatusActionSchema.safeParse(Object.fromEntries(formData));
  const matchId = String(formData.get("matchId") ?? "");
  const target = matchId ? `/matches/${matchId}` : "/matches";

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await closeMatch(user.id, parsed.data.matchId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWith(target, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath("/matches");
  revalidatePath(target);
  redirectWith(target, "status", "closed");
}

export async function cancelMatchAction(formData: FormData) {
  const user = await requirePlayer();
  const parsed = matchStatusActionSchema.safeParse(Object.fromEntries(formData));
  const matchId = String(formData.get("matchId") ?? "");
  const target = matchId ? `/matches/${matchId}` : "/matches";

  if (!parsed.success) {
    redirectWith(target, "error", "invalid_input");
  }

  try {
    await cancelMatch(user.id, parsed.data.matchId);
  } catch (error) {
    if (error instanceof Error) {
      redirectWith(target, "error", error.message.toLowerCase());
    }

    throw error;
  }

  revalidatePath("/matches");
  revalidatePath(target);
  redirectWith(target, "status", "canceled");
}
