import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { saveVenueOwnerProfileAction } from "@/features/venue-owner-profile/venue-owner-profile-actions";
import { getVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";

type VenueOwnerProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function profileMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.status === "saved") {
    return "Profile saved.";
  }

  if (searchParams.error === "phone_exists") {
    return "Phone number is already used by another venue owner.";
  }

  if (searchParams.error === "invalid_input") {
    return "Please check your profile information and try again.";
  }

  return null;
}

export default async function VenueOwnerProfilePage({ searchParams }: VenueOwnerProfilePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  const [profile, message] = await Promise.all([getVenueOwnerProfile(session.user.id), searchParams.then(profileMessage)]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 grid gap-4">
          <h1 className="text-3xl font-semibold">Venue owner profile</h1>
          <p className="text-[#5f6b63]">Complete this profile before managing venues.</p>
        </div>

        {message ? (
          <div className="mb-6 rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div>
        ) : null}

        <form action={saveVenueOwnerProfileAction} className="grid gap-4 rounded-lg border border-[#d9d2c1] bg-white p-6">
          <label className="grid gap-2 text-sm font-medium">
            Business name
            <input
              className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
              name="businessName"
              defaultValue={profile?.businessName ?? ""}
              required
              maxLength={120}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Phone number
            <input
              className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
              name="phone"
              defaultValue={profile?.phone ?? ""}
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              placeholder="0912345678"
              required
            />
          </label>
          <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white hover:bg-[#0b573f]" type="submit">
            Save profile
          </button>
        </form>
      </div>
    </main>
  );
}
