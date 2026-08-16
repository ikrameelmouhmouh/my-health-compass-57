import { supabase } from "@/integrations/supabase/client";

// Beta namespace; typed locally so TS is happy without grepping node_modules.
export type OAuthDetails = {
  client?: { name?: string; client_id?: string };
  redirect_url?: string;
  redirect_to?: string;
  scope?: string;
  scopes?: string[];
};
type OAuthResp<T> = { data: T | null; error: { message: string } | null };

export const oauth = supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<OAuthResp<OAuthDetails>>;
    approveAuthorization: (id: string) => Promise<OAuthResp<OAuthDetails>>;
    denyAuthorization: (id: string) => Promise<OAuthResp<OAuthDetails>>;
  };
};
