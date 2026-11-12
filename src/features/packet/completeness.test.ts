import { describe, expect, it } from "vitest";

import type { ModelClient } from "@/features/analysis/model/client";

import { checkCompleteness, type CompletenessCheck } from "./completeness";
import type { Packet } from "./types";

/**
 * Decision 3: the missing list names each required document once, under one
 * name, in the order the lease names it, and the same lease gives the same
 * list however the model words or orders its answer. Synthetic text only.
 */

const S = {
  rules: "The Resident shall comply with the Harbor View Resident Handbook and the Harbor View Parking Rules, which are incorporated by reference and made part of this Lease.",
  handbookAgain: "Move-out cleaning standards are set out in the Harbor View Handbook.",
  inspection: "The condition of the unit is recorded on the Move-In Inspection Report, which is Attachment No. 2 to this Lease.",
  pet: "The Pet Addendum, if any, is Attachment No. 3 to this Lease.",
  application: "Statements made in the Resident's rental application must be true.",
  list: "Attachment No. 2: Move-In Inspection Report",
};

const LEASE = [
  "Harbor View Apartments residential lease.",
  S.rules,
  S.handbookAgain,
  S.inspection,
  S.pet,
  S.application,
  "Required attachments:",
  S.list,
].join("\n");

const packet: Packet = { documents: [{ id: "pasted-lease", title: "Lease text you pasted", text: LEASE }] };

interface Reference {
  name: string;
  requirement: "required" | "conditional" | "mentioned";
  citingSentence: string;
  satisfiedByDocumentId?: string | null;
}

function modelAnswering(references: Reference[]): ModelClient & { calls: number } {
  return {
    calls: 0,
    async complete() {
      this.calls += 1;
      return {
        agreement: { kind: "residential-lease", description: "a residential lease", evidenceDocumentId: null, evidenceSentence: null },
        references: references.map((reference) => ({
          satisfiedByDocumentId: null,
          citingDocumentId: "pasted-lease",
          ...reference,
        })),
      };
    },
  };
}

function missingNames(result: CompletenessCheck): string[] {
  return result.kind === "incomplete" ? result.missing.map((item) => item.name) : [];
}

const EXPECTED = ["Harbor View Resident Handbook", "Harbor View Parking Rules", "Move-In Inspection Report"];

