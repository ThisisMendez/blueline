import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { submitContact } from "./contact-route";

const contact = {
  kind: "contact",
  name: "Sam",
  email: "sam@example.com",
  topic: "Something isn't working",
  message: "The next step was unclear.",
};

function post(value: unknown) {
  return new Request("https://blueline.example/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}

describe("contact submissions", () => {
  const send = vi.fn();

  beforeEach(() => {
    vi.stubEnv("FORMSPREE_FORM_ID", "testForm");
    vi.stubGlobal("fetch", send);
    send.mockReset();
    send.mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the configured form, fixed subject, topic and reply address", async () => {
    expect((await submitContact(post(contact))).status).toBe(204);
    const [url, options] = send.mock.calls[0];
    expect(url).toBe("https://formspree.io/f/testForm");
    expect(options.headers.Accept).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({
      subject: "[Blue Line] Website Contact",
      name: "Sam",
      email: "sam@example.com",
      message: "Topic: Something isn't working\n\nThe next step was unclear.",
    });
  });

  it("tags guest feedback and forwards only the permitted report context", async () => {
    const feedback = { kind: "feedback", useful: "Yes", message: "Easy to read", source: "report", role: "renter" };
    expect((await submitContact(post(feedback))).status).toBe(204);
    expect(JSON.parse(send.mock.calls[0][1].body)).toEqual({
      subject: "[Blue Line] Website Contact",
      category: "beta-feedback",
      message: "Topic: Beta feedback\nWas this useful? Yes\nFrom: report\nSide: renter\n\nEasy to read",
    });
  });

  it.each([
    { ...contact, subject: "A different subject" },
    { ...contact, email: "not-an-email" },
    { ...contact, website: "https://example.com" },
    { ...contact, message: " " },
    { kind: "feedback", message: "Easy to read", reviewId: "lease-private" },
  ])("rejects invalid or unexpected form input without forwarding it", async (value) => {
    expect((await submitContact(post(value))).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects oversized requests and keeps an unconfigured form closed", async () => {
    expect((await submitContact(post({ ...contact, message: "😀".repeat(5_000) }))).status).toBe(413);
    vi.stubEnv("FORMSPREE_FORM_ID", "");
    expect((await submitContact(post(contact))).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });

  it.each([[429, 429], [500, 502]])("handles a provider %i response without confirming success", async (provider, status) => {
    send.mockResolvedValueOnce(new Response(null, { status: provider }));
    expect((await submitContact(post(contact))).status).toBe(status);
  });
});
