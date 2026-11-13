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

import { SUPPORT_EMAIL } from "./contact-config";
import { ContactForm } from "./ContactForm";
import { draftLegalPagesVisible } from "./legal-gate";

afterEach(() => {
  vi.unstubAllEnvs();
});

const newPages = {
  "how it works": HowItWorksPage,
  features: FeaturesPage,
  pricing: PricingPage,
  contact: ContactPage,
  resources: ResourcesPage,
  terms: TermsPage,
  privacy: PrivacyPage,
} as const;

const publicSurfaces = {
  "how it works": HowItWorksPage,
  features: FeaturesPage,
  pricing: PricingPage,
  contact: ContactPage,
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
  it("has no support address yet, so the form is switched off", () => {
    expect(SUPPORT_EMAIL).toBeNull();
    const { container } = render(<ContactPage />);
    expect(screen.getByText(/still setting up our contact address/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open email app" })).toBeDisabled();
    expect(screen.getByLabelText("Message")).toBeDisabled();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.textContent).not.toMatch(/reply within|respond within|we usually reply/i);
    expect(container.textContent).toMatch(/Leave your lease out/);
  });

  it("opens a pre-filled draft once an address exists, and never claims it was sent", async () => {
    const user = userEvent.setup();
    render(<ContactForm supportEmail="help@example.com" />);

    expect(screen.getByRole("button", { name: "Open email app" })).toBeDisabled();
    await user.type(screen.getByLabelText("Name"), "Sam");
    await user.type(screen.getByLabelText("Message"), "Hello there");

    const action = screen.getByRole("link", { name: "Open email app" });
    expect(action.getAttribute("href")).toMatch(/^mailto:help@example\.com\?subject=Blueline%20Redline/);
    expect(action.getAttribute("href")).toContain("Hello%20there");

    action.addEventListener("click", (event) => event.preventDefault());
    await user.click(action);
    expect(screen.getByText(/isn't sent yet/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/message sent|thanks for your message/i);
  });

  it("warns and switches the action off when the message is too long", async () => {
    const user = userEvent.setup();
    render(<ContactForm supportEmail="help@example.com" />);
    await user.click(screen.getByLabelText("Message"));
    await user.paste("x".repeat(2000));
    expect(screen.getByRole("alert")).toHaveTextContent(/too long for an email link/);
    expect(screen.getByRole("button", { name: "Open email app" })).toBeDisabled();
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
