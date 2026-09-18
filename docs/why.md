# Why this shape

Specwright — a prior spec-driven-development tool built for the same purpose this repo serves — was retired after its state management became overengineered and its skills stopped being effective. What was actually on disk when it was retired: 27 skills across two namespaces plus separate `protocols/` and `agents/` trees, a git-state model with its own targets/freshness/reconciliation semantics, and roughly 800KB of accumulated research and learnings per repo that only the tool itself could read back.

None of those numbers are damning alone. What made them add up to failure: every one was **bespoke** — state the tool invented that nothing else in the toolchain reads, writes, or backs up. A skill going stale is a maintenance cost; twenty-seven skills going stale, on top of a bespoke git-state model, on top of half a megabyte of tool-only notes per repo, is a second codebase maintained instead of the one meant to ship.

Two rules follow directly, and they're not aspirational — they're checked against real projects, not asserted:

**State lives only in things that already exist and that a human can read without this repo.** Every envelope's `artifactPattern` points at a plain markdown file in the consuming project's own docs convention — for Financial Fusion specifically, that convention (`docs/superpowers/{plans,specs}/YYYY-MM-DD-slug.md`) already existed, dated and git-tracked, before this repo did. `plan`'s entire output is GitHub issues. Nothing here invents a parallel store.

**Skill content is adopted, not authored.** `envelopes/*.yml` point at real files in `bmad-code-org/BMAD-METHOD` and `github/spec-kit` — repositories with tens of thousands of stars and daily commits — rather than competing hand-written equivalents. The same project that retired Specwright turned out to already be running obra/superpowers for its build discipline, independently, before this repo existed to recommend it. That's not a coincidence to force; it's confirmation the rule works before this repo had to argue for it.

The corollary, worth stating because it's easy to violate by accident: BMAD-METHOD can be run as a complete methodology — its own personas, its own full ceremony end to end. Doing that here would be Specwright's shape again, with someone else's name on it and a bigger star count. Take the skill whose gap you actually have; ignore the rest.
