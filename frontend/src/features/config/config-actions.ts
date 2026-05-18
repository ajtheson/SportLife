"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import {
  createAreaSchema,
  createSkillLevelSchema,
  createSportSchema,
  updateAreaSchema,
  updateAreaStatusSchema,
  updateSkillLevelSchema,
  updateSkillLevelStatusSchema,
  updateSportSchema,
  updateSportStatusSchema,
} from "./config-schemas";
import {
  createArea,
  createSkillLevel,
  createSport,
  isUniqueConstraintError,
  updateArea,
  updateAreaStatus,
  updateSkillLevel,
  updateSkillLevelStatus,
  updateSport,
  updateSportStatus,
} from "./config-service";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/");
  }
}

function redirectWith(path: string, key: "error" | "status", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function createSportAction(formData: FormData) {
  await requireAdmin();
  const parsed = createSportSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/sports", "error", "invalid_input");
  }

  try {
    await createSport(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("/admin/config/sports", "error", "duplicate");
    }

    throw error;
  }

  revalidatePath("/admin/config/sports");
  redirectWith("/admin/config/sports", "status", "created");
}

export async function updateSportStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateSportStatusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/sports", "error", "invalid_input");
  }

  await updateSportStatus(parsed.data);
  revalidatePath("/admin/config/sports");
  redirectWith("/admin/config/sports", "status", "updated");
}

export async function updateSportAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateSportSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/sports", "error", "invalid_input");
  }

  try {
    await updateSport(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("/admin/config/sports", "error", "duplicate");
    }

    throw error;
  }

  revalidatePath("/admin/config/sports");
  redirectWith("/admin/config/sports", "status", "updated");
}

export async function createSkillLevelAction(formData: FormData) {
  await requireAdmin();
  const parsed = createSkillLevelSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/levels", "error", "invalid_input");
  }

  try {
    await createSkillLevel(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("/admin/config/levels", "error", "duplicate");
    }

    if (error instanceof Error && error.message === "INVALID_SPORT") {
      redirectWith("/admin/config/levels", "error", "invalid_input");
    }

    throw error;
  }

  revalidatePath("/admin/config/levels");
  redirectWith("/admin/config/levels", "status", "created");
}

export async function updateSkillLevelStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateSkillLevelStatusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/levels", "error", "invalid_input");
  }

  await updateSkillLevelStatus(parsed.data);
  revalidatePath("/admin/config/levels");
  redirectWith("/admin/config/levels", "status", "updated");
}

export async function updateSkillLevelAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateSkillLevelSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/levels", "error", "invalid_input");
  }

  try {
    await updateSkillLevel(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("/admin/config/levels", "error", "duplicate");
    }

    throw error;
  }

  revalidatePath("/admin/config/levels");
  redirectWith("/admin/config/levels", "status", "updated");
}

export async function createAreaAction(formData: FormData) {
  await requireAdmin();
  const parsed = createAreaSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/areas", "error", "invalid_input");
  }

  try {
    await createArea(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("/admin/config/areas", "error", "duplicate");
    }

    throw error;
  }

  revalidatePath("/admin/config/areas");
  redirectWith("/admin/config/areas", "status", "created");
}

export async function updateAreaStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateAreaStatusSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/areas", "error", "invalid_input");
  }

  await updateAreaStatus(parsed.data);
  revalidatePath("/admin/config/areas");
  redirectWith("/admin/config/areas", "status", "updated");
}

export async function updateAreaAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateAreaSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWith("/admin/config/areas", "error", "invalid_input");
  }

  try {
    await updateArea(parsed.data);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      redirectWith("/admin/config/areas", "error", "duplicate");
    }

    throw error;
  }

  revalidatePath("/admin/config/areas");
  redirectWith("/admin/config/areas", "status", "updated");
}
