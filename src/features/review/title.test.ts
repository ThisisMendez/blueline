import { describe, expect, it } from "vitest";

import { loadFixture } from "~tests/fixtures/index";

import {
  DEFAULT_REVIEW_TITLE,
  generateReviewTitle,
  normaliseTypedTitle,
  readableFileName,
  titleFromLeaseText,
} from "./title";

describe("a title from the lease's own heading", () => {
  it("uses a clear heading at the top of the lease, in title case", () => {
    expect(generateReviewTitle({ text: loadFixture("adhesion-lease").text, fileName: "scan_0042.pdf" }))
      .toBe("Residential Lease Agreement");
    expect(titleFromLeaseText("\n\n  month-to-month rental agreement  \n\nThe tenant agrees..."))
      .toBe("Month-to-Month Rental Agreement");
    expect(titleFromLeaseText("CALIFORNIA RESIDENTIAL LEASE AGREEMENT:\nTerms follow."))
      .toBe("California Residential Lease Agreement");
  });

  it("skips a heading that carries an address, a name or a date rather than trimming it", () => {
    const text = [
      "Lease Agreement for 12 Elm Street, Apt 4",
      "Residential Lease between Dana Whitfield and Harrowgate LLC",
      "Lease dated March 1, 2027",
      "This lease is made between the parties named below.",
    ].join("\n");
    expect(titleFromLeaseText(text)).toBeNull();
    expect(generateReviewTitle({ text })).toBe(DEFAULT_REVIEW_TITLE);
  });

  it("doesn't treat an addendum or a sentence as the lease's title", () => {
    expect(titleFromLeaseText("PET ADDENDUM\n\nResidents may keep one cat.")).toBeNull();
    expect(titleFromLeaseText("The tenant shall pay rent on the first of the month.")).toBeNull();
  });
});

describe("the file name fallback", () => {
  it("uses a readable file name without .pdf when the lease has no clear heading", () => {
    const text = "This agreement is between the owner and the resident.";
    expect(generateReviewTitle({ text, fileName: "harrowgate-lease.pdf" })).toBe("harrowgate lease");
    expect(generateReviewTitle({ text, fileName: "Lease for spring.PDF" })).toBe("Lease for spring");
    expect(generateReviewTitle({ text, fileName: "renewal_terms_2027.pdf" })).toBe("renewal terms 2027");
  });

  it("refuses file names that look like contact details, addresses or account numbers", () => {
    for (const fileName of [
      "dana@example.com lease.pdf",
      "lease 555-201-3344.pdf",
      "12 Elm Street lease.pdf",
      "lease apt 4.pdf",
      "account 99812345.pdf",
    ]) {
      expect(readableFileName(fileName), fileName).toBeNull();
    }
  });

  it("refuses file names that say nothing", () => {
    expect(readableFileName("document.pdf")).toBeNull();
    expect(readableFileName("scan 0042.pdf")).toBeNull();
    expect(readableFileName("IMG_1234.pdf")).toBeNull();
    expect(readableFileName(".pdf")).toBeNull();
  });

  it("falls back to the default when neither source gives a usable title", () => {
    expect(generateReviewTitle({ text: "Rent is due monthly.", fileName: "document.pdf" })).toBe("Residential lease");
    expect(generateReviewTitle({ text: "Rent is due monthly." })).toBe("Residential lease");
  });

  it("keeps a long file name under the limit", () => {
    const title = readableFileName(`${"very long lease name ".repeat(10)}.pdf`)!;
    expect(title.length).toBeLessThanOrEqual(80);
    expect(title.startsWith("very long lease name")).toBe(true);
  });
});

describe("a name the signer types", () => {
  it("is trimmed and must be 1 to 80 characters", () => {
    expect(normaliseTypedTitle("  Spring   lease ")).toBe("Spring lease");
    expect(normaliseTypedTitle("   ")).toBeNull();
    expect(normaliseTypedTitle("x".repeat(80))).toBe("x".repeat(80));
    expect(normaliseTypedTitle("x".repeat(81))).toBeNull();
    expect(normaliseTypedTitle("bad\u0000name")).toBeNull();
  });
});
