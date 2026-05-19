import { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRole, ApprovalStatus, ContentStatus } from "@prisma/client";
import { Users, Building2, Swords, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Tổng quan Admin | SportLife",
  description: "Trang tổng quan dành cho quản trị viên",
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  // Lấy dữ liệu thống kê
  const [
    totalUsers,
    totalVenues,
    pendingVenues,
    totalMatches,
    totalPosts,
    pendingPosts
  ] = await Promise.all([
    prisma.user.count(),
    prisma.venue.count(),
    prisma.venue.count({ where: { approvalStatus: ApprovalStatus.PENDING_APPROVAL } }),
    prisma.match.count(),
    prisma.communityPost.count(),
    prisma.communityPost.count({ where: { status: ContentStatus.PENDING } }),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Tổng quan hệ thống</h1>
        <p className="text-muted-foreground mt-2">
          Theo dõi các chỉ số và hoạt động của nền tảng SportLife.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Người chơi, Chủ sân & Admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng số sân</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVenues}</div>
            {pendingVenues > 0 ? (
              <p className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <Link href="/admin/venues" className="hover:underline">
                  {pendingVenues} sân đang chờ duyệt
                </Link>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Tất cả sân trên hệ thống</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng trận đấu</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Trận đấu đã được tạo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bài viết cộng đồng</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            {pendingPosts > 0 ? (
              <p className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <Link href="/admin/community" className="hover:underline">
                  {pendingPosts} bài chờ kiểm duyệt
                </Link>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Tất cả bài viết</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
