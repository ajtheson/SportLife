"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";

import { markNotificationRead } from "./notification-service";

const notificationIdSchema = z.object({
  notificationId: z.string().min(1),
  redirectTo: z.string().optional(),
});

export async function markNotificationReadAction(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === UserRole.ADMIN) {
    redirect("/");
  }

  const parsed = notificationIdSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/notifications");
  }

  await markNotificationRead(session.user.id, parsed.data.notificationId);
  revalidatePath("/notifications");
  redirect(parsed.data.redirectTo || "/notifications");
}
