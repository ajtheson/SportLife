import { UserRole } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Building2,
  CalendarPlus,
  CheckSquare,
  ClipboardList,
  Gauge,
  Home,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import type { Session } from "next-auth";
import Link from "next/link";

import { auth } from "@/auth";
import { logoutAction } from "@/features/auth/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MobileSidebar } from "@/components/mobile-sidebar";

type ProductShellProps = {
  children: React.ReactNode;
};

type NavItem =
  | {
      label: string;
      href: string;
      icon: LucideIcon;
      enabled: true;
      roles?: UserRole[];
    }
  | {
      label: string;
      icon: LucideIcon;
      enabled: false;
      roles?: UserRole[];
    };

const primaryNav: NavItem[] = [
  { label: "Tìm sân", href: "/venues", icon: Search, enabled: true },
  { label: "Tìm trận", href: "/matches", icon: CalendarPlus, enabled: true },
  { label: "Cộng đồng", href: "/community", icon: MessageSquareText, enabled: true },
  { label: "Nhắn tin", href: "/chat", icon: Bell, enabled: true, roles: [UserRole.PLAYER, UserRole.VENUE_OWNER] },
  { label: "Thông báo", href: "/notifications", icon: ShieldCheck, enabled: true, roles: [UserRole.PLAYER, UserRole.VENUE_OWNER] },
];

const roleNav: NavItem[] = [
  { label: "Hồ sơ cá nhân", href: "/player/profile", icon: User, enabled: true, roles: [UserRole.PLAYER] },
  { label: "Sân của tôi", href: "/venue-owner", icon: Building2, enabled: true, roles: [UserRole.VENUE_OWNER] },
  { label: "Hồ sơ chủ sân", href: "/venue-owner/profile", icon: ClipboardList, enabled: true, roles: [UserRole.VENUE_OWNER] },
  { label: "Tổng quan", href: "/admin", icon: Gauge, enabled: true, roles: [UserRole.ADMIN] },
  { label: "Người dùng", href: "/admin/users", icon: Users, enabled: true, roles: [UserRole.ADMIN] },
  { label: "Duyệt sân", href: "/admin/venues", icon: CheckSquare, enabled: true, roles: [UserRole.ADMIN] },
  { label: "Kiểm duyệt", href: "/admin/community", icon: MessageSquareText, enabled: true, roles: [UserRole.ADMIN] },
  { label: "Cấu hình", href: "/admin/config", icon: Settings, enabled: true, roles: [UserRole.ADMIN] },
];

export async function ProductShell({ children }: ProductShellProps) {
  const session = await auth();

  const sidebarContent = (
    <div className="flex h-full flex-col gap-5 px-4 py-5">
      <Link
        className="flex min-h-12 items-center gap-3 rounded-xl bg-primary/10 p-2 text-xl font-bold tracking-tight text-primary ring-1 ring-primary/15 transition-colors hover:bg-primary/15"
        href="/"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Home className="size-5" aria-hidden="true" />
        </span>
        SportLife
      </Link>

      <SessionSummary session={session} />

      <Separator />

      <nav className="flex flex-1 flex-col gap-5">
        <NavSection items={primaryNav} role={session?.user.role} title="Khám phá" />
        <NavSection items={roleNav} role={session?.user.role} title="Không gian làm việc" />
      </nav>

      <div className="grid gap-2">
        {session?.user ? (
          <form action={logoutAction}>
            <Button className="w-full" variant="outline" type="submit">
              Đăng xuất
            </Button>
          </form>
        ) : (
          <>
            <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              Đăng nhập
            </Link>
            <Link href="/register" className={buttonVariants({ className: "w-full" })}>
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[292px_minmax(0,1fr)]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar/95 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        {sidebarContent}
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-sidebar/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link className="flex min-h-10 items-center gap-2 text-lg font-bold tracking-tight text-primary" href="/">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="size-4" aria-hidden="true" />
          </span>
          SportLife
        </Link>
        <MobileSidebar>{sidebarContent}</MobileSidebar>
      </header>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SessionSummary({ session }: { session: Session | null }) {
  if (!session?.user) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm leading-6 text-muted-foreground shadow-sm">
        Đăng nhập để quản lý hồ sơ, sân, trận đấu và hoạt động cộng đồng.
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    PLAYER: "Người chơi",
    VENUE_OWNER: "Chủ sân",
    ADMIN: "Quản trị viên",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm shadow-sm">
      <div className="font-semibold text-foreground">{roleLabels[session.user.role ?? ""] ?? session.user.role}</div>
      <div className="mt-1 truncate text-muted-foreground">{session.user.email}</div>
    </div>
  );
}

function NavSection({ items, role, title }: { items: NavItem[]; role?: UserRole; title: string }) {
  const visibleItems = items.filter((item) => !item.roles || (role && item.roles.includes(role)));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-1">
      <h2 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{title}</h2>
      {visibleItems.map((item) => (
        <NavEntry item={item} key={item.label} />
      ))}
    </section>
  );
}

function NavEntry({ item }: { item: NavItem }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover/link:bg-primary/10 group-hover/link:text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="truncate">{item.label}</span>
      {!item.enabled ? (
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Sắp ra mắt
        </Badge>
      ) : null}
    </>
  );

  if (!item.enabled) {
    return (
      <div className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted-foreground/60" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      className="group/link flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-sidebar-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      href={item.href}
    >
      {content}
    </Link>
  );
}
