import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listOwnerVenues } from "@/features/venues/venue-service";
import { userHasVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";

type VenueOwnerPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  return params.status === "submitted" ? "Venue submitted for admin approval." : null;
}

export default async function VenueOwnerPage({ searchParams }: VenueOwnerPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  if (!(await userHasVenueOwnerProfile(session.user.id))) {
    redirect("/venue-owner/profile");
  }

  const [venues, message] = await Promise.all([listOwnerVenues(session.user.id), pageMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">My venues</h1>
            <p className="mt-3 text-[#5f6b63]">Submit venues and track approval status.</p>
          </div>
          <div className="flex gap-2">
            <Link className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/">
              Home
            </Link>
            <Link className="rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" href="/venue-owner/venues/new">
              New venue
            </Link>
          </div>
        </div>

        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <div className="grid gap-4">
          {venues.map((venue) => (
            <article key={venue.id} className="rounded-lg border border-[#d9d2c1] bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{venue.name}</h2>
                  <p className="mt-2 text-sm text-[#5f6b63]">{venue.address}</p>
                  <p className="mt-2 text-sm text-[#5f6b63]">
                    {venue.area.name} · {venue.sports.map((item) => item.sport.name).join(", ")}
                  </p>
                  {venue.rejectionReason ? (
                    <p className="mt-3 rounded-md bg-[#fff5f0] p-3 text-sm text-[#8a3b1f]">
                      Rejection reason: {venue.rejectionReason}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2 text-sm">
                  <span>{venue.approvalStatus}</span>
                  <span>{venue.visibilityStatus}</span>
                  <Link className="rounded-md border border-[#d9d2c1] px-3 py-2 text-center" href={`/venue-owner/venues/${venue.id}/edit`}>
                    Edit
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {venues.length === 0 ? (
            <div className="rounded-lg border border-[#d9d2c1] bg-white p-5 text-sm text-[#5f6b63]">
              No venues submitted yet.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
