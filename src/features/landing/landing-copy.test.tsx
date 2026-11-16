import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { BelowFold } from "./components/BelowFold";
import { BrandHero } from "./components/BrandHero";
import { FieldNotes } from "./components/FieldNotes";
import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

describe("product branding", () => {
  it("shows the trademark in the homepage wordmark only", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { rerender } = render(<Nav />);
    expect(screen.getByRole("link", { name: "Blueline Lease home" })).toHaveTextContent("Blueline Lease™");

    vi.mocked(usePathname).mockReturnValue("/features");
    rerender(<Nav />);
    expect(screen.getByRole("link", { name: "Blueline Lease home" })).toHaveTextContent(/^Blueline Lease$/);
  });

  it("shows the copyright and links to the public terms and privacy pages", () => {
    render(<Footer />);
    expect(screen.getByText("© 2026 Blueline Lease")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });
});

describe("landing page capability boundary", () => {
// Layer 1 boundary (ADR 0014): the hero says Blueline reads the lease text
// and does not check it against local law. The role choice (ADR 0015) is live.
  it("says the review does not check the lease against local law", () => {
    render(<BrandHero />);
    expect(screen.getByText(/don't check your lease against local law/)).toBeInTheDocument();
  });

  it("asks the signer to choose renter or landlord", () => {
    render(<BrandHero />);
    expect(screen.getByText(/Choose renter or landlord/)).toBeInTheDocument();
  });

  it("lists a local-law check among what the product isn't", () => {
    render(<FieldNotes />);
    expect(screen.getByText(/a check against the law where you live/)).toBeInTheDocument();
  });

  it("calls the coverage checklist topics, not protections", () => {
    const { container } = render(<BelowFold />);
    const checklist = screen.getByRole("region", { name: "What We Check" });
    expect(checklist).toHaveTextContent(/six topics/);
    expect(checklist.querySelectorAll("li")).toHaveLength(6);
    expect(container.textContent).not.toMatch(/protections/);
  });

  // Questions about the agreement were removed from the product.
  it("no longer offers to answer questions about the document", () => {
    const below = render(<BelowFold />);
    expect(below.container.textContent).not.toMatch(/Ask the document/);
    const notes = render(<FieldNotes />);
    expect(notes.container.textContent).not.toMatch(/document-grounded answers/);
  });
});
