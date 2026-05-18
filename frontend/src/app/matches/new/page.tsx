import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getMatchFormData } from "@/features/matches/match-service";

import { MatchForm } from "./match-form";

type NewMatchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  return params.error === "invalid_input" ? "Please check match information and try again." : null;
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
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Create match</h1>
            <p className="mt-3 text-[#5f6b63]">Required players means players needed beyond the owner.</p>
          </div>
          <Link className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/matches">
            Matches
          </Link>
        </div>

        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <MatchForm areas={areas} sports={sports} />
      </div>
    </main>
  );
}
