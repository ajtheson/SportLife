import { ContentStatus } from "@prisma/client";

import { approveContentAction, deleteContentAction } from "@/features/community/community-actions";
import { listAdminCommunityContent } from "@/features/community/community-service";

import { requireAdminPage } from "../config/config-page-utils";

type AdminCommunityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ModerationPost = Awaited<ReturnType<typeof listAdminCommunityContent>>["posts"][number];

export default async function AdminCommunityPage({ searchParams }: AdminCommunityPageProps) {
  await requireAdminPage();
  const [content, message] = await Promise.all([listAdminCommunityContent(), pageMessage(searchParams)]);
  const pendingPosts = content.posts.filter((post) => post.status === ContentStatus.PENDING);
  const approvedPosts = content.posts.filter((post) => post.status === ContentStatus.VISIBLE);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Community moderation</h1>
          <p className="mt-3 text-[#5f6b63]">Review posts with their comments in one place.</p>
        </div>

        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <PostSection emptyText="No pending posts." posts={pendingPosts} title="Pending review" />
        <PostSection emptyText="No approved posts." posts={approvedPosts} title="Approved posts" />
      </div>
    </main>
  );
}

function PostSection({ emptyText, posts, title }: { emptyText: string; posts: ModerationPost[]; title: string }) {
  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="rounded-md bg-white px-2 py-1 text-sm text-[#5f6b63] ring-1 ring-[#d9d2c1]">{posts.length}</span>
      </div>

      {posts.map((post) => (
        <article key={post.id} className="rounded-lg border border-[#d9d2c1] bg-white p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-md bg-[#eef1ec] px-2 py-1">{post.sport.name}</span>
                <span className="rounded-md bg-[#f0ece2] px-2 py-1">{post.postType}</span>
                {post.area ? <span className="rounded-md bg-white px-2 py-1 ring-1 ring-[#d9d2c1]">{post.area.name}</span> : null}
                <span className="rounded-md bg-white px-2 py-1 ring-1 ring-[#d9d2c1]">{post.status}</span>
              </div>
              <p className="mt-3 text-sm text-[#5f6b63]">
                {post.author.playerProfile?.displayName ?? post.author.email} - {post.createdAt.toLocaleString()} - {post.comments.length} comments
              </p>
              <h3 className="mt-4 text-lg font-semibold">{post.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#445049]">{post.content}</p>
            </div>
            <ModerationActions status={post.status} targetId={post.id} targetType="POST" />
          </div>

          <div className="mt-5 border-t border-[#ece5d8] pt-4">
            <h4 className="text-sm font-semibold">Comments</h4>
            <div className="mt-3 grid gap-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="grid gap-3 rounded-md border border-[#ece5d8] p-3 md:grid-cols-[minmax(0,1fr)_120px]">
                  <div>
                    <p className="text-xs font-medium text-[#5f6b63]">
                      {comment.author.playerProfile?.displayName ?? comment.author.email} - {comment.createdAt.toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#445049]">{comment.content}</p>
                  </div>
                  <ModerationActions status={comment.status} targetId={comment.id} targetType="COMMENT" />
                </div>
              ))}
              {post.comments.length === 0 ? <p className="text-sm text-[#5f6b63]">No comments yet.</p> : null}
            </div>
          </div>
        </article>
      ))}

      {posts.length === 0 ? <p className="rounded-lg border border-[#d9d2c1] bg-white p-5 text-sm text-[#5f6b63]">{emptyText}</p> : null}
    </section>
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
          <button className="w-full rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" type="submit">
            Approve
          </button>
        </form>
      ) : null}
      <form action={deleteContentAction}>
        <input name="targetId" type="hidden" value={targetId} />
        <input name="targetType" type="hidden" value={targetType} />
        <button className="w-full rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" type="submit">
          Delete
        </button>
      </form>
    </div>
  );
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.status === "approved") return "Content approved.";
  if (params.status === "deleted") return "Content deleted.";
  if (params.error === "invalid_input") return "Please check the submitted values.";
  if (params.error) return "The request could not be completed.";

  return null;
}
