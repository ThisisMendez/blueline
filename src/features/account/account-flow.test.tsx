import { screen, within } from "@testing-library/react";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "@/app/(app)/account/page";
import AccountSettingsPage from "@/app/(app)/account/settings/page";
import SavedReviewPage from "@/app/(app)/review/[reviewId]/page";
import { GET as googleCallback } from "@/app/auth/callback/route";
import { CHECKLIST_TOPIC_IDS } from "@/features/analysis/checklist";
import { CLEAN_REVIEW_STATEMENT, type ReviewRole } from "@/features/analysis/types";
import { InMemoryReviewStore } from "@/features/library/memory-store";
import { renderScreen } from "~tests/support/render-screen";

import { changePasswordAction, updateDisplayNameAction } from "./actions";

const boundary = vi.hoisted(() => ({
  getUser: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  updateUser: vi.fn(),
  verifyPassword: vi.fn(),
  signOutVerifier: vi.fn(),
  reviewStore: null as InMemoryReviewStore | null,
}));

vi.mock("@/features/auth/server-client", () => ({
  createServerSupabaseClient: async () => ({
    auth: {
      getUser: boundary.getUser,
      exchangeCodeForSession: boundary.exchangeCodeForSession,
      updateUser: boundary.updateUser,
    },
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithPassword: boundary.verifyPassword, signOut: boundary.signOutVerifier } }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/features/library/supabase-store", () => ({
  openReviewStore: async () => boundary.reviewStore,
}));

const owner = {
  id: "existing-signer",
  email: "alexis@example.test",
  email_confirmed_at: "2027-02-01T09:00:00.000Z",
  created_at: "2027-02-01T09:00:00.000Z",
  last_sign_in_at: "2027-02-10T09:00:00.000Z",
  user_metadata: { display_name: "Alexis" },
  app_metadata: { provider: "email", providers: ["email"] },
  identities: [{ provider: "email" }],
};

function setSignedInUser(user: typeof owner) {
  boundary.getUser.mockResolvedValue({ data: { user }, error: null });
}

function openReview(reviewId: string) {
  return SavedReviewPage({
    params: Promise.resolve({ reviewId }),
    searchParams: Promise.resolve({}),
  });
}

async function saveReview(store: InMemoryReviewStore, role: ReviewRole, signerId: string) {
  await store.save({
    id: `${signerId}-${role}`,
    signerId,
    createdAt: "2027-02-09T09:00:00.000Z",
    documents: [{
      id: "lease",
      title: `${role === "renter" ? "Renter" : "Landlord"} lease`,
      text: "Residential lease between the landlord and tenant.",
    }],
    review: {
      role,
      summary: "Residential lease between the landlord and tenant.",
      riskFlags: [],
      coverage: { items: CHECKLIST_TOPIC_IDS.map((topicId) => ({ topicId, status: "not-found" })) },
      clean: true,
      cleanStatement: CLEAN_REVIEW_STATEMENT,
      droppedFlagCount: 0,
    },
  });
}

