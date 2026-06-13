import { BookingStatus, UserRole } from "@prisma/client";

type StatusHistoryEntry = {
  id: string;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  actorRole: UserRole;
  reason: string | null;
  createdAt: Date;
};

const statusText: Record<BookingStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Bị từ chối",
  CANCELED_BY_PLAYER: "Người chơi hủy",
  CANCELED_BY_OWNER: "Chủ sân hủy",
  COMPLETED: "Hoàn thành",
};

const actorText: Record<UserRole, string> = {
  PLAYER: "Người chơi",
  VENUE_OWNER: "Chủ sân",
  ADMIN: "Quản trị viên",
};

function formatMoment(value: Date) {
  return value.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingStatusTimeline({ history }: { history: StatusHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có lịch sử thay đổi.</p>;
  }

  return (
    <ol className="grid gap-4">
      {history.map((entry) => (
        <li key={entry.id} className="flex gap-3">
          <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {entry.fromStatus ? `${statusText[entry.fromStatus]} → ${statusText[entry.toStatus]}` : `Tạo yêu cầu (${statusText[entry.toStatus]})`}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMoment(entry.createdAt)} · bởi {actorText[entry.actorRole]}
            </p>
            {entry.reason ? <p className="mt-1 text-sm text-muted-foreground">Lý do: {entry.reason}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
