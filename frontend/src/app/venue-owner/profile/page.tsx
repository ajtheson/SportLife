import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { saveVenueOwnerProfileAction } from "@/features/venue-owner-profile/venue-owner-profile-actions";
import { getVenueOwnerProfile } from "@/features/venue-owner-profile/venue-owner-profile-service";
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

  const [profile, message] = await Promise.all([getVenueOwnerProfile(session.user.id), searchParams.then(profileMessage)]);

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
                <Label>Số điện thoại liên hệ</Label>
                <Input
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
