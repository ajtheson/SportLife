import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getOwnerDashboardData } from "@/features/bookings/booking-service";
import { OwnerOperationsDashboard } from "@/features/bookings/owner-operations-dashboard";
import { listOwnerVenues } from "@/features/venues/venue-service";
import { userHasVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";
import { AutoRefresh } from "@/components/auto-refresh";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Card/CardContent used in venue list below

type VenueOwnerPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function todayInHanoi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  return params.status === "submitted" ? "Sân đã được gửi lên để chờ admin duyệt." : null;
}

const approvalStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PENDING_APPROVAL: { label: "CHỜ DUYỆT", variant: "default" },
  APPROVED: { label: "ĐÃ DUYỆT", variant: "secondary" },
  REJECTED: { label: "TỪ CHỐI", variant: "destructive" },
};

const visibilityStatusMap: Record<string, { label: string; variant: "default" | "outline" }> = {
  ACTIVE: { label: "HOẠT ĐỘNG", variant: "default" },
  HIDDEN: { label: "BỊ ẨN", variant: "outline" },
};

export default async function VenueOwnerPage({ searchParams }: VenueOwnerPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.VENUE_OWNER) {
    redirect("/");
  }

  if (!(await userHasVenueOwnerProfile(session.user.id))) {
    redirect("/venue-owner/profile");
  }

  const today = todayInHanoi();
  const [venues, message, dashboard] = await Promise.all([
    listOwnerVenues(session.user.id),
    pageMessage(searchParams),
    getOwnerDashboardData(session.user.id, today),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <AutoRefresh />
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Sân của tôi</h1>
            <p className="mt-3 text-muted-foreground">Đăng ký sân và theo dõi trạng thái kiểm duyệt.</p>
          </div>
          <div className="flex gap-2">
            <Link className={buttonVariants({ variant: "outline" })} href="/venue-owner/bookings">
              Quản lý đặt sân
            </Link>
            <Link className={buttonVariants()} href="/venue-owner/venues/new">
              Thêm sân mới
            </Link>
          </div>
        </div>

        {message ? <div className="rounded-md border border-primary/50 bg-primary/10 p-4 text-sm text-primary">{message}</div> : null}

        <OwnerOperationsDashboard dashboard={dashboard} />
        <div className="grid gap-4">
          {venues.map((venue) => {
            const appStatus = approvalStatusMap[venue.approvalStatus];
            const visStatus = visibilityStatusMap[venue.visibilityStatus];

            return (
              <Card key={venue.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-primary">{venue.name}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{venue.address}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">{venue.area.name}</Badge>
                        {venue.sports.map((item) => (
                          <Badge key={item.sport.id} variant="outline">
                            {item.sport.name}
                          </Badge>
                        ))}
                      </div>
                      {venue.availabilityNote ? (
                        <p className="mt-4 rounded-md bg-muted/50 p-3 text-sm text-foreground">
                          <span className="font-semibold">Trạng thái phục vụ:</span> {venue.availabilityNote}
                        </p>
                      ) : null}
                      {venue.rejectionReason ? (
                        <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                          <span className="font-semibold">Lý do từ chối:</span> {venue.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid gap-3 text-sm">
                      <Badge variant={appStatus?.variant ?? "default"} className="justify-center">
                        {appStatus?.label ?? venue.approvalStatus}
                      </Badge>
                      <Badge variant={visStatus?.variant ?? "default"} className="justify-center">
                        {visStatus?.label ?? venue.visibilityStatus}
                      </Badge>
                      <Link className={buttonVariants({ variant: "outline", className: "w-full mt-2" })} href={`/venue-owner/venues/${venue.id}/edit`}>
                        Sửa thông tin
                      </Link>
                      <Link className={buttonVariants({ variant: "outline", className: "w-full" })} href={`/venue-owner/venues/${venue.id}/schedule`}>
                        Lịch sân
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {venues.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Bạn chưa đăng sân nào.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
