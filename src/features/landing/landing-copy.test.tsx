import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BelowFold } from "./components/BelowFold";
import { BrandHero } from "./components/BrandHero";
import { FieldNotes } from "./components/FieldNotes";

describe("landing page capability boundary", () => {
// Layer 1 boundary (ADR 0014): the hero says Blueline reads the lease text
// and does not check it against local law. The role choice (ADR 0015) is live.
  it("says the review does not check the lease against local law", () => {
    render(<BrandHero />);
    expect(screen.getByText(/don't\s+check it against local law/)).toBeInTheDocument();
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
