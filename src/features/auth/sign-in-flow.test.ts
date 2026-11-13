import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SignInPage from "@/app/(auth)/sign-in/page";
import SignUpPage from "@/app/(auth)/sign-up/page";
import VerifyEmailPage from "@/app/(auth)/verify-email/page";
import { GET as googleCallback } from "@/app/auth/callback/route";
import { GET as confirmEmail } from "@/app/auth/confirm/route";
import { renderScreen } from "~tests/support/render-screen";

import {
  requestPasswordResetAction,
  resetPasswordAction,
  sendSignInLinkAction,
  signInWithPasswordAction,
  signOutAction,
  signUpAction,
  startGoogleSignInAction,
  verifySignupCodeAction,
  verifySignupLinkAction,
} from "./actions";
import { getAccountsState } from "./session";

const auth = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getClaims: vi.fn(),
  getUser: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithOtp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
  verifyOtp: vi.fn(),
}));

const cookieJar = new Map<string, string>();
const origin = "http://localhost:3000";
const email = "renter@example.test";
const password = "test-password-2903";
const signer = {
  id: "signer-01",
  email,
  email_confirmed_at: "2027-02-01T09:00:00.000Z",
  created_at: "2027-02-01T09:00:00.000Z",
  user_metadata: { display_name: "Alexis" },
  identities: [{ provider: "email" }],
};

const providerSettings = {
  external: { google: true, email: true },
  mailer_autoconfirm: false,
  disable_signup: false,
};

