import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { ThreadChatScreen } from "@/components/chat/chat-screen";
import { getThreadMessages } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/ai-coach/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setInitial(null);
    getThreadMessages({ data: { threadId } })
      .then((rows) => {
        if (cancelled) return;
        const mapped: UIMessage[] = rows.map((r) => ({
          id: r.id,
          role: r.role === "assistant" ? "assistant" : "user",
          parts: [{ type: "text", text: r.content }],
        }));
        setInitial(mapped);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setInitial([]);
      });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  if (initial === null) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-hairline border-t-brand" />
      </div>
    );
  }

  return <ThreadChatScreen threadId={threadId} initialMessages={initial} />;
}
