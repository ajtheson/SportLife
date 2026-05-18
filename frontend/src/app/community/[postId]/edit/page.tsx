import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCommunityFormData, getEditableCommunityPost } from "@/features/community/community-service";

import { CommunityPostForm } from "../../community-post-form";

type EditCommunityPostPageProps = {
  params: Promise<{ postId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCommunityPostPage({ params, searchParams }: EditCommunityPostPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const { postId } = await params;
  const [post, data, message] = await Promise.all([
    getEditableCommunityPost(postId, session.user.id),
    getCommunityFormData(),
    pageMessage(searchParams),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className="w-fit rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href={`/community/${post.id}`}>
          Back to post
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Edit post</h1>
          <p className="mt-3 text-[#5f6b63]">Update the content, sport tag, or discussion type.</p>
        </div>
        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}
        <CommunityPostForm areas={data.areas} post={post} postTypes={data.postTypes} sports={data.sports} />
      </div>
    </main>
  );
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.error === "invalid_input") return "Please check the submitted values.";
  if (params.error) return "The post could not be saved.";

  return null;
}
