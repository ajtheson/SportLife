import { ContentStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import {
  createCommentAction,
  deleteCommentAction,
  deleteCommunityPostAction,
} from "@/features/community/community-actions";
import { getCommunityPost } from "@/features/community/community-service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { postTypeLabel } from "../page";

type CommunityPostPageProps = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CommunityPostPage({ params, searchParams }: CommunityPostPageProps) {
  const session = await auth();
  const { postId } = await params;
  const [post, message] = await Promise.all([
    getCommunityPost(
      postId,
      session?.user ? { id: session.user.id, isAdmin: session.user.role === UserRole.ADMIN } : undefined,
    ),
    pageMessage(searchParams),
  ]);

  if (!post) {
    notFound();
  }

  const isPlayer = session?.user.role === UserRole.PLAYER;
  const isOwner = session?.user.id === post.authorId;
  const canComment = isPlayer && post.status === ContentStatus.VISIBLE;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className={buttonVariants({ variant: "outline", className: "w-fit" })} href="/community">
          ← Quay lại cộng đồng
        </Link>

        {message ? <div className="rounded-md border border-border bg-muted p-4 text-sm text-foreground">{message}</div> : null}

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <Badge variant="secondary">{post.sport.name}</Badge>
                  <Badge variant="outline">{postTypeLabel(post.postType)}</Badge>
                  {post.area ? <Badge variant="outline">{post.area.name}</Badge> : null}
                  <Badge variant="secondary">{post.status}</Badge>
                </div>
                <h1 className="mt-4 text-3xl font-bold text-primary">{post.title}</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  {post.author.playerProfile?.displayName ?? post.author.email} · {post.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
              {isOwner ? (
                <div className="flex flex-wrap gap-2">
                  <Link className={buttonVariants({ variant: "outline" })} href={`/community/${post.id}/edit`}>
                    Sửa
                  </Link>
                  <form action={deleteCommunityPostAction}>
                    <input name="postId" type="hidden" value={post.id} />
                    <Button type="submit" variant="destructive">
                      Xóa
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>

            {post.status === ContentStatus.PENDING ? (
              <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Bài viết này đang chờ Admin duyệt.
              </p>
            ) : null}

            <p className="mt-8 whitespace-pre-wrap leading-7 text-foreground">{post.content}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Bình luận</CardTitle>
          </CardHeader>
          <CardContent>
            {canComment ? (
              <form action={createCommentAction} className="grid gap-4">
                <input name="postId" type="hidden" value={post.id} />
                <Textarea className="min-h-[6rem]" maxLength={1000} name="content" required placeholder="Viết bình luận..." />
                <Button type="submit" className="w-fit">
                  Bình luận
                </Button>
              </form>
            ) : null}

            <div className="mt-8 grid gap-4">
              {post.comments.map((comment) => {
                const ownComment = session?.user.id === comment.authorId;

                return (
                  <div key={comment.id} className="rounded-xl border border-border bg-muted/20 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        {comment.author.playerProfile?.displayName ?? comment.author.email}
                        <span className="ml-2 font-normal text-muted-foreground">{comment.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</span>
                      </p>
                      {ownComment ? (
                        <div className="flex flex-wrap gap-2">
                          <form action={deleteCommentAction}>
                            <input name="postId" type="hidden" value={post.id} />
                            <input name="commentId" type="hidden" value={comment.id} />
                            <Button type="submit" variant="outline" size="sm">
                              Xóa
                            </Button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{comment.content}</p>
                  </div>
                );
              })}

              {post.comments.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.status === "created_pending") return "Bài viết đã được gửi và đang chờ Admin duyệt.";
  if (params.status === "updated_pending") return "Bài viết đã được cập nhật và đang chờ Admin duyệt.";
  if (params.status === "commented") return "Đã thêm bình luận.";
  if (params.status === "comment_deleted") return "Đã xóa bình luận.";
  if (params.error === "invalid_input") return "Vui lòng kiểm tra lại thông tin.";
  if (params.error) return "Không thể thực hiện yêu cầu.";

  return null;
}
