# 09: Independent evaluator corpus

**What to build:** A held-out lease corpus, adjudicated independently of Blueline's own output, used to check flag quality before the product expands past lease signers. The corpus includes serious high-severity terms, clean leases, harmless-but-unusual wording, and incomplete packets. Every flag's source sentence is verified verbatim against the supplied text; a missed adjudicated high-severity term is visible as a miss, not averaged away; plausible false alarms are counted separately from unsupported claims (a flag with a source sentence that turned out to be a reasonable but mistaken read, versus a flag whose citation doesn't check out at all).

This is the evidence ADR 0012 requires before Blueline expands beyond lease signers — a useful-feeling review is not sufficient on its own.

**Blocked by:** 01, 03 (needs real flag output and real completeness-gating behavior, including incomplete-packet handling, to adjudicate against)

**Status:** tooling verified offline; blocked on independent corpus and adjudication

- [ ] A held-out corpus exists, independently adjudicated before any Blueline output is viewed
- [ ] Corpus includes: high-severity terms, clean leases, harmless odd wording, and incomplete packets
- [x] Every flag's source sentence is checked verbatim against the supplied document text as part of scoring
- [x] A missed high-severity term (per independent adjudication) is reported as a miss, not folded into an aggregate score
- [x] Plausible-but-later-judged-harmless flags are counted separately from flags with unsupported or non-matching citations
- [ ] Running the corpus produces a report suitable for a go/no-go call on expanding beyond lease signers

Evidence: 11 scorer/runner behavioral tests pass. `npm run eval` produces a pending prerequisite report (exit 2), with no model calls. No independently adjudicated held-out corpus or restricted execution environment was supplied. Do not treat implementation fixtures as independent evidence. See `evals/README.md` for intake, three-run scoring and required full-flow human checks. Retry count: 0; no dependent product tickets blocked.
