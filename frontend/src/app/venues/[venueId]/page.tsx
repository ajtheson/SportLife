import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicVenue } from "@/features/venues/venue-service";

type VenueDetailPageProps = {
  params: Promise<{ venueId: string }>;
};

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { venueId } = await params;
  const venue = await getPublicVenue(venueId);

  if (!venue) {
    notFound();
  }

  const openingHours =
    venue.openingHours && typeof venue.openingHours === "object" && "text" in venue.openingHours
      ? String(venue.openingHours.text)
      : null;

  return (
    <main className="min-h-screen bg-[#f7f4ed] px-6 py-10 text-[#1d2520]">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className="w-fit rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/venues">
          Back to venues
        </Link>

        <article className="rounded-lg border border-[#d9d2c1] bg-white p-6">
          <h1 className="text-3xl font-semibold">{venue.name}</h1>
          <p className="mt-3 text-[#5f6b63]">{venue.address}</p>
          <p className="mt-2 text-sm text-[#5f6b63]">
            {venue.area.name} · {venue.sports.map((item) => item.sport.name).join(", ")}
          </p>

          {venue.images.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {venue.images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={image.id} alt={image.altText ?? venue.name} className="aspect-video w-full rounded-md object-cover" src={image.url} />
              ))}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <h2 className="font-semibold">Availability</h2>
              <p className="mt-2">{venue.availabilityNote ?? "Contact venue owner for current availability"}</p>
            </div>
            <div>
              <h2 className="font-semibold">Contact</h2>
              <p className="mt-2">{venue.phone}</p>
            </div>
            <div>
              <h2 className="font-semibold">Reference price</h2>
              <p className="mt-2">{venue.referencePrice ?? "Contact for price"}</p>
            </div>
            <div>
              <h2 className="font-semibold">Opening hours</h2>
              <p className="mt-2">{openingHours ?? "Contact for opening hours"}</p>
            </div>
          </div>

          {venue.description ? <p className="mt-6 leading-7 text-[#445049]">{venue.description}</p> : null}
        </article>
      </div>
    </main>
  );
}
