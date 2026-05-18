import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { getVenueFormData } from "@/features/venues/venue-service";

import { VenueForm } from "../../venue-form";

type EditVenuePageProps = {
  params: Promise<{ venueId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function formMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  return params.error === "invalid_input" ? "Please check venue information and try again." : null;
}

export default async function EditVenuePage({ params, searchParams }: EditVenuePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  const { venueId } = await params;
  const [{ areas, sports, venue, profile }, message] = await Promise.all([
    getVenueFormData(session.user.id, venueId),
    formMessage(searchParams),
  ]);

  if (!profile) {
    redirect("/venue-owner/profile");
  }

  if (!venue) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Edit venue</h1>
            <p className="mt-3 text-[#5f6b63]">Saved changes are sent back to Pending Approval.</p>
          </div>
          <Link className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/venue-owner">
            My venues
          </Link>
        </div>
        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}
        <VenueForm areas={areas} sports={sports} venue={venue} defaultPhone={profile.phone} />
      </div>
    </main>
  );
}
