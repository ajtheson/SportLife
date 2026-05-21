import { MatchStatus } from "@prisma/client";
import { CalendarClock, MapPin, Users } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { listAreas, listSports } from "@/features/config/config-service";
import type { MatchListTab } from "@/features/matches/match-service";
import { listMatches } from "@/features/matches/match-service";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-5 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-3">
              Matchmaking
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Tìm trận đấu</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Khám phá các trận đang mở, gửi yêu cầu tham gia và quản lý trận của bạn.
            </p>
          </div>
          <Link className={buttonVariants({ size: "lg" })} href="/matches/new">
            Tạo trận
          </Link>
        </header>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card/90 p-2 shadow-sm">
          {tabsFor(Boolean(session?.user)).map((tab) => (
            <Link
              className={buttonVariants({
                variant: selectedTab === tab.value ? "default" : "ghost",
                className: "min-w-fit",
              })}
              href={matchesHref({ tab: tab.value, sportId: filters.sportId, areaId: filters.areaId })}
              key={tab.value}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <form className="grid gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm md:grid-cols-[220px_260px_auto]">
          <input name="tab" type="hidden" value={selectedTab} />
          <select name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">Tất cả các môn</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select name="areaId" defaultValue={filters.areaId ?? ""}>
            <option value="">Tất cả khu vực</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <Button type="submit">Lọc trận</Button>
        </form>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => {
            const approvedCount = match.joinRequests.filter((request) => request.status === "APPROVED").length;
            const remaining = Math.max(match.requiredPlayers - approvedCount, 0);
            const statusInfo = statusMap[match.status] ?? { label: match.status, variant: "outline" };
            const viewerRequest = match.joinRequests.find((request) => request.requesterId === session?.user?.id);

            return (
              <Link className="group block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" key={match.id} href={`/matches/${match.id}`}>
                <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-primary/25">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl text-foreground">{match.sport.name}</CardTitle>
                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="size-4 text-primary" aria-hidden="true" />
                          {match.area.name}
                        </p>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {match.detailedAddress ? <p className="line-clamp-2 text-sm text-muted-foreground">{match.detailedAddress}</p> : null}
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="size-4 text-primary" aria-hidden="true" />
                      {match.time.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </p>

                    {selectedTab === "requests" ? (
                      <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                        Trạng thái xin tham gia:{" "}
                        <span className="font-semibold text-foreground">{requestStatusMap[viewerRequest?.status ?? ""] ?? "Không rõ"}</span>
                      </p>
                    ) : null}

                    {match.expectedLevels.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {match.expectedLevels.map((item) => (
                          <Badge key={item.skillLevel.id} variant="outline">
                            {item.skillLevel.name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <p className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/10 p-3 text-sm font-semibold text-primary">
                      <Users className="size-4" aria-hidden="true" />
                      {match.status === MatchStatus.FULL ? "Đã đủ người" : `Cần tuyển thêm ${remaining} người`}
                    </p>

                    {match.description ? <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{match.description}</p> : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {matches.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
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
