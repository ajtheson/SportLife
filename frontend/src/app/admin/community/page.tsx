import { ContentStatus } from "@prisma/client";
import { Search } from "lucide-react";

import { approveContentAction, deleteContentAction } from "@/features/community/community-actions";
import { listAdminCommunityContent } from "@/features/community/community-service";
import { listSports } from "@/features/config/config-service";
import { parsePage, calcTotalPages, firstParam } from "@/lib/pagination-utils";
import { Pagination } from "@/components/ui/pagination";
import { requireAdminPage } from "../config/config-page-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type AdminCommunityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const PAGE_SIZE = 10;

const postTypeMap: Record<string, string> = {
  DISCUSSION: "Thảo luận",
  EQUIPMENT_QUESTION: "Hỏi về dụng cụ",
  EVENT_ANNOUNCEMENT: "Thông báo sự kiện",
  VENUE_REVIEW: "Đánh giá sân",
  GENERAL: "Khác",
};

export default async function AdminCommunityPage({ searchParams }: AdminCommunityPageProps) {
  await requireAdminPage();
  const params = await searchParams;

  const status = firstParam(params.status) as ContentStatus || undefined;
  const sportId = firstParam(params.sportId) || undefined;
  const q = firstParam(params.q)?.trim() || undefined;

  const filters = {
    status,
    sportId,
    q,
  };

  const { page, skip, take } = parsePage(params, PAGE_SIZE);

  const [{ items: posts, totalCount }, sports, message] = await Promise.all([
    listAdminCommunityContent({ ...filters, skip, take }),
    listSports(),
    pageMessage(searchParams),
  ]);

  const totalPagesCount = calcTotalPages(totalCount, PAGE_SIZE);

  const paginationSearchParams: Record<string, string | undefined> = {
    status: filters.status,
    sportId: filters.sportId,
    q: filters.q,
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Kiểm duyệt cộng đồng</h1>
          <p className="mt-3 text-muted-foreground">Quản lý và kiểm duyệt bài viết cùng bình luận.</p>
        </div>

        {message ? (
          <div className={`rounded-md border p-4 text-sm ${message.includes("Không thể") || message.includes("Vui lòng") ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/50 bg-primary/10 text-primary"}`}>
            {message}
          </div>
        ) : null}

        {/* Filter Form */}
        <form className="grid gap-4 rounded-xl border border-border bg-card/95 p-4 shadow-sm md:grid-cols-[180px_180px_minmax(0,1fr)_auto]" action="/admin/community">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="status">Trạng thái</label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả bài viết</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="VISIBLE">Đã duyệt</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="sportId">Môn thể thao</label>
            <select
              id="sportId"
              name="sportId"
              defaultValue={filters.sportId ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả môn</option>
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>{sport.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="q">Tìm kiếm</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="q"
                className="pl-9 h-10"
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Nhập tiêu đề bài viết..."
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full md:w-auto h-10">Lọc & Tìm</Button>
          </div>
        </form>

        <section className="grid gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              {filters.status === "PENDING" ? "Bài viết chờ duyệt" : filters.status === "VISIBLE" ? "Bài viết đã duyệt" : "Tất cả bài viết"}
            </h2>
            <Badge variant="secondary">{totalCount}</Badge>
          </div>

          <div className="grid gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <Badge variant="secondary">{post.sport.name}</Badge>
                      <Badge variant="outline">{postTypeMap[post.postType] ?? post.postType}</Badge>
                      {post.area ? <Badge variant="outline">{post.area.name}</Badge> : null}
                      <Badge variant={post.status === "PENDING" ? "destructive" : "default"}>
                        {post.status === "PENDING" ? "CHỜ DUYỆT" : "ĐÃ DUYỆT"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {post.author.playerProfile?.displayName ?? post.author.email} - {post.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })} - {post.comments.length} bình luận
                    </p>
                    <h3 className="mt-4 text-lg font-semibold text-primary">{post.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground">{post.content}</p>
                  </div>
                  <ModerationActions status={post.status} targetId={post.id} targetType="POST" />
                </div>

                <div className="border-t border-border bg-muted/20 p-5">
                  <h4 className="text-sm font-semibold text-foreground">Bình luận</h4>
                  <div className="mt-4 grid gap-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="grid gap-3 rounded-md border border-border bg-background p-4 md:grid-cols-[minmax(0,1fr)_120px]">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {comment.author.playerProfile?.displayName ?? comment.author.email} <span className="ml-2 font-normal text-muted-foreground">{comment.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
                          </p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{comment.content}</p>
                        </div>
                        <ModerationActions status={comment.status} targetId={comment.id} targetType="COMMENT" />
                      </div>
                    ))}
                    {post.comments.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p> : null}
                  </div>
                </div>
              </Card>
            ))}

            {posts.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                Không tìm thấy bài viết nào phù hợp bộ lọc.
              </div>
            ) : null}
          </div>
        </section>

        {totalPagesCount > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPagesCount}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              searchParams={paginationSearchParams}
              basePath="/admin/community"
            />
          </div>
        )}
      </div>
    </main>
  );
}

function ModerationActions({
  status,
  targetId,
  targetType,
}: {
  status: ContentStatus;
  targetId: string;
  targetType: "POST" | "COMMENT";
}) {
  return (
    <div className="grid content-start gap-2">
      {targetType === "POST" && status === ContentStatus.PENDING ? (
        <form action={approveContentAction}>
          <input name="targetId" type="hidden" value={targetId} />
          <input name="targetType" type="hidden" value={targetType} />
          <Button className="w-full" type="submit">
            Duyệt bài
          </Button>
        </form>
      ) : null}
      <form action={deleteContentAction}>
        <input name="targetId" type="hidden" value={targetId} />
        <input name="targetType" type="hidden" value={targetType} />
        <Button variant="destructive" className="w-full" type="submit">
          Xóa
        </Button>
      </form>
    </div>
  );
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.status === "approved") return "Nội dung đã được duyệt.";
  if (params.status === "deleted") return "Nội dung đã bị xóa.";
  if (params.error === "invalid_input") return "Vui lòng kiểm tra lại thông tin.";
  if (params.error) return "Không thể thực hiện yêu cầu.";

  return null;
}
