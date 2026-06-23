import { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { parsePage, calcTotalPages } from "@/lib/pagination-utils";
import { Pagination } from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Link from "next/link";
import { UserTable } from "./user-table";

export const metadata: Metadata = {
  title: "Quản lý người dùng | SportLife Admin",
  description: "Quản lý tài khoản người chơi và chủ sân",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string; q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  const params = await searchParams;
  const pageSize = 10;
  const { page, skip, take } = parsePage(params, pageSize);
  const roleFilter = params.role as UserRole | undefined;
  const q = params.q?.trim() || undefined;

  const where = {
    role: roleFilter || undefined,
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            {
              playerProfile: {
                displayName: { contains: q, mode: "insensitive" as const },
              },
            },
            {
              venueOwnerProfile: {
                businessName: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
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

  const totalPagesCount = calcTotalPages(totalCount, pageSize);

  const data = users.map((u) => ({
    id: u.id,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    displayName: u.playerProfile?.displayName || u.venueOwnerProfile?.businessName || null,
  }));

  const paginationSearchParams: Record<string, string | undefined> = {
    role: roleFilter,
    q,
  };

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

      <form className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_auto]">
        {roleFilter ? <input name="role" type="hidden" value={roleFilter} /> : null}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input className="pl-9" name="q" defaultValue={q ?? ""} placeholder="Tìm theo email hoặc tên..." />
        </div>
        <Button type="submit">Tìm kiếm</Button>
      </form>

      <UserTable users={data} currentUserId={session.user.id} />

      <Pagination
        currentPage={page}
        totalPages={totalPagesCount}
        totalCount={totalCount}
        pageSize={pageSize}
        searchParams={paginationSearchParams}
        basePath="/admin/users"
      />
    </div>
  );
}
