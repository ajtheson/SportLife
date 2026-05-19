import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { logoutAction } from "@/features/auth/auth-actions";
import { userHasPlayerProfile } from "@/features/player-profile/player-profile-service";
import { userHasVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (session?.user.role === UserRole.PLAYER && !(await userHasPlayerProfile(session.user.id))) {
    redirect("/player/profile");
  }

  if (session?.user.role === UserRole.VENUE_OWNER && !(await userHasVenueOwnerProfile(session.user.id))) {
    redirect("/venue-owner/profile");
  }

  if (session?.user) {
    redirect("/venues");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <Header session={session} />

        <div className="grid flex-1 items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
              Cộng đồng thể thao Hà Nội
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Tìm sân, kết nối người chơi và tham gia trận đấu quanh bạn.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              SportLife kết nối người chơi và chủ sân cho các bộ môn Billiard, Cầu lông và Pickleball trên toàn Hà Nội.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              ["Người chơi", "Tạo hồ sơ thể thao, tìm kiếm sân tập và tham gia các trận đấu."],
              ["Chủ sân", "Đăng thông tin sân và theo dõi trạng thái kiểm duyệt."],
              ["Quản trị viên", "Quản lý người dùng, sân bãi, khu vực, trình độ và nội dung cộng đồng."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Header({ session }: { session: Session | null }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="text-xl font-bold tracking-tight text-primary">SportLife</div>
      {session?.user ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-muted-foreground sm:inline">{session.user.email}</span>
          {session.user.role === UserRole.PLAYER ? (
            <Link className={buttonVariants({ variant: "ghost" })} href="/player/profile">
              Hồ sơ
            </Link>
          ) : null}
          {session.user.role === UserRole.ADMIN ? (
            <Link className={buttonVariants({ variant: "ghost" })} href="/admin/config">
              Cấu hình
            </Link>
          ) : null}
          {session.user.role === UserRole.ADMIN ? (
            <Link className={buttonVariants({ variant: "ghost" })} href="/admin/venues">
              Duyệt sân
            </Link>
          ) : null}
          {session.user.role === UserRole.VENUE_OWNER ? (
            <Link className={buttonVariants({ variant: "ghost" })} href="/venue-owner">
              Quản lý sân
            </Link>
          ) : null}
          <Link className={buttonVariants({ variant: "ghost" })} href="/venues">
            Khám phá
          </Link>
          <form action={logoutAction}>
            <button className={buttonVariants({ variant: "default" })} type="submit">
              Đăng xuất
            </button>
          </form>
        </div>
      ) : (
        <nav className="flex gap-3 text-sm font-medium">
          <Link className={buttonVariants({ variant: "ghost" })} href="/login">
            Đăng nhập
          </Link>
          <Link className={buttonVariants({ variant: "default" })} href="/register">
            Đăng ký
          </Link>
        </nav>
      )}
    </header>
  );
}
