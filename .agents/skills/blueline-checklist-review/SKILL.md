---
name: blueline-checklist-review
description: Review a Blueline project document against the user's maintained review checklist, giving a pass or fail for every item. Use for requests to check or audit a document against that checklist. Read the current checklist each time; ordinary proofreading and lease-analysis evals use other workflows.
---

# Blueline checklist review

Review the document the user names against the checklist they maintain in this project. Look for `docs/review-checklist.md` by default; use another checklist path when the user specifies it. Read the checklist afresh for every review so changes to it take effect without editing this skill. If either file is missing, ask for its path or content and stop without issuing results.

Apply every checklist item and report **pass** or **fail** for each one, using the checklist's own criteria and terminology. A pass needs evidence from the document. If the evidence is missing or ambiguous, mark **fail** and state what would establish a pass. If an item is conditional and its condition does not apply, mark **pass** and explain that the condition is absent. Do not infer compliance from silence unless the checklist explicitly allows it.

For each item, include its checklist wording or identifier, result, short reason, and a precise document location or excerpt when available. Lead with a count of passed and failed items and the failures needing action. Suggest a concrete change for each failure. Keep optional editorial suggestions separate from checklist results. Review the document without changing it unless the user also requests edits.
