// Module-level + sessionStorage store to hand off the first message from
// /ai-coach (draft) to /ai-coach/$threadId after creating a new thread.
//
// The in-memory Map is the fast path. sessionStorage is the fallback so the
// message survives Vite HMR module reloads, brief unmounts, or a tab reload
// in the middle of the navigation. Files (images) can only travel via the
// Map because they aren't serializable.

export type PendingMessage = {
  text: string;
  files?: FileList | File[];
};

const pending = new Map<string, PendingMessage>();

const storageKey = (threadId: string) => `chat:pending:${threadId}`;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function setPendingMessage(threadId: string, msg: PendingMessage) {
  pending.set(threadId, msg);
  if (isBrowser()) {
    try {
      // Only persist text; files survive only via the Map.
      window.sessionStorage.setItem(storageKey(threadId), JSON.stringify({ text: msg.text }));
    } catch {
      /* quota / private mode — ignore */
    }
  }
}

export function takePendingMessage(threadId: string): PendingMessage | undefined {
  const mem = pending.get(threadId);
  if (mem) {
    pending.delete(threadId);
    if (isBrowser()) {
      try {
        window.sessionStorage.removeItem(storageKey(threadId));
      } catch {
        /* ignore */
      }
    }
    return mem;
  }
  if (isBrowser()) {
    try {
      const raw = window.sessionStorage.getItem(storageKey(threadId));
      if (raw) {
        window.sessionStorage.removeItem(storageKey(threadId));
        const parsed = JSON.parse(raw) as { text?: string };
        if (parsed?.text) return { text: parsed.text };
      }
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

/** Put a pending message back if sending failed, so a reload can retry. */
export function requeuePendingMessage(threadId: string, msg: PendingMessage) {
  setPendingMessage(threadId, msg);
}
