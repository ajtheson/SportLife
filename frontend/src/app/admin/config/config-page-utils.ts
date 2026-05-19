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
    return "Đã thêm thành công.";
  }

  if (params.status === "updated") {
    return "Đã cập nhật thành công.";
  }

  if (params.error === "duplicate") {
    return "Giá trị này đã tồn tại.";
  }

  if (params.error === "invalid_input") {
    return "Vui lòng kiểm tra lại thông tin.";
  }

  return null;
}
