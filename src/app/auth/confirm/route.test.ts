import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const { exchangeCodeForSession, verifyOtp } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/features/auth/server-client", () => ({
  createServerSupabaseClient: async () => ({
    auth: { exchangeCodeForSession, verifyOtp },
  }),
}));

function confirm(query: string) {
  return GET(new NextRequest(`http://localhost:3000/auth/confirm?${query}`));
}

describe("email sign-in callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
    verifyOtp.mockReset().mockResolvedValue({ error: null });
  });

  it("exchanges the code from the default Supabase magic link", async () => {
    await expect(confirm("code=email-code&next=/review")).rejects.toMatchObject({
      digest: expect.stringContaining(";/review;"),
    });
    expect(exchangeCodeForSession).toHaveBeenCalledWith("email-code");
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("still verifies token hashes from custom email templates", async () => {
    await expect(confirm("token_hash=email-hash&type=email")).rejects.toMatchObject({
      digest: expect.stringContaining(";/account;"),
    });
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "email-hash", type: "email" });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("returns incomplete links to sign-in", async () => {
    await expect(confirm("next=/review")).rejects.toMatchObject({
      digest: expect.stringContaining(";/sign-in?problem=link-unreadable;"),
    });
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("returns failed exchanges to sign-in", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("Expired code") });
    await expect(confirm("code=expired-code")).rejects.toMatchObject({
      digest: expect.stringContaining(";/sign-in?problem=link-expired;"),
    });
  });

  it("keeps the post-login redirect on the app's origin", async () => {
    await expect(confirm("code=email-code&next=//example.test")).rejects.toMatchObject({
      digest: expect.stringContaining(";/account;"),
    });
  });

  it("refuses OTP types outside the email confirmation and recovery flows", async () => {
    await expect(confirm("token_hash=hash&type=email_change")).rejects.toMatchObject({
      digest: expect.stringContaining(";/sign-in?problem=link-unreadable;"),
    });
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("uses the PKCE verifier slot named in the callback", async () => {
    await expect(confirm("code=email-code&sb_flow_id=flow-slot&next=/review")).rejects.toMatchObject({
      digest: expect.stringContaining(";/review;"),
    });
    expect(exchangeCodeForSession).toHaveBeenCalledWith("email-code", { flowId: "flow-slot" });
  });
});
