import type { SupabaseClient } from "@supabase/supabase-js";

export function exchangeAuthCode(client: SupabaseClient, code: string, query: URLSearchParams) {
  const flowId = query.get("sb_flow_id");
  return flowId === null
    ? client.auth.exchangeCodeForSession(code)
    : client.auth.exchangeCodeForSession(code, { flowId });
}
