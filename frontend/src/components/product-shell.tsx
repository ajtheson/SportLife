import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";
import Link from "next/link";

import { auth } from "@/auth";
import { logoutAction } from "@/features/auth/auth-actions";

type ProductShellProps = {
  children: React.ReactNode;
};

type NavItem =
  | {
      label: string;
      href: string;
      marker: string;
      enabled: true;
      roles?: UserRole[];
    }
  | {
      label: string;
      marker: string;
      enabled: false;
      roles?: UserRole[];
    };

const primaryNav: NavItem[] = [
  { label: "Find venues", href: "/venues", marker: "V", enabled: true },
  { label: "Find matches", href: "/matches", marker: "M", enabled: true, roles: [UserRole.PLAYER] },
  { label: "Community", href: "/community", marker: "C", enabled: true, roles: [UserRole.PLAYER] },
  { label: "Chat", marker: "T", enabled: false },
  { label: "Notifications", href: "/notifications", marker: "N", enabled: true, roles: [UserRole.PLAYER] },
];

const roleNav: NavItem[] = [
  { label: "Player profile", href: "/player/profile", marker: "P", enabled: true, roles: [UserRole.PLAYER] },
  { label: "My venues", href: "/venue-owner", marker: "O", enabled: true, roles: [UserRole.VENUE_OWNER] },
  { label: "Owner profile", href: "/venue-owner/profile", marker: "B", enabled: true, roles: [UserRole.VENUE_OWNER] },
  { label: "Venue review", href: "/admin/venues", marker: "R", enabled: true, roles: [UserRole.ADMIN] },
  { label: "Community mod", href: "/admin/community", marker: "C", enabled: true, roles: [UserRole.ADMIN] },
  { label: "Configuration", href: "/admin/config", marker: "A", enabled: true, roles: [UserRole.ADMIN] },
];

export async function ProductShell({ children }: ProductShellProps) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#f7f4ed] text-[#1d2520] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border-b border-[#d9d2c1] bg-[#fcfbf8] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-6 px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <Link className="text-xl font-semibold" href="/">
              SportLife
            </Link>
          </div>

          <SessionSummary session={session} />

          <nav className="grid gap-5">
            <NavSection items={primaryNav} role={session?.user.role} title="Explore" />
            <NavSection items={roleNav} role={session?.user.role} title="Workspace" />
          </nav>

          <div className="mt-auto hidden gap-2 lg:grid">
            {session?.user ? (
              <form action={logoutAction}>
                <button className="w-full rounded-md bg-[#1d2520] px-3 py-2 text-sm font-medium text-white" type="submit">
                  Logout
                </button>
              </form>
            ) : (
              <div className="grid gap-2">
                <Link className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/login">
                  Login
                </Link>
                <Link className="rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" href="/register">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SessionSummary({ session }: { session: Session | null }) {
  if (!session?.user) {
    return (
      <div className="rounded-lg border border-[#d9d2c1] bg-white p-3 text-sm text-[#5f6b63]">
        Sign in to manage profiles, venues, matches, and community activity.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#d9d2c1] bg-white p-3 text-sm">
      <div className="font-medium">{session.user.role?.replace("_", " ")}</div>
      <div className="mt-1 truncate text-[#5f6b63]">{session.user.email}</div>
    </div>
  );
}

function NavSection({ items, role, title }: { items: NavItem[]; role?: UserRole; title: string }) {
  const visibleItems = items.filter((item) => !item.roles || (role && item.roles.includes(role)));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-2">
      <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-[#6d766f]">{title}</h2>
      <div className="grid gap-1">
        {visibleItems.map((item) => (
          <NavEntry item={item} key={item.label} />
        ))}
      </div>
    </section>
  );
}

function NavEntry({ item }: { item: NavItem }) {
  const content = (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eef1ec] text-xs font-semibold">
        {item.marker}
      </span>
      <span className="truncate">{item.label}</span>
      {!item.enabled ? <span className="ml-auto rounded bg-[#f0ece2] px-2 py-1 text-xs text-[#6d5d42]">Soon</span> : null}
    </>
  );

  if (!item.enabled) {
    return (
      <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-[#8a908b]" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium hover:bg-white" href={item.href}>
      {content}
    </Link>
  );
}
