import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { sendChatMessageAction } from "@/features/chat/chat-actions";
import { chatParticipantName, getConversationDetail } from "@/features/chat/chat-service";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ChatDetailPageProps = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function pageMessage(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;

  if (params.error === "message_invalid") return "Tin nhắn phải có nội dung và tối đa 1000 ký tự.";
  if (params.error) return "Không thể gửi tin nhắn.";

  return null;
}

export default async function ChatDetailPage({ params, searchParams }: ChatDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { conversationId } = await params;
  let conversation: Awaited<ReturnType<typeof getConversationDetail>>;
  const message = await pageMessage(searchParams);

  try {
    conversation = await getConversationDetail(session.user.id, conversationId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PLAYER_PROFILE_REQUIRED") {
        redirect("/player/profile");
      }

      if (error.message === "VENUE_OWNER_PROFILE_REQUIRED") {
        redirect("/venue-owner/profile");
      }

      if (error.message === "CHAT_NOT_ALLOWED") {
        redirect("/");
      }
    }

    throw error;
  }

  if (!conversation) {
    notFound();
  }

  const other = conversation.userAId === session.user.id ? conversation.userB : conversation.userA;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link className={buttonVariants({ variant: "outline", className: "mb-4 w-fit" })} href="/chat">
              ← Quay lại tin nhắn
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-primary">{chatParticipantName(other)}</h1>
            {conversation.venueContext ? (
              <p className="mt-2 text-muted-foreground">
                Cuộc trò chuyện trực tiếp · Liên quan đến sân:{" "}
                <Link className="font-medium text-primary hover:underline" href={`/venues/${conversation.venueContext.id}`}>
                  {conversation.venueContext.name}
                </Link>
              </p>
            ) : conversation.matchContext ? (
              <p className="mt-2 text-muted-foreground">
                Cuộc trò chuyện trực tiếp · Liên quan đến trận:{" "}
                <Link className="font-medium text-primary hover:underline" href={`/matches/${conversation.matchContext.id}`}>
                  {conversation.matchContext.sport.name} tại {conversation.matchContext.area.name}
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-muted-foreground">Cuộc trò chuyện trực tiếp</p>
            )}
          </div>
        </div>

        {message ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{message}</div> : null}

        <Card>
          <CardContent className="grid max-h-[62vh] gap-4 overflow-y-auto p-5">
            {conversation.messages.map((chatMessage) => {
              const isMine = chatMessage.senderId === session.user.id;

              return (
                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`} key={chatMessage.id}>
                  <div className={`max-w-[78%] rounded-xl border px-4 py-3 text-sm shadow-sm ${isMine ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-muted"}`}>
                    <p className="whitespace-pre-wrap leading-6">{chatMessage.content}</p>
                    <p className={`mt-2 text-xs ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {chatMessage.createdAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}

            {conversation.messages.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
                Chưa có tin nhắn nào. Hãy gửi lời chào đầu tiên.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <form action={sendChatMessageAction} className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <input name="conversationId" type="hidden" value={conversation.id} />
          <Textarea name="content" maxLength={1000} placeholder="Nhập tin nhắn..." required rows={3} />
          <div className="flex justify-end">
            <Button type="submit">Gửi tin nhắn</Button>
          </div>
        </form>
      </div>
    </main>
  );
}
