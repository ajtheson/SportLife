import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { saveVenueOwnerProfileAction } from "@/features/venue-owner-profile/venue-owner-profile-actions";
import { getVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type VenueOwnerProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function profileMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.status === "saved") {
    return "Đã lưu hồ sơ thành công.";
  }

  if (searchParams.status === "phone_verified") {
    return "Xác thực số điện thoại thành công.";
  }

  if (searchParams.error === "phone_exists") {
    return "Số điện thoại này đã được đăng ký bởi một chủ sân khác.";
  }

  if (searchParams.error === "invalid_input") {
    return "Vui lòng kiểm tra lại thông tin hồ sơ và thử lại.";
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

  const [profile, message, userRecord] = await Promise.all([
    getVenueOwnerProfile(session.user.id),
    searchParams.then(profileMessage),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phoneVerifiedAt: true },
    }),
  ]);
  const isPhoneVerified = !!userRecord?.phoneVerifiedAt;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 grid gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Hồ sơ chủ sân</h1>
          <p className="text-muted-foreground">Hoàn thiện hồ sơ để có thể đăng tải và quản lý thông tin sân.</p>
        </div>

        {message ? (
          <div className={`mb-6 rounded-md border p-4 text-sm ${message.includes("thành công") ? "border-primary/50 bg-primary/10 text-primary" : "border-destructive/50 bg-destructive/10 text-destructive"}`}>
            {message}
          </div>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <form action={saveVenueOwnerProfileAction} className="grid gap-6">
              <div className="grid gap-2">
                <Label>Tên cơ sở kinh doanh</Label>
                <Input
                  name="businessName"
                  defaultValue={profile?.businessName ?? ""}
                  required
                  maxLength={120}
                />
              </div>
              
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="phone">Số điện thoại liên hệ</Label>
                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                      <svg className="size-3 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Đã xác minh
                    </span>
                  ) : profile?.phone ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Chưa xác minh
                    </span>
                  ) : null}
                </div>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={profile?.phone ?? ""}
                  inputMode="numeric"
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="0912345678"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full sm:w-fit">
                Lưu hồ sơ
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
