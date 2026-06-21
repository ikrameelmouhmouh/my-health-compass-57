import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHmac } from "crypto";

/**
 * Returns an HMAC token + ready-to-use widget URL for the authenticated user.
 * The token is derived from WIDGET_SECRET and the user's id. It is stable
 * (does not expire) but only valid while WIDGET_SECRET is unchanged.
 */
export const getWidgetCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secret = process.env.WIDGET_SECRET;
    if (!secret) {
      throw new Error("Widget not configured");
    }
    const userId = context.userId;
    const token = createHmac("sha256", secret).update(userId).digest("hex");
    return { userId, token };
  });
