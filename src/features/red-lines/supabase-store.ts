import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/features/auth/server-client";
import { redLinesSchema } from "./contract";
import type { RedLineStore } from "./store";

export class SupabaseRedLineStore implements RedLineStore {
  constructor(private readonly client: SupabaseClient) {}
  async read(signerId: string): Promise<readonly string[]> {
    const result = await this.client.from("signer_red_lines").select("red_lines").eq("user_id", signerId).maybeSingle();
    if (result.error) throw new Error("Personal red lines could not be read.");
    return redLinesSchema.parse(result.data?.red_lines ?? []);
  }
  async save(signerId: string, lines: readonly string[]): Promise<void> {
    const validated = redLinesSchema.parse(lines);
    const result = await this.client.from("signer_red_lines").upsert({ user_id: signerId, red_lines: validated }, { onConflict: "user_id" });
    if (result.error) throw new Error("Personal red lines could not be saved.");
  }
}

export async function openRedLineStore(): Promise<RedLineStore | null> {
  const client = await createServerSupabaseClient();
  return client ? new SupabaseRedLineStore(client) : null;
}
