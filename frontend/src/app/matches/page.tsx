import { MatchStatus } from "@prisma/client";
import Link from "next/link";

import { auth } from "@/auth";
import { listAreas, listSports } from "@/features/config/config-service";
import type { MatchListTab } from "@/features/matches/match-service";
import { listMatches } from "@/features/matches/match-service";

type MatchesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const session = await auth();
  const params = await searchParams;
  const selectedTab = parseTab(firstValue(params.tab));
  const filters = {
    tab: selectedTab,
    viewerId: session?.user?.id,
    sportId: firstValue(params.sportId) || undefined,
    areaId: firstValue(params.areaId) || undefined,
  };
  const [matches, sports, areas] = await Promise.all([listMatches(filters), listSports(), listAreas()]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Find matches</h1>
            <p className="mt-3 text-[#5f6b63]">Browse open player-created matches in Hanoi.</p>
          </div>
          <Link className="rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" href="/matches/new">
            New match
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabsFor(Boolean(session?.user)).map((tab) => (
            <Link
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                selectedTab === tab.value
                  ? "border-[#0f6b4f] bg-[#0f6b4f] text-white"
                  : "border-[#d9d2c1] bg-white"
              }`}
              href={matchesHref({ tab: tab.value, sportId: filters.sportId, areaId: filters.areaId })}
              key={tab.value}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form className="grid gap-3 rounded-lg border border-[#d9d2c1] bg-white p-5 md:grid-cols-[220px_260px_auto]">
          <input name="tab" type="hidden" value={selectedTab} />
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">All sports</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="areaId" defaultValue={filters.areaId ?? ""}>
            <option value="">All areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
            Filter
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => {
            const approvedCount = match.joinRequests.filter((request) => request.status === "APPROVED").length;
            const remaining = Math.max(match.requiredPlayers - approvedCount, 0);

            return (
              <Link key={match.id} className="rounded-lg border border-[#d9d2c1] bg-white p-5 hover:bg-[#fbfaf7]" href={`/matches/${match.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-semibold">{match.sport.name}</h2>
                  <span className="rounded-md bg-[#eef1ec] px-2 py-1 text-xs font-semibold">{match.status}</span>
                </div>
                <p className="mt-2 text-sm text-[#5f6b63]">{match.area.name}</p>
                {match.detailedAddress ? <p className="mt-2 text-sm text-[#5f6b63]">{match.detailedAddress}</p> : null}
                <p className="mt-2 text-sm text-[#5f6b63]">{match.time.toLocaleString()}</p>
                {selectedTab === "requests" ? (
                  <p className="mt-2 text-sm text-[#5f6b63]">
                    Your request: {match.joinRequests.find((request) => request.requesterId === session?.user?.id)?.status ?? "UNKNOWN"}
                  </p>
                ) : null}
                {match.expectedLevels.length > 0 ? (
                  <p className="mt-2 text-sm text-[#5f6b63]">
                    Levels: {match.expectedLevels.map((item) => item.skillLevel.name).join(", ")}
                  </p>
                ) : null}
                <p className="mt-3 text-sm font-medium text-[#0f6b4f]">
                  {match.status === MatchStatus.FULL ? "Full" : `Need ${remaining} more player${remaining === 1 ? "" : "s"}`}
                </p>
                {match.description ? <p className="mt-3 line-clamp-2 text-sm text-[#445049]">{match.description}</p> : null}
              </Link>
            );
          })}

          {matches.length === 0 ? (
            <div className="rounded-lg border border-[#d9d2c1] bg-white p-5 text-sm text-[#5f6b63]">
              No matches match the current filters.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function parseTab(value: string | undefined): MatchListTab {
  if (value === "full" || value === "mine" || value === "requests") {
    return value;
  }

  return "open";
}

function tabsFor(isLoggedIn: boolean): Array<{ label: string; value: MatchListTab }> {
  const base: Array<{ label: string; value: MatchListTab }> = [
    { label: "Open", value: "open" },
    { label: "Full", value: "full" },
  ];

  if (!isLoggedIn) {
    return base;
  }

  return [
    ...base,
    { label: "My matches", value: "mine" },
    { label: "My requests", value: "requests" },
  ];
}

function matchesHref(input: { tab: MatchListTab; sportId?: string; areaId?: string }) {
  const params = new URLSearchParams({ tab: input.tab });

  if (input.sportId) params.set("sportId", input.sportId);
  if (input.areaId) params.set("areaId", input.areaId);

  return `/matches?${params.toString()}`;
}
