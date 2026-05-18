import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { logoutAction } from "@/features/auth/auth-actions";
import { userHasPlayerProfile } from "@/features/player-profile/player-profile-service";
import { userHasVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";

export default async function Home() {
  const session = await auth();

  if (session?.user.role === UserRole.PLAYER && !(await userHasPlayerProfile(session.user.id))) {
    redirect("/player/profile");
  }

  if (session?.user.role === UserRole.VENUE_OWNER && !(await userHasVenueOwnerProfile(session.user.id))) {
    redirect("/venue-owner/profile");
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] text-[#1d2520]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <Header session={session} />

        <div className="grid flex-1 items-center gap-10 py-12 md:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#0f6b4f]">
              Hanoi sport community
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Find venues, players, and open matches nearby.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#526057]">
              SportLife connects players and venue owners for billiard, badminton, and pickleball across Hanoi.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              ["Players", "Create a sport profile, discover venues, and join matches."],
              ["Venue Owners", "Publish venue listings and track approval status."],
              ["Admins", "Manage users, venues, areas, levels, and community content."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-lg border border-[#d9d2c1] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5f6b63]">{description}</p>
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
      <div className="text-xl font-semibold">SportLife</div>
      {session?.user ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-[#526057] sm:inline">{session.user.email}</span>
          {session.user.role === UserRole.PLAYER ? (
            <a className="rounded-md px-3 py-2 hover:bg-white" href="/player/profile">
              Profile
            </a>
          ) : null}
          {session.user.role === UserRole.ADMIN ? (
            <a className="rounded-md px-3 py-2 hover:bg-white" href="/admin/config">
              Admin Config
            </a>
          ) : null}
          {session.user.role === UserRole.ADMIN ? (
            <a className="rounded-md px-3 py-2 hover:bg-white" href="/admin/venues">
              Venue Review
            </a>
          ) : null}
          {session.user.role === UserRole.VENUE_OWNER ? (
            <a className="rounded-md px-3 py-2 hover:bg-white" href="/venue-owner">
              Venues
            </a>
          ) : null}
          <Link className="rounded-md px-3 py-2 hover:bg-white" href="/venues">
            Discover
          </Link>
          <form action={logoutAction}>
            <button className="rounded-md bg-[#1d2520] px-3 py-2 text-white" type="submit">
              Logout
            </button>
          </form>
        </div>
      ) : (
        <nav className="flex gap-3 text-sm font-medium">
          <a className="rounded-md px-3 py-2 hover:bg-white" href="/login">
            Login
          </a>
          <a className="rounded-md bg-[#0f6b4f] px-3 py-2 text-white hover:bg-[#0b573f]" href="/register">
            Register
          </a>
        </nav>
      )}
    </header>
  );
}
