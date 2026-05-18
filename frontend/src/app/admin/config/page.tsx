import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getConfigDashboardCounts } from "@/features/config/config-service";

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
    ["Sports", `${counts.sports} active`, "/admin/config/sports"],
    ["Skill levels", `${counts.skillLevels} active`, "/admin/config/levels"],
    ["Areas", `${counts.areas} active Hanoi wards/communes`, "/admin/config/areas"],
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Configuration</h1>
          <p className="mt-3 text-[#5f6b63]">Manage reusable SportLife sports, skill levels, and Hanoi areas.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {sections.map(([title, subtitle, href]) => (
            <Link key={href} className="rounded-lg border border-[#d9d2c1] bg-white p-5 hover:bg-[#fbfaf7]" href={href}>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-[#5f6b63]">{subtitle}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
