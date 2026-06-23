"use client";

import { useTransition } from "react";
import { UserRole, UserStatus } from "@prisma/client";
import { Lock, Unlock, ShieldAlert, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toggleUserStatusAction } from "@/features/admin/admin-actions";

type UserData = {
  id: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  displayName: string | null;
};

const roleMap: Record<UserRole, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  PLAYER: { label: "Người chơi", variant: "default" },
  VENUE_OWNER: { label: "Chủ sân", variant: "secondary" },
  ADMIN: { label: "Quản trị viên", variant: "destructive" },
};

const statusMap: Record<UserStatus, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ACTIVE: { label: "Hoạt động", variant: "default" },
  LOCKED: { label: "Bị khóa", variant: "destructive" },
  DELETED: { label: "Đã xóa", variant: "secondary" },
};

export function UserTable({ users, currentUserId }: { users: UserData[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleToggleStatus(userId: string, currentStatus: UserStatus) {
    if (userId === currentUserId) {
      toast.error("Bạn không thể tự khóa tài khoản của mình.");
      return;
    }

    const isLocking = currentStatus === UserStatus.ACTIVE;
    const confirmMessage = isLocking 
      ? "Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập được nữa." 
      : "Bạn có chắc chắn muốn mở khóa tài khoản này?";

    if (!confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await toggleUserStatusAction(userId);
      if (result.success) {
        toast.success(isLocking ? "Đã khóa tài khoản thành công." : "Đã mở khóa tài khoản thành công.");
      } else {
        toast.error(result.error || "Đã xảy ra lỗi.");
      }
    });
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border border-dashed p-12 text-center text-muted-foreground">
        <AlertCircle className="mb-2 h-8 w-8" />
        <p>Không có người dùng nào phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tài khoản</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày đăng ký</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{user.displayName || "Chưa cập nhật"}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={roleMap[user.role].variant}>{roleMap[user.role].label}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusMap[user.status].variant}>{statusMap[user.status].label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm" suppressHydrationWarning>
                {user.createdAt.toLocaleDateString("vi-VN", {
                  dateStyle: "short",
                })}
              </TableCell>
              <TableCell className="text-right">
                {user.id !== currentUserId && user.role !== UserRole.ADMIN ? (
                  <Button
                    variant={user.status === UserStatus.ACTIVE ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    disabled={isPending || user.status === UserStatus.DELETED}
                    title={user.status === UserStatus.ACTIVE ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                  >
                    {user.status === UserStatus.ACTIVE ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" /> Khóa
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" /> Mở khóa
                      </>
                    )}
                  </Button>
                ) : (
                  user.id === currentUserId && (
                    <span className="text-xs text-muted-foreground italic flex items-center justify-end gap-1">
                      <ShieldAlert className="h-3 w-3" /> Bạn
                    </span>
                  )
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
