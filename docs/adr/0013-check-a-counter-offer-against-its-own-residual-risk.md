# 0013. Check a counter-offer against its own residual risk

## Decision

Before a review is returned, a second model call checks every risk flag's
drafted counter-offer against its own residual-risk statement. A residual-risk
claim the check cannot confirm is replaced with an honest placeholder; the
counter-offer itself is still shown, and the flag is never withheld or the
review failed over this. A call failure — the check itself could not run —
fails the review, the same as any other model call in this pipeline.

## Alternatives

- Do nothing beyond prompting. Cheapest, and the direct fix for why the model
  got it wrong, but unenforced — exactly the shape of bug this decision exists
  to stop shipping.
- A deterministic text-similarity check between the residual-risk statement
  and the original clause. Free and fast, but the incident this responds to
  was a paraphrase: the residual-risk text didn't reuse the original clause's
  wording, it just repeated its substance in different words. A lexical check
  would have passed the exact case it needed to catch.
- Treat an inconsistency the way an unverifiable citation is treated: fail the
  whole review. Wrong category of problem. Citation verification checks a
  fact against the signer's own document. This checks whether two pieces of
  the model's own generated text agree with each other — a second model's
  opinion, not a ground truth — and failing a whole review over one model's
  doubt about another model's paragraph is a disproportionate response to a
  fuzzy signal.

## Why

A signer who opens a counter-offer's residual risk is reading the one part of
the review meant to tell them what a compromise would still cost them. If that
statement quietly assumes the compromise didn't happen, it is wrong in the
specific way this product cannot be wrong about: confident text describing a
lease term to someone deciding whether to sign, that isn't actually true of
what they'd be signing. Catching that mechanically, rather than hoping better
wording holds every time, is what "the product can catch on its own" means
for a defect that lives inside two fields the model writes independently.

## Consequences

- Every review with at least one risk flag now costs one more model call.
  Clean reviews and blocked packets are unaffected — there is nothing to check.
- The check is a second model's judgment, not a fact. It can be wrong in
  either direction: it may pass a genuine inconsistency, or flag a residual
  risk that was actually fine. Neither failure mode is silent — a false pass
  ships an unverified claim (the same exposure as before this decision), and
  a false flag only costs a placeholder sentence, not a wrong one.
- Tests get the same fixture-consistency assumption the rest of the corpus
  relies on: hand-written fixture pairs are trusted as consistent unless a
  test explicitly marks one otherwise, so the offline suite exercises the
  wiring without asserting the check is semantically perfect.
- This is not the independent adjudication ADR 0012 requires before expanding
  past lease signers. It is the product checking its own output with the same
  kind of model that produced it — real, but not a substitute for the
  held-out corpus.
