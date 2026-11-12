import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BelowFold } from "./components/BelowFold";
import { BrandHero } from "./components/BrandHero";
import { FieldNotes } from "./components/FieldNotes";

describe("landing page capability boundary", () => {
  it("describes the lease review in terms of possible costs", () => {
    render(<BrandHero />);
    expect(screen.getByText("We read your lease and show what it could cost you.")).toBeInTheDocument();
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
