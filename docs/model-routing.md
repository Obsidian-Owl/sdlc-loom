# Model routing

## The policy

| Envelope | Primary | Escalation |
|---|---|---|
| `research`, `design`, `plan` | Qwen3.8-Max (Model Studio) | Claude Code — explicit only, or as panel judge |
| `build` | Qwen3.6-Flash, conversational | not routed here by default |
| `verify`, `ship`, `operate` | Qwen3.6-Flash | not routed here by default |
| Panel (any envelope) | Qwen + DeepSeek (same credit pool, distinct families) | Claude — judge only, never also a panelist |

Codex stays available (confirmed authenticated and working) but isn't in the default set — this is a deliberate choice to keep spend concentrated on the Qwen Token Plan, not an oversight.

## Why Qwen, why this shape

Alibaba Cloud's Qwen Token Plan is a prepaid credit subscription (Standard: $18/mo, ~40k credits), spent per-token against a unified pool, via an OpenAI-compatible API. Economically it behaves like a subscription — flat monthly commitment, steep discount vs. raw pay-as-you-go. Mechanically it's still a metered credential, not the zero-marginal-cost OAuth pattern Claude Code and Codex use. Keeping that distinction clear matters: Qwen calls still draw down a finite pool, so a "cheap tier" choice within Qwen (3.6-Flash over 3.8-Max) still means something, in a way it wouldn't under a true flat-rate subscription.

Qwen3.8-Max ($2/$6 per M tokens in/out) is legitimately frontier-adjacent and well under Claude pricing — that's what makes it the default for the reasoning-heavy envelopes rather than a compromise. Claude is reserved for the cases where the stakes justify paying more: the hardest `design` go/kill calls, and panel judging specifically, where its being a different family from Qwen and DeepSeek is the point (see `panel-pattern.md`).

## Known gap — read before assuming this works end-to-end

This repo's `dsh/presets/*/agent.cordis.yml` files each declare an `agent-default-model` row pointing at `provider: pi-ai, model: qwen3.x-...`. Tested against dsh 0.1.5-rc.2 with a scratch `DSH_HOME` and no credentials:

- Every preset **composes correctly** — `dsh --profile headless --patch <preset>` runs all the way to a real model-call attempt with no composition error. This proves the YAML, the referenced packages, and the `agent-presets` roots mechanism all work.
- The model-call attempt **falls through to `deepseek-official`/`llm-deepseek`** (dsh's host-level default), not `pi-ai`, both before and after renaming the row's id to exactly match the host's own `agent-default-model` row.

This is expected in one sense — `dsh-llm-pi-ai` is documented as "mounted dormant: zero routes until a `llm-pi-ai:` settings section supplies provider profiles," and no such section exists without a real key. What's **not** confirmed is whether adding that settings section is sufficient on its own, or whether a preset-scoped override needs something more (a realm/isolate wrapper, a different row entirely, or a settings-level default rather than a preset-embedded one) to actually beat the host default. Nobody has been able to test this further without a Model Studio key — do that test before trusting this routing in production, and update this file with what you find.
