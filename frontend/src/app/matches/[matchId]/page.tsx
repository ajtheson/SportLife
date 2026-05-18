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
import { getMatchDetail } from "@/features/matches/match-service";

type MatchDetailPageProps = {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.status === "requested") return "Join request sent.";
  if (params.status === "approved") return "Join request approved.";
  if (params.status === "rejected") return "Join request rejected.";
  if (params.status === "closed") return "Match closed.";
  if (params.status === "canceled") return "Match canceled.";
  if (params.error === "self_join") return "You cannot request to join your own match.";
  if (params.error === "match_not_open") return "This match is not open for new requests.";
  if (params.error === "duplicate_join_request") return "You already requested to join this match.";
  if (params.error === "match_cannot_close_yet") return "You can close a match only when it is full or after match time.";
  if (params.error === "match_cannot_cancel_after_start") return "You can cancel a match only before match time.";
  if (params.error) return "The request could not be completed.";

  return null;
}

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
  const remaining = Math.max(match.requiredPlayers - approvedRequests.length, 0);
  const canRequest = isPlayer && !isOwner && match.status === MatchStatus.OPEN && !viewerRequest;
  const expectedLevels =
    match.expectedLevels.length > 0
      ? match.expectedLevels.map((item) => item.skillLevel.name).join(", ")
      : "Any level";

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link className="w-fit rounded-md border border-[#d9d2c1] bg-white px-3 py-2 text-sm font-medium" href="/matches">
          Back to matches
        </Link>

        {message ? <div className="rounded-md border border-[#d9d2c1] bg-white p-4 text-sm">{message}</div> : null}

        <article className="rounded-lg border border-[#d9d2c1] bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">{match.sport.name} match</h1>
              <p className="mt-3 text-[#5f6b63]">{match.area.name}</p>
              {match.detailedAddress ? <p className="mt-2 text-sm text-[#5f6b63]">{match.detailedAddress}</p> : null}
              <p className="mt-2 text-sm text-[#5f6b63]">{match.time.toLocaleString()}</p>
            </div>
            <div className="rounded-md bg-[#eef1ec] px-3 py-2 text-sm font-semibold">{match.status}</div>
          </div>

          <div className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <h2 className="font-semibold">Owner</h2>
              <p className="mt-2">{match.owner.playerProfile?.displayName ?? match.owner.email}</p>
            </div>
            <div>
              <h2 className="font-semibold">Needed</h2>
              <p className="mt-2">{remaining} more player{remaining === 1 ? "" : "s"}</p>
            </div>
            <div>
              <h2 className="font-semibold">Expected level</h2>
              <p className="mt-2">{expectedLevels}</p>
            </div>
          </div>

          {match.description ? <p className="mt-6 leading-7 text-[#445049]">{match.description}</p> : null}

          {isOwner && (match.status === MatchStatus.OPEN || match.status === MatchStatus.FULL) ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <form action={closeMatchAction}>
                <input name="matchId" type="hidden" value={match.id} />
                <button className="rounded-md bg-[#1d2520] px-3 py-2 text-sm font-medium text-white" type="submit">
                  Close match
                </button>
              </form>
              <form action={cancelMatchAction}>
                <input name="matchId" type="hidden" value={match.id} />
                <button className="rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" type="submit">
                  Cancel match
                </button>
              </form>
            </div>
          ) : null}
        </article>

        {viewerRequest ? (
          <div className="rounded-lg border border-[#d9d2c1] bg-white p-5 text-sm">
            Your request status: <span className="font-semibold">{viewerRequest.status}</span>
          </div>
        ) : null}

        {canRequest ? (
          <form action={requestJoinMatchAction} className="grid gap-3 rounded-lg border border-[#d9d2c1] bg-white p-5">
            <input name="matchId" type="hidden" value={match.id} />
            <label className="grid gap-2 text-sm font-medium">
              Message
              <textarea className="min-h-24 rounded-md border border-[#d9d2c1] px-3 py-2" name="message" maxLength={500} />
            </label>
            <button className="rounded-md bg-[#0f6b4f] px-4 py-2 font-medium text-white" type="submit">
              Request to join
            </button>
          </form>
        ) : null}

        {isOwner ? (
          <section className="rounded-lg border border-[#d9d2c1] bg-white p-5">
            <h2 className="text-xl font-semibold">Join requests</h2>
            <div className="mt-4 grid gap-3">
              {match.joinRequests.map((request) => (
                <div key={request.id} className="grid gap-3 rounded-md border border-[#ece5d8] p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <p className="font-medium">
                      {request.requester.playerProfile?.displayName ?? request.requester.email}
                    </p>
                    <p className="mt-1 text-sm text-[#5f6b63]">{request.status}</p>
                    {request.message ? <p className="mt-2 text-sm text-[#445049]">{request.message}</p> : null}
                  </div>

                  {request.status === JoinRequestStatus.PENDING ? (
                    <div className="flex gap-2">
                      <form action={approveJoinRequestAction}>
                        <input name="matchId" type="hidden" value={match.id} />
                        <input name="joinRequestId" type="hidden" value={request.id} />
                        <button className="rounded-md bg-[#0f6b4f] px-3 py-2 text-sm font-medium text-white" type="submit">
                          Approve
                        </button>
                      </form>
                      <form action={rejectJoinRequestAction}>
                        <input name="matchId" type="hidden" value={match.id} />
                        <input name="joinRequestId" type="hidden" value={request.id} />
                        <button className="rounded-md border border-[#d9d2c1] px-3 py-2 text-sm font-medium" type="submit">
                          Reject
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ))}

              {match.joinRequests.length === 0 ? (
                <p className="text-sm text-[#5f6b63]">No join requests yet.</p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
