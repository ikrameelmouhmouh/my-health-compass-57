import { createFileRoute } from "@tanstack/react-router";
import { DraftChatScreen } from "@/components/chat/chat-screen";

export const Route = createFileRoute("/_authenticated/ai-coach")({
  component: DraftChatScreen,
});
