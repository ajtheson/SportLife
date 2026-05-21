import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";
import Link from "next/link";

import { auth } from "@/auth";
import { logoutAction } from "@/features/auth/auth-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MobileSidebar } from "@/components/mobile-sidebar";

type ProductShellProps = {
  children: React.ReactNode;
};

type NavItem =
  | {
      label: string;
      href: string;
      icon: string;
      enabled: true;
      roles?: UserRole[];
    }
  | {
      label: string;
      icon: string;
      enabled: false;
      roles?: UserRole[];
    };

const primaryNav: NavItem[] = [
  { label: "Tìm sân", href: "/venues", icon: "🏟️", enabled: true },
  { label: "Tìm trận", href: "/matches", icon: "⚡", enabled: true, roles: [UserRole.PLAYER] },
  { label: "Cộng đồng", href: "/community", icon: "💬", enabled: true, roles: [UserRole.PLAYER] },
  { label: "Nhắn tin", href: "/chat", icon: "✉️", enabled: true, roles: [UserRole.PLAYER, UserRole.VENUE_OWNER] },
  { label: "Thông báo", href: "/notifications", icon: "🔔", enabled: true, roles: [UserRole.PLAYER, UserRole.VENUE_OWNER] },
];

const roleNav: NavItem[] = [
  { label: "Hồ sơ cá nhân", href: "/player/profile", icon: "👤", enabled: true, roles: [UserRole.PLAYER] },
  { label: "Sân của tôi", href: "/venue-owner", icon: "🏢", enabled: true, roles: [UserRole.VENUE_OWNER] },
  { label: "Hồ sơ chủ sân", href: "/venue-owner/profile", icon: "📋", enabled: true, roles: [UserRole.VENUE_OWNER] },
  { label: "Tổng quan", href: "/admin", icon: "📊", enabled: true, roles: [UserRole.ADMIN] },
  { label: "Người dùng", href: "/admin/users", icon: "👥", enabled: true, roles: [UserRole.ADMIN] },
  { label: "Duyệt sân", href: "/admin/venues", icon: "✅", enabled: true, roles: [UserRole.ADMIN] },
  { label: "Kiểm duyệt", href: "/admin/community", icon: "📝", enabled: true, roles: [UserRole.ADMIN] },
  { label: "Cấu hình", href: "/admin/config", icon: "⚙️", enabled: true, roles: [UserRole.ADMIN] },
];

export async function ProductShell({ children }: ProductShellProps) {
  const session = await auth();

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4 px-4 py-5">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Link className="text-xl font-bold tracking-tight text-primary" href="/">
          SportLife
        </Link>
      </div>

      {/* Session info */}
      <SessionSummary session={session} />

      <Separator />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-4">
        <NavSection items={primaryNav} role={session?.user.role} title="Khám phá" />
        <NavSection items={roleNav} role={session?.user.role} title="Không gian làm việc" />
      </nav>

      {/* Auth actions */}
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
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-border bg-sidebar lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
        <Link className="text-lg font-bold tracking-tight text-primary" href="/">
          SportLife
        </Link>
        <MobileSidebar>{sidebarContent}</MobileSidebar>
      </header>

      {/* Main content */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SessionSummary({ session }: { session: Session | null }) {
  if (!session?.user) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
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
    <div className="rounded-lg border border-border bg-card p-3 text-sm">
      <div className="font-medium">{roleLabels[session.user.role ?? ""] ?? session.user.role}</div>
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
      <h2 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {visibleItems.map((item) => (
        <NavEntry item={item} key={item.label} />
      ))}
    </section>
  );
}

function NavEntry({ item }: { item: NavItem }) {
  const content = (
    <>
      <span className="text-base leading-none">{item.icon}</span>
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
      <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground/60" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      href={item.href}
    >
      {content}
    </Link>
  );
}
