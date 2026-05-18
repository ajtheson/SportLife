import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireAdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/");
  }
}

export async function configMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.status === "created") {
    return "Created.";
  }

  if (params.status === "updated") {
    return "Updated.";
  }

  if (params.error === "duplicate") {
    return "This value already exists.";
  }

  if (params.error === "invalid_input") {
    return "Please check the submitted values.";
  }

  return null;
}
