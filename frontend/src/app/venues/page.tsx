import Link from "next/link";

import { listAreas, listSports } from "@/features/config/config-service";
import { listPublicVenues } from "@/features/venues/venue-service";

type VenuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = await searchParams;
  const filters = {
    q: firstValue(params.q)?.trim() || undefined,
    sportId: firstValue(params.sportId) || undefined,
    areaId: firstValue(params.areaId) || undefined,
  };
  const [venues, sports, areas] = await Promise.all([listPublicVenues(filters), listSports(), listAreas()]);

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-semibold">Venue discovery</h1>
          <p className="mt-3 text-[#5f6b63]">Find approved and active venues in Hanoi.</p>
        </div>

        <form className="grid gap-3 rounded-lg border border-[#d9d2c1] bg-white p-5 md:grid-cols-[1fr_220px_260px_auto]">
          <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="q" defaultValue={filters.q ?? ""} placeholder="Search name or address" />
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">All sports</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="areaId" defaultValue={filters.areaId ?? ""}>
            <option value="">All areas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
            Search
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {venues.map((venue) => (
            <Link key={venue.id} className="rounded-lg border border-[#d9d2c1] bg-white p-5 hover:bg-[#fbfaf7]" href={`/venues/${venue.id}`}>
              <h2 className="text-xl font-semibold">{venue.name}</h2>
              <p className="mt-2 text-sm text-[#5f6b63]">{venue.address}</p>
              <p className="mt-2 text-sm text-[#5f6b63]">
                {venue.area.name} · {venue.sports.map((item) => item.sport.name).join(", ")}
              </p>
              {venue.availabilityNote ? (
                <p className="mt-3 rounded-md bg-[#eef7f1] p-3 text-sm text-[#26563b]">
                  Availability: {venue.availabilityNote}
                </p>
              ) : null}
              <p className="mt-3 text-sm font-medium text-[#0f6b4f]">{venue.referencePrice ?? "Contact for price"}</p>
            </Link>
          ))}

          {venues.length === 0 ? (
            <div className="rounded-lg border border-[#d9d2c1] bg-white p-5 text-sm text-[#5f6b63]">
              No approved active venues match the filters.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
