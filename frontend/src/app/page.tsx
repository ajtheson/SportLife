import { UserRole } from "@prisma/client";
import { ArrowRight, Building2, MessageSquare, Search, ShieldCheck, Swords, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { userHasPlayerProfile } from "@/features/player-profile/player-profile-service";
import { userHasVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const entryPoints = [
  {
    title: "Tìm sân",
    description: "Lọc sân theo môn, phường/xã, giá tham khảo và nhắn tin trực tiếp với chủ sân.",
    href: "/venues",
    icon: Search,
  },
  {
    title: "Tìm kèo",
    description: "Tạo trận, gửi yêu cầu tham gia và theo dõi trạng thái duyệt trong hệ thống.",
    href: "/matches",
    icon: Swords,
  },
  {
    title: "Cộng đồng",
    description: "Đăng bài hỏi kinh nghiệm, chia sẻ thiết bị, sự kiện và câu chuyện thể thao.",
    href: "/community",
    icon: MessageSquare,
  },
];

const trustSignals = [
  { value: "126", label: "phường/xã Hà Nội" },
  { value: "3", label: "môn thể thao" },
  { value: "1:1", label: "chat trực tiếp" },
];

export default async function Home() {
  const session = await auth();

  if (session?.user?.role === UserRole.PLAYER && !(await userHasPlayerProfile(session.user.id))) {
    redirect("/player/profile");
  }

  if (session?.user?.role === UserRole.VENUE_OWNER && !(await userHasVenueOwnerProfile(session.user.id))) {
    redirect("/venue-owner/profile");
  }

  if (session?.user) {
    redirect("/venues");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative isolate flex min-h-[92vh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Người chơi thể thao trong nhà tại Hà Nội"
          className="absolute inset-0 -z-20 size-full object-cover"
          src="/landing-hero.jpg"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(8,24,18,0.92)_0%,rgba(8,24,18,0.76)_42%,rgba(8,24,18,0.32)_100%)]" />

        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-8">
          <Header />

          <div className="grid flex-1 content-center gap-10 py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.55fr)] lg:items-end">
            <div className="max-w-3xl text-white">
              <Badge className="mb-5 border-white/20 bg-white/12 text-white backdrop-blur" variant="outline">
                Cộng đồng thể thao Hà Nội
              </Badge>
              <h1 className="text-5xl font-black leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">SportLife</h1>
              <p className="mt-6 max-w-2xl text-xl font-medium leading-8 text-white/90 sm:text-2xl sm:leading-9">
                Tìm sân, kết nối người chơi và tham gia các trận đấu quanh bạn trong cùng một không gian.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className={cn(buttonVariants({ size: "lg" }), "bg-white text-slate-950 hover:bg-white/90")} href="/register">
                  Bắt đầu ngay
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link className={cn(buttonVariants({ size: "lg", variant: "outline" }), "border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white")} href="/login">
                  Đăng nhập
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/18 bg-slate-950/45 p-4 text-white shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3 border-b border-white/12 pb-3">
                <div>
                  <p className="text-sm font-semibold text-white/70">Bảng điều hướng</p>
                  <p className="text-lg font-bold">Dành cho người chơi mới</p>
                </div>
                <Users className="size-5 text-emerald-200" aria-hidden="true" />
              </div>
              {entryPoints.map((item) => (
                <Link
                  className="group grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/8 p-3 transition hover:border-white/25 hover:bg-white/14"
                  href={item.href}
                  key={item.title}
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-white text-slate-950">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-semibold">{item.title}</span>
                    <span className="line-clamp-2 text-sm leading-5 text-white/72">{item.description}</span>
                  </span>
                  <ArrowRight className="size-4 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/80">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
          {trustSignals.map((item) => (
            <div className="flex items-baseline gap-3" key={item.label}>
              <span className="text-3xl font-black text-primary">{item.value}</span>
              <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <Feature title="Người chơi" description="Hoàn thiện hồ sơ, chọn môn và trình độ, rồi tìm sân hoặc kèo phù hợp." icon={Users} />
        <Feature title="Chủ sân" description="Đăng sân, cập nhật tình trạng còn trống và nhận liên hệ từ người chơi." icon={Building2} />
        <Feature title="Quản trị" description="Duyệt sân, duyệt bài cộng đồng và quản lý cấu hình môn, trình độ, khu vực." icon={ShieldCheck} />
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4 text-white">
      <Link className="text-xl font-black tracking-tight" href="/">
        SportLife
      </Link>
      <nav className="flex gap-2 text-sm font-semibold">
        <Link className={cn(buttonVariants({ variant: "ghost" }), "text-white hover:bg-white/12 hover:text-white")} href="/login">
          Đăng nhập
        </Link>
        <Link className={cn(buttonVariants({ variant: "secondary" }), "bg-white text-slate-950 hover:bg-white/90")} href="/register">
          Đăng ký
        </Link>
      </nav>
    </header>
  );
}

function Feature({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
