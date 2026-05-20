import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { savePlayerProfileAction } from "@/features/player-profile/player-profile-actions";
import { getPlayerProfileFormData } from "@/features/player-profile/player-profile-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type PlayerProfilePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function profileMessage(searchParams: Record<string, string | string[] | undefined>) {
  if (searchParams.status === "saved") {
    return "Đã lưu hồ sơ thành công.";
  }

  if (searchParams.error === "phone_exists") {
    return "Số điện thoại này đã được sử dụng bởi người chơi khác.";
  }

  if (searchParams.error === "invalid_input") {
    return "Vui lòng kiểm tra lại thông tin hồ sơ và thử lại.";
  }

  return null;
}

export default async function PlayerProfilePage({ searchParams }: PlayerProfilePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== UserRole.PLAYER) {
    redirect("/");
  }

  const [{ areas, sports, profile }, message] = await Promise.all([
    getPlayerProfileFormData(session.user.id),
    searchParams.then(profileMessage),
  ]);
  const selectedSportLevelBySport = new Map(profile?.sportLevels.map((item) => [item.sportId, item.skillLevelId]));

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 grid gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Hồ sơ người chơi</h1>
          <p className="text-muted-foreground">Hoàn thiện hồ sơ để trải nghiệm đầy đủ các tính năng của SportLife.</p>
        </div>

        {message ? (
          <div className={`mb-6 rounded-md border p-4 text-sm ${message.includes("thành công") ? "border-primary/50 bg-primary/10 text-primary" : "border-destructive/50 bg-destructive/10 text-destructive"}`}>
            {message}
          </div>
        ) : null}

        <Card>
          <CardContent className="pt-6">
            <form action={savePlayerProfileAction} className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tên hiển thị</Label>
                  <Input
                    name="displayName"
                    defaultValue={profile?.displayName ?? ""}
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Số điện thoại</Label>
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
              </div>

              <div className="grid gap-2">
                <Label>Quận/huyện/phường tại Hà Nội</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  name="areaId"
                  defaultValue={profile?.areaId ?? ""}
                  required
                >
                  <option value="" disabled>
                    Chọn khu vực
                  </option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset className="grid gap-4 rounded-xl border border-border p-4">
                <legend className="-ml-1 bg-card px-1 text-sm font-semibold">Môn thể thao & Trình độ</legend>
                <div className="grid gap-3">
                  {sports.map((sport) => {
                    const selectedLevelId = selectedSportLevelBySport.get(sport.id);

                    return (
                      <div
                        key={sport.id}
                        className="grid gap-3 rounded-md border border-input p-4 md:grid-cols-[minmax(0,1fr)_220px]"
                      >
                        <Label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                          <input
                            className="size-4 accent-primary"
                            name="sportIds"
                            type="checkbox"
                            value={sport.id}
                            defaultChecked={Boolean(selectedLevelId)}
                          />
                          {sport.name}
                        </Label>
                        <select
                          aria-label={`Trình độ ${sport.name}`}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          name={`skillLevel_${sport.id}`}
                          defaultValue={selectedLevelId ?? ""}
                        >
                          <option value="">Chọn trình độ</option>
                          {sport.skillLevels.map((level) => (
                            <option key={level.id} value={level.id}>
                              {level.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-2">
                <Label>Lịch rảnh</Label>
                <Textarea
                  className="min-h-24"
                  name="availability"
                  defaultValue={profile?.availability ?? ""}
                  maxLength={300}
                />
              </div>

              <div className="grid gap-2">
                <Label>Giới thiệu bản thân</Label>
                <Textarea
                  className="min-h-28"
                  name="introduction"
                  defaultValue={profile?.introduction ?? ""}
                  maxLength={500}
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