vi.mock("@/features/auth/server-client", () => ({
  createServerSupabaseClient: async () => ({ auth }),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3000", origin }),
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => { cookieJar.set(name, value); },
    delete: (name: string) => { cookieJar.delete(name); },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function form(fields: Record<string, string>) {
  const values = new FormData();
  for (const [key, value] of Object.entries(fields)) values.set(key, value);
  return values;
}

async function redirectDestination(result: Promise<unknown>): Promise<URL> {
  try {
    const response = await result;
    if (response instanceof Response && response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) return new URL(location, origin);
    }
  } catch (error) {
    if (error instanceof Error && "digest" in error && typeof error.digest === "string") {
      const [kind, , target] = error.digest.split(";");
      if (kind === "NEXT_REDIRECT") return new URL(target, origin);
    }
    throw error;
  }
  throw new Error("The flow did not redirect.");
}

describe("sign-in flows at the Supabase boundary", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", origin);
    vi.stubEnv("AUTH_RECOVERY_COOKIE_SECRET", "non-secret-test-key-at-least-32-bytes");
    for (const method of Object.values(auth)) method.mockReset();
    cookieJar.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(providerSettings)));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("offers password and Google sign-in from the same screen", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    renderScreen(await SignInPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByLabelText(/^email address$/i)).toBeVisible();
    expect(screen.getByLabelText(/^password$/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /^sign in$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /forgot password/i })).toBeVisible();
    expect(screen.getByRole("link", { name: /create.*account/i })).toBeVisible();
  });

  it("asks for a first name at signup", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    renderScreen(await SignUpPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByLabelText("First name")).toHaveAttribute("autocomplete", "given-name");
    expect(screen.getByLabelText("Email address")).toBeVisible();
    expect(screen.getByLabelText("Password")).toBeVisible();
  });

  it("shows the verification field and resend action after signup", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    renderScreen(await SignUpPage({ searchParams: Promise.resolve({}) }));
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("First name"), "Alexis");
    await user.type(screen.getByLabelText("Email address"), email);
    await user.type(screen.getByLabelText("Password"), password);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    const input = await screen.findByLabelText("Verification code");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Send a new code" })).toBeVisible();
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("keeps email-link sign-in available when Google and recovery are unconfigured", async () => {
    vi.stubEnv("AUTH_RECOVERY_COOKIE_SECRET", "");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ...providerSettings,
      external: { ...providerSettings.external, google: false },
    })));
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    auth.signInWithOtp.mockResolvedValue({ error: null });

    renderScreen(await SignInPage({ searchParams: Promise.resolve({}) }));
    expect(screen.queryByRole("button", { name: /continue with google/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /forgot password/i })).toBeNull();
    expect(screen.getByText("Sign in with an email link")).toBeVisible();

    const next = "/review/saved-review";
    expect(await sendSignInLinkAction({ status: "idle" }, form({ email, next })))
      .toEqual({ status: "sign-in-link-sent" });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email,
      options: { emailRedirectTo: `${origin}/auth/confirm?next=%2Freview%2Fsaved-review`, shouldCreateUser: true },
    });
  });

  it("confirms an address once and signs in by password without sending another link", async () => {
    let confirmed = false;
    let signedIn = false;

    auth.signUp.mockResolvedValue({ data: { user: { ...signer, email_confirmed_at: null }, session: null }, error: null });
    auth.exchangeCodeForSession.mockImplementation(async (code: string) => {
      if (code !== "confirmation-code" || confirmed) return { error: { code: "otp_expired" } };
      confirmed = true;
      signedIn = true;
      return { data: { user: signer }, error: null };
    });
    auth.signInWithPassword.mockImplementation(async (credentials: { email: string; password: string }) => {
      if (!confirmed || credentials.email !== email || credentials.password !== password) {
        return { error: { code: "email_not_confirmed" } };
      }
      signedIn = true;
      return { data: { user: signer }, error: null };
    });
    auth.getUser.mockImplementation(async () => ({
      data: { user: signedIn ? signer : null },
      error: null,
    }));
    auth.signOut.mockImplementation(async () => {
      signedIn = false;
      return { error: null };
    });

    const registration = form({ firstName: "Alexis", email, password, confirmPassword: password });
    expect(await signUpAction({ status: "idle" }, registration)).toMatchObject({ status: "confirmation-sent" });
    expect(await getAccountsState()).toEqual({ kind: "signed-out" });
    expect(await signInWithPasswordAction({ status: "idle" }, form({ email, password }))).toMatchObject({
      status: "confirmation-required",
    });
    const signupRedirect = auth.signUp.mock.calls[0]?.[0].options.emailRedirectTo as string;
    const confirmationLink = new URL(signupRedirect);
    expect(confirmationLink.pathname).toBe("/auth/confirm");
    confirmationLink.searchParams.set("code", "confirmation-code");
    expect((await redirectDestination(confirmEmail(new NextRequest(confirmationLink)))).pathname).toBe("/account");

    expect((await redirectDestination(signOutAction())).pathname).toBe("/");
    expect(await getAccountsState()).toEqual({ kind: "signed-out" });
    const credentials = form({ email, password, next: "/review/saved-review" });
    expect((await redirectDestination(signInWithPasswordAction({ status: "idle" }, credentials))).pathname).toBe("/review/saved-review");
    expect(await getAccountsState()).toMatchObject({ kind: "signed-in", signer: { id: signer.id } });
    expect(auth.signUp).toHaveBeenCalledTimes(1);
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
    expect(auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("verifies the pasted code with the signup address and keeps leading zeroes", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    auth.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    await signUpAction({ status: "idle" }, form({ firstName: "Alexis", email, password }));
    expect(auth.signUp.mock.calls[0]?.[0].options.data).toEqual({ display_name: "Alexis" });

    const next = "/review/saved-review";
    const input = { code: " 001234 ", confirmationEmail: email, next };
    const mismatchedAddress = await verifySignupCodeAction({ status: "idle" }, form({
      ...input,
      confirmationEmail: "someone-else@example.test",
    }));
    expect(mismatchedAddress.status).toBe("confirmation-session-ended");
    expect(auth.verifyOtp).not.toHaveBeenCalled();

    auth.verifyOtp.mockResolvedValueOnce({ data: { session: null }, error: { code: "otp_expired" } });
    const expired = await verifySignupCodeAction({ status: "idle" }, form(input));
    expect(expired.status).toBe("invalid-confirmation-code");
    expect((await redirectDestination(verifySignupCodeAction({ status: "idle" }, form(input)))).pathname).toBe(next);
    expect(auth.verifyOtp).toHaveBeenLastCalledWith({ email, token: "001234", type: "email" });
    expect((await verifySignupCodeAction({ status: "idle" }, form(input))).status).toBe("confirmation-session-ended");
  });

  it("redeems the fallback link as a signup credential and ignores external continuations", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    const tokenHash = "pkce_some-signup-hash";
    const submitted = verifySignupLinkAction({ status: "idle" }, form({ tokenHash, next: "//example.test" }));
    expect((await redirectDestination(submitted)).pathname).toBe("/account");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: tokenHash, type: "signup" });
  });

  it("leaves the fallback token unused until the visitor verifies", async () => {
    const tokenHash = "pkce_fallback-signup-hash";
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: { code: "otp_expired" } });
    window.history.replaceState(null, "", `/verify-email#token_hash=${tokenHash}`);
    try {
      renderScreen(VerifyEmailPage());
      const verify = screen.getByRole("button", { name: "Verify email" });
      expect(auth.verifyOtp).not.toHaveBeenCalled();

      await userEvent.setup().click(verify);
      expect(await screen.findByRole("status")).toHaveTextContent("expired");
      expect(auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: tokenHash, type: "signup" });
      expect(window.location.hash).toBe("");
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it("starts Google sign-in and returns a canceled attempt to the app without exchanging a code", async () => {
    const googleAuthorization = "https://auth.example.test/auth/v1/authorize?provider=google";
    auth.signInWithOAuth.mockResolvedValue({ data: { url: googleAuthorization }, error: null });

    const result = await redirectDestination(startGoogleSignInAction({ status: "idle" }, form({
      next: "/review/saved-review",
    })));
    expect(result.href).toBe(googleAuthorization);
    const { provider, options } = auth.signInWithOAuth.mock.calls[0][0];
    expect(provider).toBe("google");
    expect(options.scopes.split(" ").sort()).toEqual(["email", "openid", "profile"]);
    const returnTo = new URL(options.redirectTo);
    expect(returnTo.origin).toBe(origin);
    expect(returnTo.pathname).toBe("/auth/callback");

    returnTo.searchParams.set("error", "access_denied");
    const canceled = await redirectDestination(googleCallback(new NextRequest(returnTo)));
    expect(canceled.pathname).toBe("/sign-in");
    expect(canceled.searchParams.get("problem")).toBeTruthy();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("keeps the visitor on the sign-in page if Google is disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ...providerSettings,
      external: { ...providerSettings.external, google: false },
    })));

    expect(await startGoogleSignInAction({ status: "idle" }, form({}))).toMatchObject({
      status: "provider-unavailable",
    });
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it("does not create a password account if the project would auto-confirm email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
      ...providerSettings,
      mailer_autoconfirm: true,
    })));
    auth.signUp.mockResolvedValue({ data: { user: signer, session: {} }, error: null });
    auth.signOut.mockResolvedValue({ error: null });

    expect(await signUpAction({ status: "idle" }, form({
      firstName: "Alexis", email, password,
    }))).toMatchObject({ status: "confirmation-unavailable" });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("acknowledges recovery requests without revealing whether an email belongs to an account", async () => {
    auth.resetPasswordForEmail
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { code: "user_not_found" } });

    const known = await requestPasswordResetAction({ status: "idle" }, form({ email }));
    const unknown = await requestPasswordResetAction({ status: "idle" }, form({ email: "unknown@example.test" }));

    expect(known.status).toBe("recovery-sent");
    expect(unknown.status).toBe("recovery-sent");
  });

  it("gives an existing magic-link user a password only after a verified recovery link", async () => {
    const recoveredPassword = "new-test-password-2904";
    let currentPassword: string | undefined;
    let signedIn = true;
    const claims = { sub: signer.id, session_id: "recovery-session-01" };
    auth.getUser.mockImplementation(async () => ({ data: { user: signedIn ? signer : null }, error: null }));
    auth.getClaims.mockResolvedValue({ data: { claims }, error: null });
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: signer, redirectType: "recovery" },
      error: null,
    });
    auth.updateUser.mockImplementation(async ({ password: nextPassword }: { password: string }) => {
      currentPassword = nextPassword;
      return { data: { user: signer }, error: null };
    });
    auth.signInWithPassword.mockImplementation(async (credentials: { email: string; password: string }) => {
      if (credentials.email !== email || credentials.password !== currentPassword) {
        return { error: { code: "invalid_credentials" } };
      }
      signedIn = true;
      return { data: { user: signer }, error: null };
    });
    auth.signOut.mockImplementation(async () => {
      signedIn = false;
      return { error: null };
    });

    const newCredentials = form({ password: recoveredPassword, confirmPassword: recoveredPassword });
    expect(await resetPasswordAction({ status: "idle" }, newCredentials)).toMatchObject({ status: "recovery-required" });
    expect(auth.updateUser).not.toHaveBeenCalled();

    expect(await requestPasswordResetAction({ status: "idle" }, form({ email }))).toMatchObject({ status: "recovery-sent" });
    const recoveryLink = new URL(auth.resetPasswordForEmail.mock.calls[0][1].redirectTo);
    recoveryLink.searchParams.set("code", "recovery-code");
    expect((await redirectDestination(confirmEmail(new NextRequest(recoveryLink)))).pathname).toBe("/reset-password");

    auth.getClaims.mockResolvedValueOnce({
      data: { claims: { ...claims, session_id: "different-session" } },
      error: null,
    });
    expect(await resetPasswordAction({ status: "idle" }, newCredentials)).toMatchObject({ status: "recovery-required" });
    expect(auth.updateUser).not.toHaveBeenCalled();

    expect((await redirectDestination(resetPasswordAction({ status: "idle" }, newCredentials))).pathname).toBe("/account");
    expect(await resetPasswordAction({ status: "idle" }, newCredentials)).toMatchObject({ status: "recovery-required" });
    expect((await redirectDestination(signOutAction())).pathname).toBe("/");
    expect((await redirectDestination(signInWithPasswordAction({ status: "idle" }, form({
      email, password: recoveredPassword,
    })))).pathname).toBe("/account");
    expect(await getAccountsState()).toMatchObject({ kind: "signed-in", signer: { id: signer.id } });
  });
});
