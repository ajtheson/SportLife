import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicVenue } from "@/features/venues/venue-service";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className={buttonVariants({ variant: "outline", className: "w-fit" })} href="/venues">
          ← Quay lại danh sách
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">{venue.name}</CardTitle>
            <CardDescription className="text-base">{venue.address}</CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{venue.area.name}</Badge>
              {venue.sports.map((item) => (
                <Badge key={item.sport.id} variant="outline">
                  {item.sport.name}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {venue.images.length > 0 ? (
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                {venue.images.map((image) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={image.id} alt={image.altText ?? venue.name} className="aspect-video w-full rounded-xl object-cover shadow-sm" src={image.url} />
                ))}
              </div>
            ) : null}

            <div className="grid gap-6 rounded-xl border border-border bg-muted/30 p-6 sm:grid-cols-2">
              <div>
                <h2 className="font-semibold text-primary">Lịch trống</h2>
                <p className="mt-2 text-sm text-muted-foreground">{venue.availabilityNote ?? "Liên hệ chủ sân để biết lịch trống"}</p>
              </div>
              <div>
                <h2 className="font-semibold text-primary">Liên hệ</h2>
                <p className="mt-2 text-sm text-muted-foreground">{venue.phone}</p>
              </div>
              <div>
                <h2 className="font-semibold text-primary">Giá tham khảo</h2>
                <p className="mt-2 text-sm font-medium text-foreground">{venue.referencePrice ?? "Liên hệ để biết giá"}</p>
              </div>
              <div>
                <h2 className="font-semibold text-primary">Giờ mở cửa</h2>
                <p className="mt-2 text-sm text-muted-foreground">{openingHours ?? "Liên hệ để biết giờ mở cửa"}</p>
              </div>
            </div>

            {venue.description ? <p className="mt-8 leading-7 text-muted-foreground">{venue.description}</p> : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
