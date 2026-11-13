import { describe, expect, it } from "vitest";

import { buildMailtoLink, encodeMailtoValue, MAILTO_MAX_LENGTH } from "./mailto";

const draft = {
  name: "Sam Rivera",
  email: "sam@example.com",
  topic: "Feedback on a review",
  message: "The fee filter & score helped!\nSecond line (with 'quotes').",
};

function decoded(href: string, field: "subject" | "body"): string {
  const query = href.slice(href.indexOf("?") + 1);
  const pair = query.split("&").find((part) => part.startsWith(`${field}=`));
  return decodeURIComponent(pair!.slice(field.length + 1));
}

describe("buildMailtoLink", () => {
  it("addresses the support inbox and pre-fills subject and body", () => {
    const link = buildMailtoLink("help@example.com", draft);
    expect(link.href.startsWith("mailto:help@example.com?subject=")).toBe(true);
    expect(decoded(link.href, "subject")).toBe("Blueline Redline: Feedback on a review");
    expect(decoded(link.href, "body")).toBe(
      "The fee filter & score helped!\r\nSecond line (with 'quotes').\r\n\r\nFrom: Sam Rivera <sam@example.com>",
    );
  });

  it("percent-encodes every reserved character so the query can't be split", () => {
    const link = buildMailtoLink("help@example.com", draft);
    const query = link.href.slice(link.href.indexOf("?") + 1);
    expect(query.split("&")).toHaveLength(2);
    expect(query).not.toMatch(/[ \n\r!'()*<>]/);
    expect(query).toContain("%26");
    expect(query).toContain("%0D%0A");
    expect(encodeMailtoValue("a b")).toBe("a%20b");
  });

  it("leaves the signature out when name and email are blank", () => {
    const link = buildMailtoLink("help@example.com", { ...draft, name: " ", email: "" });
    expect(decoded(link.href, "body")).not.toContain("From:");
  });

  it("flags a link over the length cap and says by how much", () => {
    const short = buildMailtoLink("help@example.com", draft);
    expect(short.tooLong).toBe(false);
    expect(short.overBy).toBe(0);

    const long = buildMailtoLink("help@example.com", { ...draft, message: "x".repeat(MAILTO_MAX_LENGTH) });
    expect(long.tooLong).toBe(true);
    expect(long.overBy).toBe(long.length - MAILTO_MAX_LENGTH);
    expect(long.href.length).toBe(long.length);
  });
});
