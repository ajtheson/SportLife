"use server";

import { revalidatePath } from "next/cache";
import { UserRole, UserStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function toggleUserStatusAction(userId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized" };
    }

    // Không cho phép Admin tự khóa tài khoản của chính mình
    if (session.user.id === userId) {
      return { success: false, error: "Bạn không thể khóa tài khoản của chính mình." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });

    if (!user) {
      return { success: false, error: "Không tìm thấy người dùng." };
    }

    if (user.role === UserRole.ADMIN) {
      return { success: false, error: "Không thể khóa tài khoản quản trị viên." };
    }

    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.LOCKED : UserStatus.ACTIVE;

    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle user status:", error);
    return { success: false, error: "Đã xảy ra lỗi hệ thống." };
  }
}
