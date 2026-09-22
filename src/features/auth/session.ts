import { getSupabaseConfig } from "./config";
import { createServerSupabaseClient } from "./server-client";

/** The signed-in person a review belongs to. */
export interface Signer {
  readonly id: string;
  readonly email: string | null;
}

/**
 * The three states the product actually has. There is no fourth state where
 * someone is pretending to be signed in: when Supabase is absent, accounts
 * are absent, and the screens say so.
 */
export type AccountsState =
  | { readonly kind: "unconfigured" }
  | { readonly kind: "signed-out" }
  | { readonly kind: "signed-in"; readonly signer: Signer };

/**
 * Resolves who is signed in.
 *
 * `getUser()` rather than `getSession()`: a session is decoded from a cookie
 * and a forged cookie decodes just fine, while `getUser()` validates against
 * the auth server. Authorization never rests on the cookie alone.
 */
export async function getAccountsState(): Promise<AccountsState> {
  if (!getSupabaseConfig()) return { kind: "unconfigured" };

  const supabase = await createServerSupabaseClient();
  if (!supabase) return { kind: "unconfigured" };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { kind: "signed-out" };

  return {
    kind: "signed-in",
    signer: { id: data.user.id, email: data.user.email ?? null },
  };
}

/** The signed-in signer, or null when nobody is signed in or accounts are absent. */
export async function getSignedInSigner(): Promise<Signer | null> {
  const state = await getAccountsState();
  return state.kind === "signed-in" ? state.signer : null;
}
