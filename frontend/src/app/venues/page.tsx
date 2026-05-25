import { MapPin, Search, WalletCards } from "lucide-react";
import Link from "next/link";

import { listAreas, listSports } from "@/features/config/config-service";
import { listPublicVenues } from "@/features/venues/venue-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-5 shadow-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-3">
              Hà Nội
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Khám phá sân bãi</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Tìm sân đang hoạt động, xem khu vực, giá tham khảo và nhắn tin trực tiếp với chủ sân.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-64">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="text-2xl font-bold text-primary">{venues.length}</div>
              <div className="text-muted-foreground">Sân phù hợp</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <div className="text-2xl font-bold text-primary">{sports.length}</div>
              <div className="text-muted-foreground">Môn thể thao</div>
            </div>
          </div>
        </header>

        <form className="grid gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_260px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" name="q" defaultValue={filters.q ?? ""} placeholder="Nhập tên sân hoặc địa chỉ..." />
          </div>
          <select name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">Tất cả các môn</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select name="areaId" defaultValue={filters.areaId ?? ""}>
            <option value="">Tất cả khu vực</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <Button type="submit">Tìm kiếm</Button>
        </form>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => {
            const image = venue.images[0];

            return (
              <Link className="group block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" key={venue.id} href={`/venues/${venue.id}`}>
                <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-primary/25">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={image.altText ?? venue.name} className="aspect-[16/9] w-full object-cover" src={image.url} />
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary/15 via-accent to-secondary/70 text-sm font-semibold text-primary">
                      SportLife Venue
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{venue.area.name}</Badge>
                      {venue.sports.map((item) => (
                        <Badge key={item.sport.id} variant="outline">
                          {item.sport.name}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="line-clamp-2 text-xl text-foreground">{venue.name}</CardTitle>
                    <CardDescription className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span className="line-clamp-2">{venue.address}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {venue.availabilityNote ? (
                      <div className="rounded-lg border border-primary/15 bg-primary/10 p-3 text-sm leading-6 text-primary">
                        <span className="font-semibold">Còn trống:</span> {venue.availabilityNote}
                      </div>
                    ) : null}
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <WalletCards className="size-4 text-primary" aria-hidden="true" />
                      {venue.referencePrice ?? "Liên hệ để biết giá"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {venues.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Không tìm thấy sân nào phù hợp với bộ lọc.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
