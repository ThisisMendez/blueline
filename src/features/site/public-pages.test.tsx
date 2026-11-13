import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ContactPage from "@/app/(marketing)/contact/page";
import FeaturesPage from "@/app/(marketing)/features/page";
import HowItWorksPage from "@/app/(marketing)/how-it-works/page";
import PricingPage from "@/app/(marketing)/pricing/page";
import PrivacyPage from "@/app/(marketing)/privacy/page";
import ResourcesPage from "@/app/(marketing)/resources/page";
import TermsPage from "@/app/(marketing)/terms/page";
import { BelowFold } from "@/features/landing/components/BelowFold";
import { BrandHero } from "@/features/landing/components/BrandHero";
import { FieldNotes } from "@/features/landing/components/FieldNotes";
import { ReviewToolbar } from "@/features/landing/components/ReviewToolbar";

import { ContactForm } from "./ContactForm";
import { draftLegalPagesVisible } from "./legal-gate";
import { FeedbackLink } from "./FeedbackLink";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function contactPage(searchParams: Record<string, string> = {}) {
  return ContactPage({ params: Promise.resolve({}), searchParams: Promise.resolve(searchParams) });
}

const newPages = {
  "how it works": HowItWorksPage,
  features: FeaturesPage,
  pricing: PricingPage,
  resources: ResourcesPage,
  terms: TermsPage,
  privacy: PrivacyPage,
} as const;

const publicSurfaces = {
  "how it works": HowItWorksPage,
  features: FeaturesPage,
  pricing: PricingPage,
  resources: ResourcesPage,
  terms: TermsPage,
  privacy: PrivacyPage,
  "homepage BelowFold": BelowFold,
  "homepage BrandHero": BrandHero,
  "homepage FieldNotes": FieldNotes,
  "homepage ReviewToolbar": ReviewToolbar,
} as const;

describe("public pages", () => {
  // "Ask about your agreement" was removed from the product.
  it.each(Object.entries(publicSurfaces))("%s never offers to answer questions about the agreement", (_, Page) => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { container } = render(<Page />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/ask (about|the document|questions)/i);
    expect(text).not.toMatch(/document-grounded|grounded answers?/i);
    expect(text).not.toMatch(/questions about (your|the) (agreement|lease|document)/i);
  });

  // The homepage's FieldNotes says, in the negative, that it won't call a lease
  // safe to sign; this check covers the new pages, which make no such mention.
  it.each(Object.entries(newPages))("%s makes no safe-to-sign or legal-validity claim", (_, Page) => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { container } = render(<Page />);
    expect(container.textContent).not.toMatch(/safe to sign|legally (valid|binding)|guarantee/i);
  });
});

describe("pricing", () => {
  it("is free in beta with no price, checkout, or subscription", () => {
    const { container } = render(<PricingPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Free while in beta" })).toBeInTheDocument();
    expect(screen.getByText("No cost, no card for the beta.")).toBeInTheDocument();
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/[$€£]\s?\d|\/\s?mo|per month|per year/i);
    expect(text).not.toMatch(/checkout|subscribe|upgrade|buy now|free trial/i);
    expect(container.querySelector("form")).toBeNull();
  });

  it("shows Starter as live and Pro as planned", () => {
    render(<PricingPage />);
    expect(screen.getByRole("region", { name: "Starter" })).toHaveTextContent(/Live in beta/);
    expect(screen.getByRole("region", { name: "Pro" })).toHaveTextContent(/Planned/);
  });
});

describe("contact", () => {
  it("keeps sending disabled without the configured delivery service", async () => {
    vi.stubEnv("FORMSPREE_FORM_ID", "");
    const { container } = render(await contactPage());
    expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(screen.getByLabelText("Message")).toBeDisabled();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.textContent).not.toMatch(/reply within|respond within|we usually reply/i);
    expect(container.textContent).not.toMatch(/safe to sign|legally (valid|binding)|guarantee/i);
    expect(container.textContent).toMatch(/Leave your lease out/);
  });

  it("keeps the draft on failure and clears it after delivery is accepted", async () => {
    const user = userEvent.setup();
    const send = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", send);
    render(<ContactForm available />);
    await user.type(screen.getByLabelText("Name"), "Sam");
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Message"), "Hello there");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/sending limit/);
    expect(screen.getByLabelText("Message")).toHaveValue("Hello there");

    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/received your message/);
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("submits report feedback with no email and only the allowed context", async () => {
    const user = userEvent.setup();
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubEnv("FORMSPREE_FORM_ID", "example123");
    vi.stubGlobal("fetch", send);
    render(await contactPage({ topic: "beta-feedback", source: "report", role: "landlord", reviewId: "private" }));
    await user.selectOptions(screen.getByLabelText(/Was this useful/), "Yes");
    await user.type(screen.getByLabelText(/What worked/), "Clear explanation");
    await user.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/received your feedback/);
    const [url, options] = send.mock.calls[0];
    expect(url).toBe("/api/contact");
    expect(JSON.parse(options.body)).toEqual({
      kind: "feedback", useful: "Yes", message: "Clear explanation", source: "report", role: "landlord", website: "",
    });
  });

  it("opens feedback from the report in a separate tab", () => {
    render(<FeedbackLink source="report" role="renter" />);
    const link = screen.getByRole("link", { name: /Give feedback/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("href", "/contact?topic=beta-feedback&source=report&role=renter");
  });
});

describe("draft legal pages", () => {
  it("are visible on preview and development, hidden on production", () => {
    expect(draftLegalPagesVisible("production")).toBe(false);
    expect(draftLegalPagesVisible("preview")).toBe(true);
    expect(draftLegalPagesVisible("development")).toBe(true);
    expect(draftLegalPagesVisible(undefined)).toBe(true);
  });

  it.each([
    ["terms", TermsPage],
    ["privacy", PrivacyPage],
  ] as const)("%s returns not found in production", (_, Page) => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => Page()).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it.each([
    ["terms", TermsPage],
    ["privacy", PrivacyPage],
  ] as const)("%s shows the draft banner on preview", (_, Page) => {
    vi.stubEnv("VERCEL_ENV", "preview");
    render(<Page />);
    expect(screen.getByRole("note", { name: "Draft for review" })).toBeInTheDocument();
  });
});
