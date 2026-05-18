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
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className="w-fit rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/community">
          Back to community
        </Link>

        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <article className="rounded-lg border border-[#d9d2c1] bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-md bg-[#eef1ec] px-2 py-1">{post.sport.name}</span>
                <span className="rounded-md bg-[#f0ece2] px-2 py-1">{postTypeLabel(post.postType)}</span>
                {post.area ? <span className="rounded-md bg-white px-2 py-1 ring-1 ring-[#d9d2c1]">{post.area.name}</span> : null}
                <span className="rounded-md bg-white px-2 py-1 ring-1 ring-[#d9d2c1]">{post.status}</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold">{post.title}</h1>
              <p className="mt-3 text-sm text-[#5f6b63]">
                {post.author.playerProfile?.displayName ?? post.author.email} Â· {post.createdAt.toLocaleString()}
              </p>
            </div>
            {isOwner ? (
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" href={`/community/${post.id}/edit`}>
                  Edit
                </Link>
                <form action={deleteCommunityPostAction}>
                  <input name="postId" type="hidden" value={post.id} />
                  <button className="rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          {post.status === ContentStatus.PENDING ? (
            <p className="mt-5 rounded-md bg-[#fff8e6] p-3 text-sm text-[#7a5a12]">
              This post is waiting for admin approval.
            </p>
          ) : null}

          <p className="mt-6 whitespace-pre-wrap leading-7 text-[#1d2520]">{post.content}</p>
        </article>

        <section className="rounded-lg border border-[#d9d2c1] bg-white p-5">
          <h2 className="text-xl font-semibold">Comments</h2>

          {canComment ? (
            <form action={createCommentAction} className="mt-4 grid gap-3">
              <input name="postId" type="hidden" value={post.id} />
              <textarea className="min-h-24 rounded-md border border-[#d9d2c1] px-3 py-2" maxLength={1000} name="content" required />
              <button className="w-fit rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
                Comment
              </button>
            </form>
          ) : null}

          <div className="mt-5 grid gap-3">
            {post.comments.map((comment) => {
              const ownComment = session?.user.id === comment.authorId;

              return (
                <div key={comment.id} className="rounded-md border border-[#ece5d8] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm font-medium">
                      {comment.author.playerProfile?.displayName ?? comment.author.email}
                      <span className="ml-2 font-normal text-[#5f6b63]">{comment.createdAt.toLocaleString()}</span>
                    </p>
                    {ownComment ? (
                      <div className="flex flex-wrap gap-2">
                        <form action={deleteCommentAction}>
                          <input name="postId" type="hidden" value={post.id} />
                          <input name="commentId" type="hidden" value={comment.id} />
                          <button className="rounded-md border border-[#d9d2c1] px-2 py-1 text-xs font-medium" type="submit">
                            Delete
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#445049]">{comment.content}</p>
                </div>
              );
            })}

            {post.comments.length === 0 ? <p className="text-sm text-[#5f6b63]">No comments yet.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.status === "created_pending") return "Post submitted and waiting for admin approval.";
  if (params.status === "updated_pending") return "Post updated and waiting for admin approval.";
  if (params.status === "commented") return "Comment added.";
  if (params.status === "comment_deleted") return "Comment deleted.";
  if (params.error === "invalid_input") return "Please check the submitted values.";
  if (params.error) return "The request could not be completed.";

  return null;
}

function postTypeLabel(postType: string) {
  return postType
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
