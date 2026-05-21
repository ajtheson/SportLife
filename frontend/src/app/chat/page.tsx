import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { chatParticipantName, listConversations } from "@/features/chat/chat-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let conversations: Awaited<ReturnType<typeof listConversations>>;

  try {
    conversations = await listConversations(session.user.id);
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

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Nhắn tin</h1>
          <p className="mt-3 text-muted-foreground">Trao đổi trực tiếp với chủ sân hoặc người chơi đã được duyệt vào trận.</p>
        </div>

        <div className="grid gap-3">
          {conversations.map((conversation) => {
            const other = conversation.userAId === session.user.id ? conversation.userB : conversation.userA;
            const latestMessage = conversation.messages[0];

            return (
              <Link href={`/chat/${conversation.id}`} key={conversation.id}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="font-semibold text-foreground">{chatParticipantName(other)}</h2>
                        {conversation.venueContext ? (
                          <p className="mt-1 text-xs font-medium text-primary">Liên quan đến sân: {conversation.venueContext.name}</p>
                        ) : conversation.matchContext ? (
                          <p className="mt-1 text-xs font-medium text-primary">
                            Liên quan đến trận: {conversation.matchContext.sport.name} tại {conversation.matchContext.area.name}
                          </p>
                        ) : null}
                        <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                          {latestMessage?.content ?? "Chưa có tin nhắn nào."}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {conversation.lastMessageAt.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Chưa có cuộc trò chuyện nào. Hãy bắt đầu từ trang chi tiết sân hoặc trận đấu.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
