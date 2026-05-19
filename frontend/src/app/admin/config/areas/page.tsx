import { ConfigStatus } from "@prisma/client";
import Link from "next/link";

import { createAreaAction, updateAreaAction, updateAreaStatusAction } from "@/features/config/config-actions";
import { listAreas } from "@/features/config/config-service";
import { configMessage, requireAdminPage } from "../config-page-utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type AreasPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AreasPage({ searchParams }: AreasPageProps) {
  await requireAdminPage();
  const [areas, message] = await Promise.all([listAreas(), configMessage(searchParams)]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <Header />
        
        {message ? <div className={`rounded-md border p-4 text-sm ${message.includes("Không thể") || message.includes("Vui lòng") ? "border-destructive/50 bg-destructive/10 text-destructive" : "border-primary/50 bg-primary/10 text-primary"}`}>{message}</div> : null}

        <form action={createAreaAction} className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[1fr_180px_auto]">
          <div className="grid gap-2">
            <Label>Tên khu vực mới</Label>
            <Input name="name" required maxLength={100} placeholder="Nhập tên khu vực..." />
          </div>
          <div className="grid gap-2">
            <Label>Phân loại</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" name="type" required>
              <option value="ward">Phường/Xã</option>
              <option value="commune">Quận/Huyện</option>
            </select>
          </div>
          <Button className="self-end" type="submit">
            Thêm mới
          </Button>
        </form>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40%]">Tên khu vực</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => {
                const nextStatus = area.status === ConfigStatus.ACTIVE ? ConfigStatus.INACTIVE : ConfigStatus.ACTIVE;
                const usage = area._count.playerProfiles + area._count.venues + area._count.matches + area._count.communityPosts;

                return (
                  <TableRow key={area.id}>
                    <TableCell className="p-2">
                      <form action={updateAreaAction} className="flex gap-2">
                        <input name="areaId" type="hidden" value={area.id} />
                        <Input
                          aria-label={`Tên ${area.name}`}
                          name="name"
                          defaultValue={area.name}
                          required
                          maxLength={100}
                          className="h-8 flex-1"
                        />
                        <select
                          aria-label={`Loại ${area.name}`}
                          className="flex h-8 rounded-md border border-input bg-background px-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          name="type"
                          defaultValue={area.type}
                          required
                        >
                          <option value="ward">Phường/Xã</option>
                          <option value="commune">Quận/Huyện</option>
                        </select>
                        <Button size="sm" variant="outline" type="submit">
                          Lưu
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <Badge variant={area.status === "ACTIVE" ? "default" : "secondary"}>
                        {area.status === "ACTIVE" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{usage} bản ghi liên kết</TableCell>
                    <TableCell className="text-right">
                      <form action={updateAreaStatusAction}>
                        <input name="areaId" type="hidden" value={area.id} />
                        <input name="status" type="hidden" value={nextStatus} />
                        <Button size="sm" variant="secondary" type="submit">
                          Đổi thành {nextStatus === "ACTIVE" ? "HOẠT ĐỘNG" : "NGỪNG H.ĐỘNG"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
              {areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Chưa có khu vực nào.
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

function Header() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Khu vực Hà Nội</h1>
        <p className="mt-2 text-muted-foreground">Cấu hình danh sách Quận/Huyện, Phường/Xã cho người dùng SportLife.</p>
      </div>
      <div className="flex gap-2">
        <Link className={buttonVariants({ variant: "outline" })} href="/admin/config">
          ← Quay lại Cấu hình
        </Link>
      </div>
    </div>
  );
}
