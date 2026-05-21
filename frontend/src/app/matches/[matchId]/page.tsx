import { JoinRequestStatus, MatchStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import {
  approveJoinRequestAction,
  cancelMatchAction,
  closeMatchAction,
  rejectJoinRequestAction,
  requestJoinMatchAction,
} from "@/features/matches/match-actions";
import { startMatchChatAction } from "@/features/chat/chat-actions";
import { getMatchDetail } from "@/features/matches/match-service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type MatchDetailPageProps = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.status === "requested") return "Đã gửi yêu cầu tham gia.";
  if (params.status === "approved") return "Yêu cầu tham gia đã được duyệt.";
  if (params.status === "rejected") return "Yêu cầu tham gia đã bị từ chối.";
  if (params.status === "closed") return "Trận đấu đã đóng.";
  if (params.status === "canceled") return "Trận đấu đã hủy.";
  if (params.error === "self_join") return "Bạn không thể xin tham gia trận đấu của chính mình.";
  if (params.error === "match_not_open") return "Trận đấu này không còn mở để nhận thêm yêu cầu.";
  if (params.error === "duplicate_join_request") return "Bạn đã gửi yêu cầu tham gia trận đấu này rồi.";
  if (params.error === "match_cannot_close_yet") return "Bạn chỉ có thể đóng trận đấu khi đã đủ người hoặc sau thời gian diễn ra.";
  if (params.error === "match_cannot_cancel_after_start") return "Bạn chỉ có thể hủy trận đấu trước thời gian diễn ra.";
  if (params.error) return "Không thể thực hiện yêu cầu.";

  return null;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "Đang mở", variant: "default" },
  FULL: { label: "Đã đủ người", variant: "secondary" },
  CLOSED: { label: "Đã đóng", variant: "outline" },
  CANCELED: { label: "Đã hủy", variant: "destructive" },
};

const requestStatusMap: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  CANCELED: "Đã hủy",
};

