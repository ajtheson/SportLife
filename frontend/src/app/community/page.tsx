import { CommunityPostType } from "@prisma/client";
import Link from "next/link";

import { auth } from "@/auth";
import { listAreas, listSports } from "@/features/config/config-service";
import { listCommunityPosts } from "@/features/community/community-service";

type CommunityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePostType(value: string | undefined) {
  if (value && Object.values(CommunityPostType).includes(value as CommunityPostType)) {
    return value as CommunityPostType;
  }

  return undefined;
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const session = await auth();
  const params = await searchParams;
  const selectedTab = firstValue(params.tab) === "mine" ? "mine" : "all";
  const filters = {
    tab: selectedTab as "all" | "mine",
    viewerId: session?.user?.id,
    sportId: firstValue(params.sportId) || undefined,
    areaId: firstValue(params.areaId) || undefined,
    postType: parsePostType(firstValue(params.postType)),
  };
  const [posts, sports, areas] = await Promise.all([listCommunityPosts(filters), listSports(), listAreas()]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Community</h1>
            <p className="mt-3 text-[#5f6b63]">Discuss sport advice, equipment, events, and local experiences.</p>
          </div>
          {session?.user ? (
            <Link className="rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" href="/community/new">
              New post
            </Link>
          ) : (
            <Link className="rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" href="/login">
              Login to post
            </Link>
          )}
        </div>

        {session?.user ? (
          <div className="flex flex-wrap gap-2">
            {[
              ["All posts", "all"],
              ["My posts", "mine"],
            ].map(([label, tab]) => (
              <Link
                className={`rounded-md border px-3 py-2 text-sm font-medium ${
                  filters.tab === tab ? "border-[#0f6b4f] bg-[#0f6b4f] text-white" : "border-[#d9d2c1] bg-white"
                }`}
                href={communityHref({ ...filters, tab })}
                key={tab}
              >
                {label}
              </Link>
            ))}
          </div>
        ) : null}

        <form className="grid gap-3 rounded-lg border border-[#d9d2c1] bg-white p-5 md:grid-cols-[220px_220px_260px_auto]">
          <input name="tab" type="hidden" value={filters.tab} />
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">All sports</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="postType" defaultValue={filters.postType ?? ""}>
            <option value="">All types</option>
            {Object.values(CommunityPostType).map((postType) => (
              <option key={postType} value={postType}>
                {postTypeLabel(postType)}
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

        <div className="grid gap-4">
          {posts.map((post) => (
            <Link key={post.id} className="rounded-lg border border-[#d9d2c1] bg-white p-5 hover:bg-[#fbfaf7]" href={`/community/${post.id}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-md bg-[#eef1ec] px-2 py-1">{post.sport.name}</span>
                    <span className="rounded-md bg-[#f0ece2] px-2 py-1">{postTypeLabel(post.postType)}</span>
                    {post.area ? <span className="rounded-md bg-white px-2 py-1 ring-1 ring-[#d9d2c1]">{post.area.name}</span> : null}
                  </div>
                  <p className="mt-3 text-sm text-[#5f6b63]">
                    {post.author.playerProfile?.displayName ?? post.author.email} Â· {post.createdAt.toLocaleString()}
                  </p>
                </div>
                <div className="grid gap-2 text-right text-sm text-[#5f6b63]">
                  {filters.tab === "mine" ? <span className="font-semibold text-[#1d2520]">{post.status}</span> : null}
                  <span>{post._count.comments} comments</span>
                </div>
              </div>
              <h2 className="mt-4 line-clamp-2 text-xl font-semibold leading-7 text-[#1d2520]">{post.title}</h2>
            </Link>
          ))}

          {posts.length === 0 ? (
            <div className="rounded-lg border border-[#d9d2c1] bg-white p-5 text-sm text-[#5f6b63]">
              No community posts match the current filters.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function postTypeLabel(postType: CommunityPostType) {
  return postType
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function communityHref(input: {
  tab: string;
  sportId?: string;
  areaId?: string;
  postType?: CommunityPostType;
}) {
  const params = new URLSearchParams({ tab: input.tab });

  if (input.sportId) params.set("sportId", input.sportId);
  if (input.areaId) params.set("areaId", input.areaId);
  if (input.postType) params.set("postType", input.postType);

  return `/community?${params.toString()}`;
}
