import type { User } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./config";
import { createServerSupabaseClient } from "./server-client";

/** The signed-in person a review belongs to. */
export interface Signer {
  readonly id: string;
  readonly email: string | null;
  readonly displayName?: string;
  readonly emailVerified?: boolean;
  readonly memberSince?: string;
  readonly lastSignInAt?: string;
  readonly signInMethods?: readonly SignInMethod[];
}

type SignInMethod = "email" | "google";

export function getSignInMethods(user: User): readonly SignInMethod[] {
  const providers = user.identities?.length
    ? user.identities.map(({ provider }) => provider)
    : user.app_metadata.providers ?? [user.app_metadata.provider];
  return providers.filter((provider): provider is SignInMethod => provider === "email" || provider === "google");
}

function getDisplayName(user: User): string | undefined {
  const metadata = user.user_metadata;
  for (const value of [metadata.display_name, metadata.full_name, metadata.name]) {
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 80);
  }
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

  const user = data.user;
  return {
    kind: "signed-in",
    signer: {
      id: user.id,
      email: user.email ?? null,
      displayName: getDisplayName(user),
      emailVerified: Boolean(user.email_confirmed_at),
      memberSince: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      signInMethods: getSignInMethods(user),
    },
  };
}

/** The signed-in signer, or null when nobody is signed in or accounts are absent. */
export async function getSignedInSigner(): Promise<Signer | null> {
  const state = await getAccountsState();
  return state.kind === "signed-in" ? state.signer : null;
}
