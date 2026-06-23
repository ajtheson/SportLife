import { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { buttonVariants } from "@/components/ui/button";
import { UserTable } from "./user-table";

export const metadata: Metadata = {
  title: "Quản lý người dùng | SportLife Admin",
  description: "Quản lý tài khoản người chơi và chủ sân",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const pageSize = 10;
  const roleFilter = params.role as UserRole | undefined;

  const where = roleFilter ? { role: roleFilter } : {};

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        role: true,
        status: true,
        createdAt: true,
        playerProfile: { select: { displayName: true } },
        venueOwnerProfile: { select: { businessName: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const data = users.map((u) => ({
    id: u.id,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    displayName: u.playerProfile?.displayName || u.venueOwnerProfile?.businessName || null,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Quản lý người dùng</h1>
        <p className="text-muted-foreground mt-2">
          Xem danh sách và quản lý trạng thái tài khoản.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/users"
          className={buttonVariants({ variant: !roleFilter ? "default" : "outline", size: "sm" })}
        >
          Tất cả
        </Link>
        <Link
          href="/admin/users?role=PLAYER"
          className={buttonVariants({ variant: roleFilter === "PLAYER" ? "default" : "outline", size: "sm" })}
        >
          Người chơi
        </Link>
        <Link
          href="/admin/users?role=VENUE_OWNER"
          className={buttonVariants({ variant: roleFilter === "VENUE_OWNER" ? "default" : "outline", size: "sm" })}
        >
          Chủ sân
        </Link>
        <Link
          href="/admin/users?role=ADMIN"
          className={buttonVariants({ variant: roleFilter === "ADMIN" ? "default" : "outline", size: "sm" })}
        >
          Quản trị viên
        </Link>
      </div>

      <UserTable users={data} currentUserId={session.user.id} />

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} trên tổng số {totalCount}
          </p>
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/users?page=${page - 1}${roleFilter ? `&role=${roleFilter}` : ""}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: page <= 1 ? "pointer-events-none opacity-50" : "",
              })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Trước
            </Link>
            <div className="text-sm font-medium">
              Trang {page} / {totalPages}
            </div>
            <Link
              href={`/admin/users?page=${page + 1}${roleFilter ? `&role=${roleFilter}` : ""}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: page >= totalPages ? "pointer-events-none opacity-50" : "",
              })}
            >
              Sau <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
