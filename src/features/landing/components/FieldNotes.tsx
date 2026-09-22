const NOTES = [
  {
    term: "What this is",
    body: "A plain-English summary, ranked and cited risk flags, a coverage checklist, document-grounded answers, and a proposed edit for each flag.",
  },
  {
    term: "What this isn't",
    body: "A verdict on whether to sign, or legal advice. Blueline Redline reports what your document says and what could follow. It won't tell you the lease is safe to sign.",
  },
  {
    term: "What it reads",
    body: "Pasted text and PDFs with selectable text. Scans and photographs of pages are out: if a machine can't read the text reliably, we won't guess at it.",
  },
  {
    term: "What it covers",
    body: "Residential leases and renewals, and the documents they reference. Other agreement types aren't part of this version.",
  },
  {
    term: "What it keeps",
    body: "A finished review waits in your library, behind your sign-in, for 30 days. Save one and it stays 90 days from the day you saved it. The expiry date sits on the review, so you always know when it goes.",
  },
] as const;

export function FieldNotes() {
  return (
    <section className="border-y-2 border-[var(--color-navy)] bg-[var(--color-navy)] px-6 py-16 text-[var(--color-paper)] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold sm:text-3xl">
          How to read this guide
        </h2>
        <dl className="mt-8 grid gap-8 sm:grid-cols-2">
          {NOTES.map((note) => (
            <div key={note.term}>
              <dt className="font-[family-name:var(--font-data)] text-xs font-bold uppercase tracking-wide text-[var(--color-paper)]/70">
                {note.term}
              </dt>
              <dd className="mt-2 font-[family-name:var(--font-body)] text-base leading-relaxed">
                {note.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
