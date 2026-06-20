// Module-level store to hand off the first message from /ai-coach (draft)
// to /ai-coach/$threadId after creating a new thread. We use a Map so
// navigations during a rapid double-tap don't collide.

export type PendingMessage = {
  text: string;
  files?: FileList | File[];
};

const pending = new Map<string, PendingMessage>();

export function setPendingMessage(threadId: string, msg: PendingMessage) {
  pending.set(threadId, msg);
}

export function takePendingMessage(threadId: string): PendingMessage | undefined {
  const m = pending.get(threadId);
  if (m) pending.delete(threadId);
  return m;
}