describe("account home and its existing review library", () => {
  beforeEach(async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
    boundary.getUser.mockReset();
    boundary.exchangeCodeForSession.mockReset();
    boundary.updateUser.mockReset();
    boundary.verifyPassword.mockReset();
    boundary.signOutVerifier.mockReset();
    const store = new InMemoryReviewStore(() => new Date("2027-02-10T09:00:00.000Z"));
    boundary.reviewStore = store;
    await saveReview(store, "renter", owner.id);
    await saveReview(store, "landlord", owner.id);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("keeps the existing library and review roles when the same Supabase account adds Google", async () => {
    boundary.exchangeCodeForSession.mockImplementation(async (code: string) => {
      expect(code).toBe("google-code");
      const linkedAccount = {
        ...owner,
        app_metadata: { provider: "email", providers: ["email", "google"] },
        identities: [{ provider: "email" }, { provider: "google" }],
      };
      setSignedInUser(linkedAccount);
      return { data: { user: linkedAccount, redirectType: null }, error: null };
    });
    await expect(googleCallback(new NextRequest("http://localhost:3000/auth/callback?code=google-code"))).rejects.toMatchObject({
      digest: expect.stringMatching(/;(?:http:\/\/localhost:3000)?\/account;/),
    });

    const home = renderScreen(await AccountPage());
    expect(screen.getByRole("heading", { name: "Welcome back, Alexis" })).toBeVisible();
    expect(screen.getByText("Your lease analyst")).toBeVisible();

    const library = within(screen.getByRole("region", { name: "Your reviews" }));
    const renterLink = library.getByRole("link", { name: "Renter lease" });
    const landlordLink = library.getByRole("link", { name: "Landlord lease" });
    expect(renterLink).toHaveAttribute("href", "/review/existing-signer-renter");
    expect(landlordLink).toHaveAttribute("href", "/review/existing-signer-landlord");
    home.unmount();

    for (const role of ["Renter", "Landlord"]) {
      const review = renderScreen(await openReview(`existing-signer-${role.toLowerCase()}`));
      expect(screen.getByText(`Reviewed as a ${role.toLowerCase()}`)).toBeVisible();
      review.unmount();
    }
  });

  it("withholds the owner's links and review pages from another authenticated user", async () => {
    setSignedInUser({ ...owner, id: "other-signer", email: "other@example.test" });

    renderScreen(await AccountPage());

    expect(screen.queryByRole("link", { name: "Renter lease" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Landlord lease" })).not.toBeInTheDocument();
    await expect(openReview("existing-signer-renter")).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
    await expect(openReview("existing-signer-landlord")).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  });

  it("sends a signed-out visitor to sign in before exposing the account home", async () => {
    boundary.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(AccountPage()).rejects.toMatchObject({
      digest: expect.stringContaining(";/sign-in?next="),
    });
  });

  it("shows Google-only account details without offering a Blueline password change", async () => {
    setSignedInUser({
      ...owner,
      app_metadata: { provider: "google", providers: ["google"] },
      identities: [{ provider: "google" }],
    });

    renderScreen(await AccountSettingsPage());

    expect(screen.getByRole("heading", { name: "Account settings" })).toBeVisible();
    expect(screen.getByLabelText("Display name")).toHaveValue("Alexis");
    expect(screen.getByText(owner.email)).toBeVisible();
    expect(screen.getByText(/member since/i)).toBeVisible();
    expect(screen.getByText(/last sign-in/i)).toBeVisible();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
  });

  it("uses the updated display name on the account home and retains the original review links", async () => {
    setSignedInUser(owner);
    boundary.updateUser.mockImplementation(async ({ data }: { data: { display_name: string } }) => {
      const user = { ...owner, user_metadata: data };
      setSignedInUser(user);
      return { data: { user }, error: null };
    });
    const form = new FormData();
    form.set("displayName", "Alexis Test");

    expect(await updateDisplayNameAction(null, form)).toMatchObject({ status: "saved" });
    renderScreen(await AccountPage());

    expect(screen.getByRole("heading", { name: "Welcome back, Alexis Test" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Renter lease" })).toHaveAttribute("href", "/review/existing-signer-renter");
  });

  it("requires the current password before updating a password account", async () => {
    setSignedInUser(owner);
    const newPassword = "updated-password-2906";
    const currentPassword = "original-password-2905";
    boundary.verifyPassword.mockImplementation(async (credentials: { email: string; password: string }) => (
      credentials.email === owner.email && credentials.password === currentPassword
        ? { data: { user: owner }, error: null }
        : { data: { user: null }, error: { code: "invalid_credentials" } }
    ));
    boundary.signOutVerifier.mockResolvedValue({ error: null });
    boundary.updateUser.mockResolvedValue({ data: { user: owner }, error: null });
    const form = new FormData();
    form.set("currentPassword", "wrong-password");
    form.set("newPassword", newPassword);
    form.set("confirmPassword", newPassword);

    expect(await changePasswordAction(null, form)).toMatchObject({ status: "error" });
    expect(boundary.updateUser).not.toHaveBeenCalled();

    form.set("currentPassword", currentPassword);
    expect(await changePasswordAction(null, form)).toMatchObject({ status: "saved" });
    expect(boundary.updateUser).toHaveBeenCalledWith({ password: newPassword, current_password: currentPassword });
  });
});