describe("the missing-document list", () => {
  it("lists each required document once, under one name, in the order the lease names them", async () => {
    const result = await checkCompleteness({
      packet,
      model: modelAnswering([
        { name: "Attachment No. 2: Move-In Inspection Report", requirement: "required", citingSentence: S.list },
        { name: "Harbor View Handbook", requirement: "required", citingSentence: S.handbookAgain },
        { name: "Move-In Inspection Report", requirement: "required", citingSentence: S.inspection },
        { name: "Harbor View Parking Rules", requirement: "required", citingSentence: S.rules },
        { name: "Harbor View Resident Handbook", requirement: "required", citingSentence: S.rules },
      ]),
    });
    expect(result.kind).toBe("incomplete");
    expect(missingNames(result)).toEqual(EXPECTED);
    if (result.kind !== "incomplete") return;
    // Grounded in the earliest requiring sentence, cut from the signer's text.
    expect(result.missing[0].citingSentence).toBe(S.rules);
    expect(LEASE.slice(result.missing[2].citingStart, result.missing[2].citingEnd)).toBe(S.inspection);
    expect(new Set(result.missing.map((item) => item.id)).size).toBe(3);
  });

  it("gives the same list for differently worded and ordered answers about the same lease", async () => {
    const first = await checkCompleteness({
      packet,
      model: modelAnswering([
        { name: "Harbor View Resident Handbook", requirement: "required", citingSentence: S.rules },
        { name: "Harbor View Parking Rules", requirement: "required", citingSentence: S.rules },
        { name: "Move-In Inspection Report", requirement: "required", citingSentence: S.inspection },
      ]),
    });
    const second = await checkCompleteness({
      packet,
      model: modelAnswering([
        { name: "Attachment No. 2: Move-In Inspection Report", requirement: "required", citingSentence: S.list },
        { name: "Harbor View Parking Rules", requirement: "required", citingSentence: S.rules },
        { name: "Harbor View Resident Handbook", requirement: "required", citingSentence: S.rules },
      ]),
    });
    expect(missingNames(first)).toEqual(EXPECTED);
    expect(missingNames(second)).toEqual(EXPECTED);
  });

  it("finds a requiring sentence quoted with straight quotes for the lease's curly ones, and shows the lease's own text", async () => {
    const curly = "The Resident’s Guide — Harbor View is incorporated into this Lease.";
    const lease: Packet = { documents: [{ id: "pasted-lease", title: "Lease", text: `Harbor View lease.\n${curly}` }] };
    const model = modelAnswering([
      { name: "Resident's Guide", requirement: "required", citingSentence: "The Resident's Guide - Harbor View is incorporated into this Lease." },
    ]);
    const result = await checkCompleteness({ packet: lease, model });
    expect(model.calls).toBe(1);
    expect(result.kind).toBe("incomplete");
    if (result.kind !== "incomplete") return;
    expect(result.missing[0].citingSentence).toBe(curly);
  });

  it("still treats a sentence that is not in the lease as unverified", async () => {
    const model = modelAnswering([
      { name: "Harbor View Resident Handbook", requirement: "required", citingSentence: "The Resident must read the Handbook twice." },
    ]);
    await expect(checkCompleteness({ packet, model })).resolves.toEqual({ kind: "unverified", unverifiedReferenceCount: 1 });
    expect(model.calls).toBe(2);
  });

  it("does not block on a conditional or merely mentioned document", async () => {
    const result = await checkCompleteness({
      packet,
      model: modelAnswering([
        { name: "Pet Addendum", requirement: "conditional", citingSentence: S.pet },
        { name: "rental application", requirement: "mentioned", citingSentence: S.application },
      ]),
    });
    expect(result).toEqual({ kind: "complete", matches: [], droppedReferenceCount: 0 });
  });

  it("does not ask the model again about a conditional document it misquoted", async () => {
    const model = modelAnswering([
      { name: "Pet Addendum", requirement: "conditional", citingSentence: "A sentence that is in no document." },
    ]);
    await expect(checkCompleteness({ packet, model })).resolves.toMatchObject({ kind: "complete" });
    expect(model.calls).toBe(1);
  });

  it("keeps a required document missing even when the model also lists it as conditional", async () => {
    const result = await checkCompleteness({
      packet,
      model: modelAnswering([
        { name: "Move-In Inspection Report", requirement: "required", citingSentence: S.inspection },
        { name: "Pet Addendum", requirement: "conditional", citingSentence: S.pet },
      ]),
    });
    expect(missingNames(result)).toEqual(["Move-In Inspection Report"]);
  });

  it("counts a document as supplied when the model matches any of its mentions", async () => {
    const withAddendum: Packet = {
      documents: [...packet.documents, { id: "supplied-2", title: "Inspection", text: "Move-In Inspection Report. Kitchen: good." }],
    };
    const result = await checkCompleteness({
      packet: withAddendum,
      model: modelAnswering([
        { name: "Move-In Inspection Report", requirement: "required", citingSentence: S.inspection, satisfiedByDocumentId: null },
        { name: "Attachment No. 2: Move-In Inspection Report", requirement: "required", citingSentence: S.list, satisfiedByDocumentId: "supplied-2" },
      ]),
    });
    expect(result.kind).toBe("complete");
    if (result.kind !== "complete") return;
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]).toMatchObject({ documentId: "supplied-2", matchedBy: "model" });
  });

  it("keeps the signer's answer when the next check cites a different sentence for the same document", async () => {
    const withReport: Packet = {
      documents: [...packet.documents, { id: "supplied-2", title: "My scan", text: "Unit condition notes." }],
    };
    const before = await checkCompleteness({
      packet: withReport,
      model: modelAnswering([{ name: "Move-In Inspection Report", requirement: "required", citingSentence: S.inspection }]),
    });
    if (before.kind !== "incomplete") throw new Error("expected the report to be missing");

    const after = await checkCompleteness({
      packet: withReport,
      model: modelAnswering([{ name: "Attachment No. 2: Move-In Inspection Report", requirement: "required", citingSentence: S.list }]),
      resolutions: [{ referenceId: before.missing[0].id, documentId: "supplied-2" }],
    });
    expect(after).toMatchObject({ kind: "complete", matches: [{ documentId: "supplied-2", matchedBy: "signer" }] });
  });

  it("does not apply the signer's answer for one document to another named in the same sentence", async () => {
    const references: Reference[] = [
      { name: "Harbor View Resident Handbook", requirement: "required", citingSentence: S.rules },
      { name: "Harbor View Parking Rules", requirement: "required", citingSentence: S.rules },
    ];
    const withRules: Packet = {
      documents: [...packet.documents, { id: "supplied-2", title: "Parking", text: "Harbor View Parking Rules." }],
    };
    const before = await checkCompleteness({ packet: withRules, model: modelAnswering(references) });
    if (before.kind !== "incomplete") throw new Error("expected both to be missing");
    const rules = before.missing.find((item) => item.name === "Harbor View Parking Rules");

    const after = await checkCompleteness({
      packet: withRules,
      model: modelAnswering(references),
      resolutions: [{ referenceId: rules!.id, documentId: "supplied-2" }],
    });
    expect(missingNames(after)).toEqual(["Harbor View Resident Handbook"]);
  });
});
