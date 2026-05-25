import { ConfigStatus } from "@prisma/client";
import Link from "next/link";

import {
  createSkillLevelAction,
  updateSkillLevelAction,
  updateSkillLevelStatusAction,
} from "@/features/config/config-actions";
import { listSkillLevels } from "@/features/config/config-service";
import { configMessage, requireAdminPage } from "../config-page-utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LevelsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LevelsPage({ searchParams }: LevelsPageProps) {
  await requireAdminPage();
  const [sports, message] = await Promise.all([listSkillLevels(), configMessage(searchParams)]);
  const activeSports = sports.filter((sport) => sport.status === ConfigStatus.ACTIVE);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <Header />
        
        {message ? <div className={`rounded-md border p-4 text-sm ${message.includes("Không thể") || message.includes("Vui lòng") ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/50 bg-primary/10 text-primary"}`}>{message}</div> : null}

        <form action={createSkillLevelAction} className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[1fr_1fr_120px_auto]">
          <div className="grid gap-2">
            <Label>Môn thể thao</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="sportId" required>
              {activeSports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Trình độ mới</Label>
            <Input name="name" required maxLength={60} placeholder="Nhập tên trình độ..." />
          </div>
          <div className="grid gap-2">
            <Label>Thứ tự</Label>
            <Input name="order" type="number" min={1} max={100} required defaultValue={1} />
          </div>
          <Button className="self-end" type="submit">
            Thêm mới
          </Button>
        </form>

        <div className="grid gap-6">
          {sports.map((sport) => (
            <Card key={sport.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-muted/20 py-4">
                <CardTitle className="text-xl text-primary">{sport.name}</CardTitle>
                <Badge variant={sport.status === "ACTIVE" ? "default" : "secondary"}>
                  {sport.status === "ACTIVE" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[15%]">Thứ tự</TableHead>
                        <TableHead className="w-[40%]">Tên trình độ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sport.skillLevels.map((level) => {
                        const nextStatus = level.status === ConfigStatus.ACTIVE ? ConfigStatus.INACTIVE : ConfigStatus.ACTIVE;

                        return (
                          <TableRow key={level.id}>
                            <TableCell colSpan={2} className="p-2">
                              <form action={updateSkillLevelAction} className="flex gap-2">
                                <input name="skillLevelId" type="hidden" value={level.id} />
                                <Input
                                  aria-label={`Thứ tự ${level.name}`}
                                  name="order"
                                  type="number"
                                  min={1}
                                  max={100}
                                  defaultValue={level.order}
                                  required
                                  className="h-8 w-20"
                                />
                                <Input
                                  aria-label={`Tên ${level.name}`}
                                  name="name"
                                  defaultValue={level.name}
                                  required
                                  maxLength={60}
                                  className="h-8 flex-1"
                                />
                                <Button size="sm" variant="outline" type="submit">
                                  Lưu
                                </Button>
                              </form>
                            </TableCell>
                            <TableCell>
                              <Badge variant={level.status === "ACTIVE" ? "default" : "secondary"}>
                                {level.status === "ACTIVE" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <form action={updateSkillLevelStatusAction}>
                                <input name="skillLevelId" type="hidden" value={level.id} />
                                <input name="status" type="hidden" value={nextStatus} />
                                <Button size="sm" variant="secondary" type="submit">
                                  Đổi thành {nextStatus === "ACTIVE" ? "HOẠT ĐỘNG" : "NGỪNG H.ĐỘNG"}
                                </Button>
                              </form>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {sport.skillLevels.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            Chưa có mức trình độ nào.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Trình độ kỹ năng</h1>
        <p className="mt-2 text-muted-foreground">Cấu hình các mức trình độ theo từng môn thể thao.</p>
      </div>
      <div className="flex gap-2">
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/config">
          ← Quay lại Cấu hình
        </Link>
      </div>
    </div>
  );
}
