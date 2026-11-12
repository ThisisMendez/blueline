import { describe, expect, it } from "vitest";
import { loadFixture } from "~tests/fixtures/index";
import { createFixtureModelClient } from "~tests/support/fixture-model-client";
import { createQuestionRoute } from "./route";
import { QUESTION_SCHEMA_NAME } from "./contract";
import { ModelError, type ModelClient } from "@/features/analysis/model/client";

const lease = loadFixture("adhesion-lease");
const documents = [{ id: "lease", title: "Lease", text: lease.text }];
function post(question: string, packet = documents) {
  return new Request("http://localhost/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, documents: packet }) });
}

describe("questions about a complete agreement", () => {
  it("says not addressed for a question the agreement cannot answer", async () => {
    const response = await createQuestionRoute(createFixtureModelClient())(post(lease.sidecar.qa.unanswerable[0].question));
    expect(await response.json()).toEqual({ status: "not-addressed", needsLocalLaw: false });
  });

  it("blocks questions about an incomplete packet even if directly requested", async () => {
    const referenced = loadFixture("referencing-lease");
    const response = await createQuestionRoute(createFixtureModelClient())(post("What do I owe?", [{ id: "lease", title: "Lease", text: referenced.text }]));
    const result = await response.json();
    expect(result.status).toBe("blocked");
    expect(result.missing).toEqual(["Schedule of Resident Fees", "Pet Addendum"]);
    expect(result.citations).toBeUndefined();
  });

  it("answers no question about a packet that isn't a residential lease", async () => {
    const model = createFixtureModelClient({ agreement: { kind: "not-a-residential-lease", evidenceSentence: lease.sidecar.qa.answerable[0].expectedSourceSentence } });
    const response = await createQuestionRoute(model)(post(lease.sidecar.qa.answerable[0].question));
    expect(await response.json()).toEqual({ status: "out-of-scope" });
    expect(model.requests.filter((request) => request.schemaName === QUESTION_SCHEMA_NAME)).toHaveLength(0);
  });

  it("rejects a client claim that its packet is complete", async () => {
    const response = await createQuestionRoute(createFixtureModelClient())(new Request("http://localhost/api/questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documents, question: "What do I owe?", completeness: { kind: "complete" } }),
    }));
    expect(response.status).toBe(400);
  });

  it("does not turn a failed citation into a not-addressed result on retry", async () => {
    const fixture = createFixtureModelClient();
    let attempts = 0;
    const model: ModelClient = { async complete(request) {
      if (request.schemaName !== QUESTION_SCHEMA_NAME) return fixture.complete(request);
      return ++attempts === 1
        ? { status: "answered", needsLocalLaw: false, citations: [{ sourceDocumentId: "lease", sourceSentence: "Invented sentence." }] }
        : { status: "not-addressed", needsLocalLaw: false, citations: [] };
    } };
    const response = await createQuestionRoute(model)(post("What does this say?"));
    expect(await response.json()).toEqual({ status: "failed", reason: "verification-failed" });
  });

  it.each(["fabricated", "wrong-document", "outside-prose", "provider-error"])("withholds %s instead of displaying an answer", async (failure) => {
    const fixture = createFixtureModelClient();
    const model: ModelClient = {
      async complete(request) {
        if (request.schemaName !== QUESTION_SCHEMA_NAME) return fixture.complete(request);
        if (failure === "provider-error") throw new ModelError("rate-limited", "Provider rejected request");
        return {
          status: "answered",
          needsLocalLaw: false,
          citations: [{ sourceDocumentId: failure === "wrong-document" ? "another-lease" : "lease",
            sourceSentence: failure === "fabricated" ? "State law requires ten days notice." : lease.sidecar.qa.answerable[0].expectedSourceSentence }],
          ...(failure === "outside-prose" ? { answer: "State law overrides this clause." } : {}),
        };
      },
    };
    const response = await createQuestionRoute(model)(post(lease.sidecar.qa.answerable[0].question));
    const result = await response.json();
    expect(result).toEqual({ status: "failed", reason: failure === "provider-error" ? "rate-limited" : failure === "outside-prose" ? "unreadable" : "verification-failed" });
  });

  it("answers from a supplied addendum, not just the main lease", async () => {
    const referenced = loadFixture("referencing-lease");
    const fees = loadFixture("fee-schedule");
    const pets = loadFixture("pet-addendum");
    const sentence = fees.sidecar.plantedFlags[0].sourceSentence;
    const fixture = createFixtureModelClient();
    const model: ModelClient = { async complete(request) {
      return request.schemaName === QUESTION_SCHEMA_NAME
        ? { status: "answered", needsLocalLaw: false, citations: [{ sourceDocumentId: "fees", sourceSentence: sentence }] }
        : fixture.complete(request);
    } };
    const response = await createQuestionRoute(model)(post("What fee does the schedule charge?", [
      { id: "lease", title: "Lease", text: referenced.text },
      { id: "fees", title: "Schedule of Resident Fees", text: fees.text },
      { id: "pets", title: "Pet Addendum", text: pets.text },
    ]));
    const result = await response.json();
    expect(result.status).toBe("answered");
    expect(result.citations[0].sourceDocumentId).toBe("fees");
    expect(result.citations[0].sourceSentence).toBe(sentence);
  });

  it("answers using a verified source sentence from the agreement", async () => {
    const expected = lease.sidecar.qa.answerable[0];
    const response = await createQuestionRoute(createFixtureModelClient())(post(expected.question));
    const result = await response.json();
    expect(result.status).toBe("answered");
    expect(result.citations[0].sourceSentence).toBe(expected.expectedSourceSentence);
    expect(result.citations[0].sourceDocumentId).toBe("lease");
  });
});

describe("questions that turn on local law (ADR 0014)", () => {
  it("answers from the lease and marks the question as needing local law, even when the model doesn't", async () => {
    const question = "Is this late fee legal in New York?";
    const expected = lease.sidecar.qa.answerable[0].expectedSourceSentence;
    const fixture = createFixtureModelClient();
    const model: ModelClient = { async complete(request) {
      return request.schemaName === QUESTION_SCHEMA_NAME
        ? { status: "answered", needsLocalLaw: false, citations: [{ sourceDocumentId: "lease", sourceSentence: expected }] }
        : fixture.complete(request);
    } };
    const result = await (await createQuestionRoute(model)(post(question))).json();
    expect(result.status).toBe("answered");
    expect(result.needsLocalLaw).toBe(true);
    expect(result.citations[0].sourceSentence).toBe(expected);
    // Q&A has no prose field, so there is nowhere for a legal verdict to go.
    expect(Object.keys(result).sort()).toEqual(["citations", "needsLocalLaw", "status"]);
  });

  it("keeps the note on a legal question the lease doesn't address", async () => {
    const result = await (await createQuestionRoute(createFixtureModelClient())(post("Can my landlord legally keep my deposit for painting?"))).json();
    expect(result).toEqual({ status: "not-addressed", needsLocalLaw: true });
  });
});
