import { CommunityPostType } from "@prisma/client";
import { Search } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { listAreas, listSports } from "@/features/config/config-service";
import { listCommunityPosts } from "@/features/community/community-service";
import { parsePage, calcTotalPages, firstParam } from "@/lib/pagination-utils";
import { Pagination } from "@/components/ui/pagination";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type CommunityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parsePostType(value: string | undefined) {
  if (value && Object.values(CommunityPostType).includes(value as CommunityPostType)) {
    return value as CommunityPostType;
  }
  return undefined;
}

const postTypeMap: Record<string, string> = {
  DISCUSSION: "Thảo luận",
  EQUIPMENT_QUESTION: "Hỏi về dụng cụ",
  EVENT_ANNOUNCEMENT: "Thông báo sự kiện",
  VENUE_REVIEW: "Đánh giá sân",
  GENERAL: "Khác",
};

export function postTypeLabel(postType: string) {
  return postTypeMap[postType] ?? postType;
}

const PAGE_SIZE = 10;

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const session = await auth();
  const params = await searchParams;
  const selectedTab = firstParam(params.tab) === "mine" ? "mine" : "all";
  const q = firstParam(params.q)?.trim() || undefined;
  const filters = {
    tab: selectedTab as "all" | "mine",
    viewerId: session?.user?.id,
    sportId: firstParam(params.sportId) || undefined,
    areaId: firstParam(params.areaId) || undefined,
    postType: parsePostType(firstParam(params.postType)),
    q,
  };
  const { page, skip, take } = parsePage(params, PAGE_SIZE);
  const [{ items: posts, totalCount }, sports, areas] = await Promise.all([
    listCommunityPosts({ ...filters, skip, take }),
    listSports(),
    listAreas(),
  ]);
  const totalPagesCount = calcTotalPages(totalCount, PAGE_SIZE);

  const paginationSearchParams: Record<string, string | undefined> = {
    tab: selectedTab,
    sportId: filters.sportId,
    areaId: filters.areaId,
    postType: filters.postType,
    q,
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Cộng đồng</h1>
            <p className="mt-3 text-muted-foreground">Thảo luận, chia sẻ kinh nghiệm, đánh giá thiết bị và thông báo sự kiện.</p>
          </div>
          {session?.user ? (
            <Link className={buttonVariants()} href="/community/new">
              Đăng bài mới
            </Link>
          ) : (
            <Link className={buttonVariants()} href="/login">
              Đăng nhập để bình luận
            </Link>
          )}
        </div>

        {session?.user ? (
          <div className="flex flex-wrap gap-2">
            {[
              ["Tất cả bài viết", "all"],
              ["Bài viết của tôi", "mine"],
            ].map(([label, tab]) => (
              <Link
                className={buttonVariants({ variant: filters.tab === tab ? "default" : "outline" })}
                href={communityHref({ ...filters, tab })}
                key={tab}
              >
                {label}
              </Link>
            ))}
          </div>
        ) : null}

        <form className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_180px_180px_220px_auto]">
          <input name="tab" type="hidden" value={filters.tab} />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" name="q" defaultValue={q ?? ""} placeholder="Tìm theo tiêu đề..." />
          </div>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">Tất cả các môn</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="postType" defaultValue={filters.postType ?? ""}>
            <option value="">Tất cả chủ đề</option>
            {Object.values(CommunityPostType).map((postType) => (
              <option key={postType} value={postType}>
                {postTypeLabel(postType)}
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

        <div className="grid gap-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/${post.id}`}>
              <Card className="transition-colors hover:bg-muted/50 hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2 text-xs font-semibold">
                        <Badge variant="secondary">{post.sport.name}</Badge>
                        <Badge variant="outline">{postTypeLabel(post.postType)}</Badge>
                        {post.area ? <Badge variant="outline">{post.area.name}</Badge> : null}
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {post.author.playerProfile?.displayName ?? post.author.email} · {post.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="grid gap-2 text-right text-sm text-muted-foreground">
                      {filters.tab === "mine" ? <span className="font-semibold text-foreground">{post.status}</span> : null}
                      <span>{post._count.comments} bình luận</span>
                    </div>
                  </div>
                  <CardTitle className="mt-4 line-clamp-2 text-xl font-semibold leading-7 text-primary">{post.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}

          {posts.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Không có bài viết nào phù hợp với bộ lọc.
            </div>
          ) : null}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPagesCount}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          searchParams={paginationSearchParams}
          basePath="/community"
        />
      </div>
    </main>
  );
}

function communityHref(input: {
  tab: string;
  sportId?: string;
  areaId?: string;
  postType?: CommunityPostType;
  q?: string;
}) {
  const params = new URLSearchParams({ tab: input.tab });

  if (input.sportId) params.set("sportId", input.sportId);
  if (input.areaId) params.set("areaId", input.areaId);
  if (input.postType) params.set("postType", input.postType);
  if (input.q) params.set("q", input.q);

  return `/community?${params.toString()}`;
}
