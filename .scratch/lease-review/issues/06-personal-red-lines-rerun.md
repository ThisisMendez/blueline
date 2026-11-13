# 06: Personal red lines with rerun

**What to build:** After seeing the general review, a lease signer can set and edit personal red lines and rerun preference matching. The review keeps its selected role and severity. Matches for personal red lines appear separately from the role's risk flags. [Review-role acceptance criteria](../spec.md#acceptance-criteria).

**Blocked by:** 01 (red lines are edited and rerun against a general review that must already exist — ADR 0009: review comes before red lines)

**Status:** implemented and verified offline; deployed database/RLS and live match quality pending

- [x] Signer sees a useful general review before being asked for any personal red lines
- [x] Signer can add, edit, and rerun with personal red lines at any point after the general review
- [x] Rerunning produces preference matches, distinct from and shown separately from general risk flags
- [x] General risk flag severity is unchanged by the signer's red lines — only preference matches are added
- [x] Deterministic test: the same lease with and without red lines set produces identical general risk flags, and preference matches only appear once red lines are set

Evidence: real account-owned preference adapter and migration0003; routes require authenticated ownership of a completed review. Eleven new route/adapter/full-flow tests cover save/edit/clear/reload, unchanged general flags, source verification and auth isolation. Full suite 189 tests, typecheck and lint pass. Supabase boundary substitutes do not prove deployed RLS; no remote migration applied.
