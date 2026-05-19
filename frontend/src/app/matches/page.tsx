import { MatchStatus } from "@prisma/client";
import Link from "next/link";

import { auth } from "@/auth";
import { listAreas, listSports } from "@/features/config/config-service";
import type { MatchListTab } from "@/features/matches/match-service";
import { listMatches } from "@/features/matches/match-service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MatchesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "Đang mở", variant: "default" },
  FULL: { label: "Đã đủ người", variant: "secondary" },
  CLOSED: { label: "Đã đóng", variant: "outline" },
  CANCELED: { label: "Đã hủy", variant: "destructive" },
};

const requestStatusMap: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELED: "Đã hủy",
};

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
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Tìm trận đấu</h1>
            <p className="mt-3 text-muted-foreground">Khám phá các trận đấu do người chơi tạo tại Hà Nội.</p>
          </div>
          <Link className={buttonVariants()} href="/matches/new">
            Tạo trận
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabsFor(Boolean(session?.user)).map((tab) => (
            <Link
              className={buttonVariants({ variant: selectedTab === tab.value ? "default" : "outline" })}
              href={matchesHref({ tab: tab.value, sportId: filters.sportId, areaId: filters.areaId })}
              key={tab.value}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[220px_260px_auto]">
          <input name="tab" type="hidden" value={selectedTab} />
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">Tất cả các môn</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="areaId" defaultValue={filters.areaId ?? ""}>
            <option value="">Tất cả khu vực</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <Button type="submit">Lọc</Button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((match) => {
            const approvedCount = match.joinRequests.filter((request) => request.status === "APPROVED").length;
            const remaining = Math.max(match.requiredPlayers - approvedCount, 0);
            const statusInfo = statusMap[match.status] ?? { label: match.status, variant: "outline" };

            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50 hover:shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-xl text-primary">{match.sport.name}</CardTitle>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <p className="text-sm text-muted-foreground">{match.area.name}</p>
                    {match.detailedAddress ? <p className="text-sm text-muted-foreground">{match.detailedAddress}</p> : null}
                    <p className="text-sm text-muted-foreground">{match.time.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
                    
                    {selectedTab === "requests" ? (
                      <p className="text-sm text-muted-foreground">
                        Trạng thái xin tham gia: <span className="font-medium text-foreground">{requestStatusMap[match.joinRequests.find((request) => request.requesterId === session?.user?.id)?.status ?? ""] ?? "KHÔNG RÕ"}</span>
                      </p>
                    ) : null}
                    
                    {match.expectedLevels.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Trình độ: {match.expectedLevels.map((item) => item.skillLevel.name).join(", ")}
                      </p>
                    ) : null}
                    
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {match.status === MatchStatus.FULL ? "Đã đủ người" : `Cần tuyển thêm ${remaining} người`}
                    </p>
                    
                    {match.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{match.description}</p> : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {matches.length === 0 ? (
            <div className="col-span-full rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Không tìm thấy trận đấu nào phù hợp với bộ lọc.
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
    { label: "Đang mở", value: "open" },
    { label: "Đã đủ người", value: "full" },
  ];

  if (!isLoggedIn) {
    return base;
  }

  return [
    ...base,
    { label: "Trận của tôi", value: "mine" },
    { label: "Yêu cầu của tôi", value: "requests" },
  ];
}

function matchesHref(input: { tab: MatchListTab; sportId?: string; areaId?: string }) {
  const params = new URLSearchParams({ tab: input.tab });

  if (input.sportId) params.set("sportId", input.sportId);
  if (input.areaId) params.set("areaId", input.areaId);

  return `/matches?${params.toString()}`;
}
