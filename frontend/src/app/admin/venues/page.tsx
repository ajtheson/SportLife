import { VisibilityStatus } from "@prisma/client";

import {
  approveVenueAction,
  hideVenueAction,
  rejectVenueAction,
  showVenueAction,
} from "@/features/venues/venue-actions";
import { listAdminVenues } from "@/features/venues/venue-service";

import { configMessage, requireAdminPage } from "../config/config-page-utils";

type AdminVenuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminVenuesPage({ searchParams }: AdminVenuesPageProps) {
  await requireAdminPage();
  const [venues, message] = await Promise.all([listAdminVenues(), configMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Venue review</h1>
          <p className="mt-3 text-[#5f6b63]">Approve, reject, hide, or restore venue listings.</p>
        </div>

        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <div className="grid gap-4">
          {venues.map((venue) => {
            const visibilityAction =
              venue.visibilityStatus === VisibilityStatus.ACTIVE ? hideVenueAction : showVenueAction;
            const nextVisibility =
              venue.visibilityStatus === VisibilityStatus.ACTIVE ? VisibilityStatus.HIDDEN : VisibilityStatus.ACTIVE;

            return (
              <article key={venue.id} className="rounded-lg border border-[#d9d2c1] bg-white p-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <h2 className="text-xl font-semibold">{venue.name}</h2>
                    <p className="mt-2 text-sm text-[#5f6b63]">{venue.address}</p>
                    <p className="mt-2 text-sm text-[#5f6b63]">
                      {venue.area.name} · {venue.sports.map((item) => item.sport.name).join(", ")}
                    </p>
                    <p className="mt-2 text-sm text-[#5f6b63]">
                      Owner: {venue.owner.venueOwnerProfile?.businessName ?? venue.owner.email}
                    </p>
                    <p className="mt-3 text-sm">
                      {venue.approvalStatus} · {venue.visibilityStatus}
                    </p>
                    {venue.rejectionReason ? (
                      <p className="mt-3 rounded-md bg-[#fff5f0] p-3 text-sm text-[#8a3b1f]">
                        Rejection reason: {venue.rejectionReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3">
                    <form action={approveVenueAction}>
                      <input name="venueId" type="hidden" value={venue.id} />
                      <button className="w-full rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" type="submit">
                        Approve
                      </button>
                    </form>

                    <form action={rejectVenueAction} className="grid gap-2">
                      <input name="venueId" type="hidden" value={venue.id} />
                      <textarea
                        className="min-h-20 rounded-md border border-[#d9d2c1] px-3 py-2 text-sm"
                        name="rejectionReason"
                        placeholder="Rejection reason"
                        required
                        maxLength={500}
                      />
                      <button className="rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" type="submit">
                        Reject
                      </button>
                    </form>

                    <form action={visibilityAction}>
                      <input name="venueId" type="hidden" value={venue.id} />
                      <button className="w-full rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" type="submit">
                        Set {nextVisibility}
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
