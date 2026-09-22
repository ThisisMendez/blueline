import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { SupabaseRedLineStore } from "./supabase-store";

/** Database transport substitute, not a claim about deployed SQL policies. */
function databaseClient(failWrites = false): SupabaseClient {
  const rows = new Map<string, readonly string[]>();
  return {
    from() {
      let signerId = "";
      const query = {
        select() { return query; },
        eq(_column: string, value: string) { signerId = value; return query; },
        async maybeSingle() { return { data: rows.has(signerId) ? { red_lines: rows.get(signerId) } : null, error: null }; },
        async upsert(row: { user_id: string; red_lines: readonly string[] }) {
          if (failWrites) return { error: { message: "Database unavailable" } };
          rows.set(row.user_id, row.red_lines);
          return { error: null };
        },
      };
      return query;
    },
  } as unknown as SupabaseClient;
}

describe("Supabase personal red-line adapter", () => {
  it("roundtrips edits and clears only the selected signer's preferences", async () => {
    const store = new SupabaseRedLineStore(databaseClient());
    expect(await store.read("a")).toEqual([]);
    await store.save("a", ["No arbitration"]);
    await store.save("b", ["At least two days notice before entry"]);
    expect(await store.read("a")).toEqual(["No arbitration"]);
    await store.save("a", ["No open-ended exit fees"]);
    expect(await store.read("a")).toEqual(["No open-ended exit fees"]);
    await store.save("a", []);
    expect(await store.read("a")).toEqual([]);
    expect(await store.read("b")).toEqual(["At least two days notice before entry"]);
  });
  it("does not report success when saving fails", async () => {
    const store = new SupabaseRedLineStore(databaseClient(true));
    await expect(store.save("a", ["No arbitration"])).rejects.toThrow("could not be saved");
  });
});
