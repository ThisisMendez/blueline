import { describe, expect, it } from "vitest";

import {
  canonicalName,
  designations,
  displayBase,
  firstMention,
  formNumbers,
  groupSameDocuments,
  type IdentityInput,
} from "./reference-identity";

function ref(name: string, citingSentence = "", citingDocumentId = "lease"): IdentityInput {
  return { name, citingSentence, citingDocumentId };
}

function grouped(...names: (string | IdentityInput)[]): string[][] {
  const inputs = names.map((entry) => (typeof entry === "string" ? ref(entry) : entry));
  return groupSameDocuments(inputs).map((group) => group.map((index) => inputs[index].name));
}

describe("what counts as the same document", () => {
  it("merges a name with and without its attachment label", () => {
    expect(grouped("Attachment No. 2: Unit Inspection Report", "Unit Inspection Report")).toEqual([
      ["Attachment No. 2: Unit Inspection Report", "Unit Inspection Report"],
    ]);
  });

  it("merges names that share a form number, however the number is written", () => {
    expect(grouped(
      "Owner’s Certification of Income, form HUD–50059",
      "Owner's Certification of Income (form HUD-50059)",
      "Form HUD-50059",
    )).toHaveLength(1);
  });

  it("merges a short label with the full name that carries the same designation", () => {
    expect(grouped(
      "Attachment No. 1: Owner’s Certification of Income",
      ref("Owner’s Certification of Income", "The household is shown on the Owner’s Certification of Income, which is Attachment No. 1 to this Agreement."),
      "Attachment No. 1",
    )).toHaveLength(1);
  });

  it("does not merge the same designation from two different citing documents", () => {
    expect(grouped(ref("Exhibit A", "", "lease"), ref("Exhibit A", "", "addendum"))).toHaveLength(2);
  });

  it("merges names that differ only in &/and, case, possessives and filler words", () => {
    expect(grouped(
      "Graduate & Family Housing Resident Handbook",
      "Graduate and Family Housing Handbook",
      "graduate & family housing leaseholder handbook",
    )).toHaveLength(1);
    expect(grouped("Student Code of Conduct Policies and Procedures", "Student Code of Conduct")).toHaveLength(1);
  });

  it("merges a chain of ever longer names for one document", () => {
    expect(grouped(
      "Student Code of Conduct",
      "University Student Code of Conduct",
      "Ohio University Student Code of Conduct",
    )).toHaveLength(1);
  });

  it("keeps genuinely different documents apart", () => {
    expect(grouped(
      "House Rules",
      "Pet Rules",
      "Form HUD-91067 VAWA Lease Addendum",
      "RAD PBRA Model Lease Addendum",
      "Lead-based paint disclosure form",
    )).toHaveLength(5);
  });

  it("does not fold a move-out report into the inspection report it contains", () => {
    expect(grouped("Unit Inspection Report", "Move-Out Unit Inspection Report")).toHaveLength(2);
  });

  it("does not let a short name bridge two unrelated longer names", () => {
    expect(grouped(
      "Community Living Standards",
      "Riverside Community Living Standards Guide",
      "Northgate Campus Community Living Standards",
    )).toHaveLength(3);
  });

  it("does not take a designation from a sentence that lists several", () => {
    const list = "Attachment No. 1: Rent Certification Attachment No. 2: Unit Inspection Report";
    expect(grouped(ref("Unit Inspection Report", list), ref("Rent Certification", list))).toHaveLength(2);
  });

  it("gives the same groups whatever order the names arrive in", () => {
    const names = ["Unit Inspection Report", "Pet Rules", "Attachment No. 2: Unit Inspection Report"];
    expect(grouped(...names)).toEqual([["Unit Inspection Report", "Attachment No. 2: Unit Inspection Report"], ["Pet Rules"]]);
    expect(grouped(...[...names].reverse())).toEqual([["Attachment No. 2: Unit Inspection Report", "Unit Inspection Report"], ["Pet Rules"]]);
  });
});

describe("the name the signer sees", () => {
  it("drops the attachment label and brackets, and adds the form number in one format", () => {
    expect(canonicalName([
      "Attachment No. 1: Owner's Certification of Income, form HUD–50059",
      "Owner’s Certification of Income (Attachment No. 1)",
    ])).toBe("Owner’s Certification of Income (form HUD-50059)");
    expect(canonicalName(["Form HUD–91067 VAWA Lease Addendum"])).toBe("VAWA Lease Addendum (form HUD-91067)");
  });

  it("uses the fullest name in the group", () => {
    expect(canonicalName(["Graduate and Family Housing Handbook", "Graduate & Family Housing Resident Handbook"]))
      .toBe("Graduate & Family Housing Resident Handbook");
  });

  it("is the same whichever order the names come in", () => {
    const names = ["Student Code of Conduct", "Ohio University Student Code of Conduct", "University Student Code of Conduct"];
    expect(canonicalName(names)).toBe(canonicalName([...names].reverse()));
  });

  it("falls back to the label when nothing else names the document", () => {
    expect(canonicalName(["Attachment No. 4"])).toBe("Attachment No. 4");
    expect(canonicalName(["Form HUD-50059"])).toBe("Form HUD-50059");
  });
});

describe("the pieces of a name", () => {
  it("reads form numbers and designations", () => {
    expect(formNumbers("Owner’s Certification, form HUD–50059")).toEqual(["hud-50059"]);
    expect(formNumbers("Section 8 Housing Assistance Payments Contract")).toEqual([]);
    expect(designations("Attachment No. 3: VAWA Lease Addendum")).toEqual(["attachment:3"]);
    expect(designations("Exhibit B")).toEqual(["exhibit:B"]);
    expect(designations("Schedule a viewing with the Schedule of Fees")).toEqual([]);
  });

  it("cleans a display name without losing its words", () => {
    expect(displayBase("Attachment No. 4: House Rules (if any; or House Rules Addendum (if RAD))")).toBe("House Rules");
    expect(displayBase("Campus Use of University Facilities (CUUF) policy")).toBe("Campus Use of University Facilities policy");
  });

  it("finds where a name is first used, ignoring case, quotes, spacing and &/and", () => {
    const text = "Read the Graduate and Family\nHousing Handbook. The Owner's Rules apply.";
    expect(firstMention(text, "Graduate & Family Housing Handbook")).toBe(9);
    expect(firstMention(text, "Owner’s Rules")).toBe(text.indexOf("Owner"));
    expect(firstMention(text, "Pet Rules")).toBe(-1);
  });
});
