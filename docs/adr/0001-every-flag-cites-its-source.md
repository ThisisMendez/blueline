# 0001. Every flag cites its source

## Decision

Every risk flag Blueline produces carries the exact sentence from the uploaded
document it came from, shown next to the flag. A flag whose source sentence
cannot be shown does not ship: it is a bug, not a formatting preference.

## Alternatives

- Let the model describe each risk in its own words, quoting nothing. Fluent
  and cheaper to build, but a correct flag and an invented one read exactly
  the same, and the reader has no way to tell which is which.
- Cite the clause or section number instead of the sentence. Sends the reader
  hunting through their own document, and numbering is inconsistent across
  contracts, leases, and terms of service.
- Attach a confidence score instead of a source. A number about the model is
  not evidence about the document.

## Why

A reader can take any flag, find that sentence in their own copy, read what
surrounds it, and judge the severity themselves. They can catch a flag that
misread the document without knowing anything about how the analysis works.
Disagreement moves from "do I trust this tool" to "do I read this clause the
same way" — a question they are equipped to settle.

## Consequences

- OCR for scanned documents stays out. A citation is worthless when the text
  it points at was misread.
- The browser parse must keep each sentence locatable in the stored text, so
  a flag can be traced back after the fact.
- When the model returns a risk it cannot tie to a sentence, the pipeline
  drops or retries it rather than shipping the flag without its quote.
- Tests get a mechanical check: every quoted sentence must appear verbatim in
  the stored text. Pass or fail, no judgment call.
- Risks that come from an absence — no liability cap, no termination clause —
  have no sentence to quote, and need their own decision.
