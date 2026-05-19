import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getCommunityFormData } from "@/features/community/community-service";
import { buttonVariants } from "@/components/ui/button";

import { CommunityPostForm } from "../community-post-form";

type NewCommunityPostPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewCommunityPostPage({ searchParams }: NewCommunityPostPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const [data, message] = await Promise.all([getCommunityFormData(), pageMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className={buttonVariants({ variant: "outline", className: "w-fit" })} href="/community">
          ← Quay lại cộng đồng
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Bài viết cộng đồng mới</h1>
          <p className="mt-3 text-muted-foreground">Tạo bài viết và chờ Admin duyệt để hiển thị công khai.</p>
        </div>
        {message ? <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{message}</div> : null}
        <CommunityPostForm areas={data.areas} postTypes={data.postTypes} sports={data.sports} />
      </div>
    </main>
  );
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.error === "invalid_input") return "Vui lòng kiểm tra lại thông tin.";
  if (params.error) return "Không thể lưu bài viết.";

  return null;
}
