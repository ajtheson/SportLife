import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MatchStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { getMatchFormData } from "@/features/matches/match-service";
import { prisma } from "@/lib/db/prisma";
import { buttonVariants } from "@/components/ui/button";
import { EditMatchForm } from "./edit-match-form";

export const metadata: Metadata = {
  title: "Sửa trận đấu | SportLife",
  description: "Chỉnh sửa thông tin trận đấu của bạn",
};

export default async function EditMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const { matchId } = await params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { expectedLevels: true },
  });

  if (!match) {
    notFound();
  }

  if (match.ownerId !== session.user.id) {
    redirect("/matches");
  }

  if (match.status === MatchStatus.CLOSED || match.status === MatchStatus.CANCELED) {
    redirect(`/matches/${matchId}?error=match_not_editable`);
  }

  const formData = await getMatchFormData(session.user.id);

  if (!formData.profile) {
    redirect("/player/profile");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/matches/${matchId}`}
          className={buttonVariants({ variant: "outline", size: "icon", className: "shrink-0" })}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Trở lại</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Sửa trận đấu</h1>
          <p className="text-muted-foreground mt-2">Cập nhật thông tin trận đấu của bạn</p>
        </div>
      </div>

      <EditMatchForm match={match} areas={formData.areas} sports={formData.sports} />
    </div>
  );
}
