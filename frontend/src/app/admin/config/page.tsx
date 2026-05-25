import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getConfigDashboardCounts } from "@/features/config/config-service";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminConfigPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  const counts = await getConfigDashboardCounts();
  const sections = [
    ["Môn thể thao", `${counts.sports} đang hoạt động`, "/admin/config/sports"],
    ["Trình độ", `${counts.skillLevels} đang hoạt động`, "/admin/config/levels"],
    ["Khu vực", `${counts.areas} quận/huyện đang hoạt động`, "/admin/config/areas"],
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Cấu hình hệ thống</h1>
          <p className="mt-3 text-muted-foreground">Quản lý danh mục Môn thể thao, Trình độ kỹ năng và Khu vực (Quận/Huyện).</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {sections.map(([title, subtitle, href]) => (
            <Link key={href} href={href}>
              <Card className="h-full transition-colors hover:bg-muted/50 hover:shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">{title}</CardTitle>
                  <CardDescription>{subtitle}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
