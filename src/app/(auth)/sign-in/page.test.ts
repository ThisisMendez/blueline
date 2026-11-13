import { describe, expect, it, vi } from "vitest";

import SignInPage from "./page";

vi.mock("@/features/auth/session", () => ({
  getAccountsState: async () => ({
    kind: "signed-in",
    signer: { id: "signer", email: "signer@example.test" },
  }),
}));

function signIn(next?: string | string[]) {
  return SignInPage({
    params: Promise.resolve({}),
    searchParams: Promise.resolve({ next }),
  });
}

describe("sign-in page redirects for signed-in users", () => {
  it("preserves a local destination with its query and fragment", async () => {
    await expect(signIn("/review/example?tab=flags#notes")).rejects.toMatchObject({
      digest: expect.stringContaining(";/review/example?tab=flags#notes;"),
    });
  });

  it.each([
    undefined,
    ["//example.test", "/review/example"],
    "https://example.test/review",
    "//example.test/review",
    "/\\example.test/review",
    "/review/..//example.test",
  ].map((next) => ({ next })))(
    "falls back to review for an invalid destination ($next)",
    async ({ next }) => {
      await expect(signIn(next)).rejects.toMatchObject({
        digest: expect.stringContaining(";/review;"),
      });
    },
  );
});
