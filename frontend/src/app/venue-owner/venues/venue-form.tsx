import type { Area, Sport, Venue, VenueImage, VenueSport } from "@prisma/client";

import { saveVenueAction } from "@/features/venues/venue-actions";

type VenueWithRelations = (Venue & { sports: VenueSport[]; images: VenueImage[] }) | null;

type VenueFormProps = {
  areas: Area[];
  sports: Sport[];
  venue: VenueWithRelations;
  defaultPhone: string;
};

export function VenueForm({ areas, sports, venue, defaultPhone }: VenueFormProps) {
  const selectedSportId = venue?.sports[0]?.sportId ?? "";
  const imageUrls = venue?.images.map((image) => image.url).join("\n") ?? "";
  const openingHours =
    venue?.openingHours && typeof venue.openingHours === "object" && "text" in venue.openingHours
      ? String(venue.openingHours.text)
      : "";

  return (
    <form action={saveVenueAction} className="grid gap-5 rounded-lg border border-[#d9d2c1] bg-white p-6">
      {venue ? <input name="venueId" type="hidden" value={venue.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Venue name
          <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="name" defaultValue={venue?.name ?? ""} required maxLength={120} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Phone number
          <input
            className="rounded-md border border-[#d9d2c1] px-3 py-2"
            name="phone"
            defaultValue={venue?.phone ?? defaultPhone}
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            required
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Address
        <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="address" defaultValue={venue?.address ?? ""} required maxLength={240} />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Hanoi ward/commune
        <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="areaId" defaultValue={venue?.areaId ?? ""} required>
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

      <label className="grid gap-2 text-sm font-medium">
        Sport
        <select className="rounded-md border border-[#d9d2c1] px-3 py-2" name="sportId" defaultValue={selectedSportId} required>
          <option value="" disabled>
            Select a sport
          </option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          Opening hours
          <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="openingHours" defaultValue={openingHours} maxLength={300} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Reference price
          <input className="rounded-md border border-[#d9d2c1] px-3 py-2" name="referencePrice" defaultValue={venue?.referencePrice ?? ""} maxLength={120} />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Description
        <textarea className="min-h-28 rounded-md border border-[#d9d2c1] px-3 py-2" name="description" defaultValue={venue?.description ?? ""} maxLength={1000} />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Image URLs
        <textarea
          className="min-h-24 rounded-md border border-[#d9d2c1] px-3 py-2"
          name="imageUrls"
          defaultValue={imageUrls}
          placeholder="https://example.com/image.jpg"
        />
      </label>

      <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white hover:bg-[#0b573f]" type="submit">
        Submit for approval
      </button>
    </form>
  );
}
