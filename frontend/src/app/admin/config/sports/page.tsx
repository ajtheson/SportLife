import { ConfigStatus } from "@prisma/client";
import Link from "next/link";

import { createSportAction, updateSportAction, updateSportStatusAction } from "@/features/config/config-actions";
import { listSports } from "@/features/config/config-service";
import { configMessage, requireAdminPage } from "../config-page-utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type SportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SportsPage({ searchParams }: SportsPageProps) {
  await requireAdminPage();
  const [sports, message] = await Promise.all([listSports(), configMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <Header title="Môn thể thao" />
        
        {message ? <div className={`rounded-md border p-4 text-sm ${message.includes("Không thể") || message.includes("Vui lòng") ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/50 bg-primary/10 text-primary"}`}>{message}</div> : null}

        <form action={createSportAction} className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-[1fr_auto]">
          <div className="grid gap-2">
            <Label>Môn thể thao mới</Label>
            <Input name="name" required maxLength={60} placeholder="Nhập tên môn..." />
          </div>
          <Button className="self-end" type="submit">
            Thêm mới
          </Button>
        </form>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40%]">Tên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sports.map((sport) => {
                const nextStatus = sport.status === ConfigStatus.ACTIVE ? ConfigStatus.INACTIVE : ConfigStatus.ACTIVE;
                const usage = sport._count.playerSportLevels + sport._count.venueSports + sport._count.matches;

                return (
                  <TableRow key={sport.id}>
                    <TableCell>
                      <form action={updateSportAction} className="flex gap-2">
                        <input name="sportId" type="hidden" value={sport.id} />
                        <Input
                          name="name"
                          defaultValue={sport.name}
                          required
                          maxLength={60}
                          className="h-8 min-w-0"
                        />
                        <Button size="sm" variant="outline" type="submit">
                          Lưu
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sport.status === "ACTIVE" ? "default" : "secondary"}>
                        {sport.status === "ACTIVE" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{usage} bản ghi liên kết</TableCell>
                    <TableCell className="text-right">
                      <form action={updateSportStatusAction}>
                        <input name="sportId" type="hidden" value={sport.id} />
                        <input name="status" type="hidden" value={nextStatus} />
                        <Button size="sm" variant="secondary" type="submit">
                          Đổi thành {nextStatus === "ACTIVE" ? "HOẠT ĐỘNG" : "NGỪNG H.ĐỘNG"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Chưa có môn thể thao nào.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}

function Header({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">{title}</h1>
        <p className="mt-2 text-muted-foreground">Các môn thể thao đang hoạt động sẽ được hiển thị cho người chơi.</p>
      </div>
      <div className="flex gap-2">
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/config">
          ← Quay lại Cấu hình
        </Link>
      </div>
    </div>
  );
}