export default async function MatchDetailPage({ params, searchParams }: MatchDetailPageProps) {
  const session = await auth();
  const { matchId } = await params;
  const [detail, message] = await Promise.all([getMatchDetail(matchId, session?.user?.id), pageMessage(searchParams)]);

  if (!detail) {
    notFound();
  }

  const { match, viewerRequest } = detail;
  const isPlayer = session?.user.role === UserRole.PLAYER;
  const isOwner = session?.user.id === match.ownerId;
  const approvedRequests = match.joinRequests.filter((request) => request.status === JoinRequestStatus.APPROVED);
  const approvedParticipantIds = new Set([match.ownerId, ...approvedRequests.map((request) => request.requesterId)]);
  const remaining = Math.max(match.requiredPlayers - approvedRequests.length, 0);
  const canRequest = isPlayer && !isOwner && match.status === MatchStatus.OPEN && !viewerRequest;
  const expectedLevels =
    match.expectedLevels.length > 0
      ? match.expectedLevels.map((item) => item.skillLevel.name).join(", ")
      : "Mọi trình độ";

  const statusInfo = statusMap[match.status] ?? { label: match.status, variant: "outline" };

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className={buttonVariants({ variant: "outline", className: "w-fit" })} href="/matches">
          ← Quay lại danh sách
        </Link>

        {message ? <div className="rounded-md border border-border bg-muted p-4 text-sm text-foreground">{message}</div> : null}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-primary">Trận {match.sport.name}</CardTitle>
                <CardDescription className="mt-2 text-base text-foreground">{match.area.name}</CardDescription>
                {match.detailedAddress ? <CardDescription>{match.detailedAddress}</CardDescription> : null}
                <CardDescription className="font-medium text-primary">
                  {match.time.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                </CardDescription>
              </div>
              <Badge variant={statusInfo.variant} className="w-fit text-sm">{statusInfo.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 rounded-xl border border-border bg-muted/30 p-6 text-sm sm:grid-cols-3">
              <div>
                <h2 className="font-semibold text-primary">Chủ trận</h2>
                <p className="mt-2 text-muted-foreground">{match.owner.playerProfile?.displayName ?? match.owner.email}</p>
              </div>
              <div>
                <h2 className="font-semibold text-primary">Cần tuyển</h2>
                <p className="mt-2 text-muted-foreground">{remaining} người</p>
              </div>
              <div>
                <h2 className="font-semibold text-primary">Trình độ mong muốn</h2>
                <p className="mt-2 text-muted-foreground">{expectedLevels}</p>
              </div>
            </div>

            {match.description ? <p className="mt-8 leading-7 text-muted-foreground">{match.description}</p> : null}

            {isOwner && (match.status === MatchStatus.OPEN || match.status === MatchStatus.FULL) ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/matches/${match.id}/edit`}
                  className={buttonVariants({ variant: "default" })}
                >
                  Sửa trận đấu
                </Link>
                <form action={closeMatchAction}>
                  <input name="matchId" type="hidden" value={match.id} />
                  <Button type="submit" variant="secondary">
                    Đóng trận
                  </Button>
                </form>
                <form action={cancelMatchAction}>
                  <input name="matchId" type="hidden" value={match.id} />
                  <Button type="submit" variant="destructive">
                    Hủy trận
                  </Button>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {viewerRequest ? (
          <div className="rounded-lg border border-border bg-card p-5 text-sm shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Trạng thái yêu cầu của bạn: <span className="font-semibold text-primary">{requestStatusMap[viewerRequest.status] ?? viewerRequest.status}</span>
              </div>
              {viewerRequest.status === JoinRequestStatus.APPROVED ? (
                <form action={startMatchChatAction}>
                  <input name="matchId" type="hidden" value={match.id} />
                  <input name="userId" type="hidden" value={match.ownerId} />
                  <Button type="submit" size="sm">
                    Nhắn tin với chủ trận
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        ) : null}

        {canRequest ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Đăng ký tham gia</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={requestJoinMatchAction} className="grid gap-4">
                <input name="matchId" type="hidden" value={match.id} />
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Lời nhắn (không bắt buộc)</label>
                  <Textarea name="message" maxLength={500} placeholder="Gửi lời nhắn cho chủ trận..." />
                </div>
                <Button type="submit" className="w-fit">
                  Gửi yêu cầu tham gia
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {isOwner ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Yêu cầu tham gia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {match.joinRequests.map((request) => (
                  <div key={request.id} className="grid gap-4 rounded-xl border border-border bg-muted/20 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div>
                      <p className="font-semibold text-foreground">
                        {request.requester.playerProfile?.displayName ?? request.requester.email}
                      </p>
                      <Badge variant="outline" className="mt-2">{requestStatusMap[request.status] ?? request.status}</Badge>
                      {request.message ? <p className="mt-3 text-sm text-muted-foreground">{request.message}</p> : null}
                    </div>

                    {request.status === JoinRequestStatus.PENDING ? (
                      <div className="flex items-start gap-2">
                        <form action={approveJoinRequestAction}>
                          <input name="matchId" type="hidden" value={match.id} />
                          <input name="joinRequestId" type="hidden" value={request.id} />
                          <Button type="submit">
                            Duyệt
                          </Button>
                        </form>
                        <form action={rejectJoinRequestAction}>
                          <input name="matchId" type="hidden" value={match.id} />
                          <input name="joinRequestId" type="hidden" value={request.id} />
                          <Button type="submit" variant="outline">
                            Từ chối
                          </Button>
                        </form>
                      </div>
                    ) : request.status === JoinRequestStatus.APPROVED && approvedParticipantIds.has(session?.user.id ?? "") ? (
                      <form action={startMatchChatAction}>
                        <input name="matchId" type="hidden" value={match.id} />
                        <input name="userId" type="hidden" value={request.requesterId} />
                        <Button type="submit" variant="outline">
                          Nhắn tin
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))}

                {match.joinRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có yêu cầu tham gia nào.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
