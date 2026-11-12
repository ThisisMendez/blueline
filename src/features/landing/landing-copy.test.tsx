import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BelowFold } from "./components/BelowFold";
import { BrandHero } from "./components/BrandHero";
import { FieldNotes } from "./components/FieldNotes";

// Layer 1 boundary: the landing page says Blueline reads the lease text and
// does not check it against local law, and never calls the checklist topics
// "protections", which reads as legal protection.
describe("landing page capability boundary", () => {
  it("says the review does not check the lease against local law", () => {
    render(<BrandHero />);
    expect(screen.getByText(/don't\s+check it against local law/)).toBeInTheDocument();
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
});
