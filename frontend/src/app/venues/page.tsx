import Link from "next/link";
import { listAreas, listSports } from "@/features/config/config-service";
import { listPublicVenues } from "@/features/venues/venue-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Khám phá sân bãi</h1>
          <p className="mt-3 text-muted-foreground">Tìm kiếm các sân tập chất lượng và đang hoạt động tại Hà Nội.</p>
        </div>

        <form className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[1fr_220px_260px_auto]">
          <Input name="q" defaultValue={filters.q ?? ""} placeholder="Nhập tên sân hoặc địa chỉ..." />
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="sportId" defaultValue={filters.sportId ?? ""}>
            <option value="">Tất cả các môn</option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="areaId" defaultValue={filters.areaId ?? ""}>
            <option value="">Tất cả khu vực</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
          <Button type="submit">Tìm kiếm</Button>
        </form>

        <div className="grid gap-6 md:grid-cols-2">
          {venues.map((venue) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50 hover:shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">{venue.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{venue.address}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{venue.area.name}</Badge>
                    {venue.sports.map((item) => (
                      <Badge key={item.sport.id} variant="outline">
                        {item.sport.name}
                      </Badge>
                    ))}
                  </div>
                  {venue.availabilityNote ? (
                    <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                      <span className="font-semibold">Lịch trống:</span> {venue.availabilityNote}
                    </div>
                  ) : null}
                  <p className="text-sm font-semibold text-primary">{venue.referencePrice ?? "Liên hệ để biết giá"}</p>
                </CardContent>
              </Card>
            </Link>
          ))}

          {venues.length === 0 ? (
            <div className="col-span-full rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Không tìm thấy sân nào phù hợp với bộ lọc.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
