import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { savePlayerProfileAction } from "@/features/player-profile/player-profile-actions";
import { getPlayerProfileFormData } from "@/features/player-profile/player-profile-service";

type PlayerProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function profileMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.status === "saved") {
    return "Profile saved.";
  }

  if (searchParams.error === "phone_exists") {
    return "Phone number is already used by another player.";
  }

  if (searchParams.error === "invalid_input") {
    return "Please check your profile information and try again.";
  }

  return null;
}

export default async function PlayerProfilePage({ searchParams }: PlayerProfilePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const [{ areas, sports, profile }, message] = await Promise.all([
    getPlayerProfileFormData(session.user.id),
    searchParams.then(profileMessage),
  ]);
  const selectedSportLevelBySport = new Map(profile?.sportLevels.map((item) => [item.sportId, item.skillLevelId]));

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 grid gap-4">
          <Link
            className="inline-flex w-fit rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium hover:bg-[#f7f4ed]"
            href="/"
          >
            Home
          </Link>
          <h1 className="text-3xl font-semibold">Player profile</h1>
          <p className="text-[#5f6b63]">Complete this profile before using player features in SportLife.</p>
        </div>

        {message ? (
          <div className="mb-6 rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div>
        ) : null}

        <form action={savePlayerProfileAction} className="grid gap-6 rounded-lg border border-[#d9d2c1] bg-white p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Display name
              <input
                className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
                name="displayName"
                defaultValue={profile?.displayName ?? ""}
                minLength={2}
                maxLength={80}
                required
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
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Hanoi ward/commune
            <select
              className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
              name="areaId"
              defaultValue={profile?.areaId ?? ""}
              required
            >
              <option value="" disabled>
                Select an area
              </option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="grid gap-4">
            <legend className="text-sm font-medium">Sports and skill levels</legend>
            <div className="grid gap-3">
              {sports.map((sport) => {
                const selectedLevelId = selectedSportLevelBySport.get(sport.id);

                return (
                  <div
                    key={sport.id}
                    className="grid gap-3 rounded-md border border-[#e6dfd0] p-4 md:grid-cols-[minmax(0,1fr)_220px]"
                  >
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        name="sportIds"
                        type="checkbox"
                        value={sport.id}
                        defaultChecked={Boolean(selectedLevelId)}
                      />
                      {sport.name}
                    </label>
                    <select
                      aria-label={`${sport.name} skill level`}
                      className="rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm"
                      name={`skillLevel_${sport.id}`}
                      defaultValue={selectedLevelId ?? ""}
                    >
                      <option value="">Select level</option>
                      {sport.skillLevels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <label className="grid gap-2 text-sm font-medium">
            Availability
            <textarea
              className="min-h-24 rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
              name="availability"
              defaultValue={profile?.availability ?? ""}
              maxLength={300}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Introduction
            <textarea
              className="min-h-28 rounded-md border border-[#d9d2c1] bg-white px-3 py-2"
              name="introduction"
              defaultValue={profile?.introduction ?? ""}
              maxLength={500}
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
