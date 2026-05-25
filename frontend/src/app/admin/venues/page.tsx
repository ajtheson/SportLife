import { VisibilityStatus } from "@prisma/client";

import {
  approveVenueAction,
  hideVenueAction,
  rejectVenueAction,
  showVenueAction,
} from "@/features/venues/venue-actions";
import { listAdminVenues } from "@/features/venues/venue-service";

import { configMessage, requireAdminPage } from "../config/config-page-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type AdminVenuesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const approvalStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING_APPROVAL: { label: "CHỜ DUYỆT", variant: "default" },
  APPROVED: { label: "ĐÃ DUYỆT", variant: "secondary" },
  REJECTED: { label: "TỪ CHỐI", variant: "destructive" },
};

const visibilityStatusMap: Record<string, { label: string; variant: "default" | "outline" }> = {
  ACTIVE: { label: "HOẠT ĐỘNG", variant: "default" },
  HIDDEN: { label: "BỊ ẨN", variant: "outline" },
};

export default async function AdminVenuesPage({ searchParams }: AdminVenuesPageProps) {
  await requireAdminPage();
  const [venues, message] = await Promise.all([listAdminVenues(), configMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Kiểm duyệt sân</h1>
          <p className="mt-3 text-muted-foreground">Duyệt, từ chối, ẩn hoặc khôi phục danh sách sân tập.</p>
        </div>

        {message ? <div className={`rounded-md border p-4 text-sm ${message.includes("Không thể") || message.includes("Vui lòng") ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/50 bg-primary/10 text-primary"}`}>{message}</div> : null}

        <div className="grid gap-4">
          {venues.map((venue) => {
            const visibilityAction = venue.visibilityStatus === VisibilityStatus.ACTIVE ? hideVenueAction : showVenueAction;
            const nextVisibility = venue.visibilityStatus === VisibilityStatus.ACTIVE ? "Ẩn sân" : "Hiện sân";
            const appStatus = approvalStatusMap[venue.approvalStatus];
            const visStatus = visibilityStatusMap[venue.visibilityStatus];

            return (
              <Card key={venue.id}>
                <CardContent className="p-6">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div>
                      <h2 className="text-xl font-bold text-primary">{venue.name}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{venue.address}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{venue.area.name}</Badge>
                        {venue.sports.map((item) => <Badge key={item.sport.id} variant="outline">{item.sport.name}</Badge>)}
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">
                        Chủ sân: <span className="font-semibold text-foreground">{venue.owner.venueOwnerProfile?.businessName ?? venue.owner.email}</span>
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant={appStatus?.variant ?? "default"}>{appStatus?.label ?? venue.approvalStatus}</Badge>
                        <Badge variant={visStatus?.variant ?? "default"}>{visStatus?.label ?? venue.visibilityStatus}</Badge>
                      </div>
                      {venue.rejectionReason ? (
                        <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                          <span className="font-semibold">Lý do từ chối:</span> {venue.rejectionReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-3 content-start">
                      {venue.approvalStatus === "PENDING_APPROVAL" || venue.approvalStatus === "REJECTED" ? (
                        <form action={approveVenueAction}>
                          <input name="venueId" type="hidden" value={venue.id} />
                          <Button className="w-full" type="submit">
                            Duyệt sân
                          </Button>
                        </form>
                      ) : null}

                      {venue.approvalStatus === "PENDING_APPROVAL" || venue.approvalStatus === "APPROVED" ? (
                        <form action={rejectVenueAction} className="grid gap-2">
                          <input name="venueId" type="hidden" value={venue.id} />
                          <Textarea
                            className="min-h-20"
                            name="rejectionReason"
                            placeholder="Nhập lý do từ chối"
                            required
                            maxLength={500}
                          />
                          <Button variant="destructive" className="w-full" type="submit">
                            Từ chối
                          </Button>
                        </form>
                      ) : null}

                      <form action={visibilityAction}>
                        <input name="venueId" type="hidden" value={venue.id} />
                        <Button variant="outline" className="w-full" type="submit">
                          {nextVisibility}
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {venues.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Không có sân nào.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
