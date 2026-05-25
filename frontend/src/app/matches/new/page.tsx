import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMatchFormData } from "@/features/matches/match-service";
import { buttonVariants } from "@/components/ui/button";

import { MatchForm } from "./match-form";

type NewMatchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  return params.error === "invalid_input" ? "Vui lòng kiểm tra lại thông tin trận đấu và thử lại." : null;
}

export default async function NewMatchPage({ searchParams }: NewMatchPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const [{ areas, sports, profile }, message] = await Promise.all([
    getMatchFormData(session.user.id),
    pageMessage(searchParams),
  ]);

  if (!profile) {
    redirect("/player/profile");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Tạo trận đấu</h1>
            <p className="mt-3 text-muted-foreground">Số lượng người cần tuyển thêm (không bao gồm chủ trận).</p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/matches">
            Danh sách trận
          </Link>
        </div>

        {message ? <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{message}</div> : null}

        <MatchForm areas={areas} sports={sports} />
      </div>
    </main>
  );
}
