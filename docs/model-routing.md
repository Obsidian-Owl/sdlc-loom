# Model routing

## The policy

| Envelope | Primary | Escalation |
|---|---|---|
| `research`, `design`, `plan` | Qwen3.8-Max (Model Studio) | Claude Code — explicit only, or as panel judge |
| `build` | Qwen3.6-Flash, conversational | not routed here by default |
| `verify`, `ship`, `operate` | Qwen3.6-Flash | not routed here by default |
| Panel (any envelope) | Qwen + DeepSeek (distinct families, though the DeepSeek leg uses dsh's native adapter, not confirmed to share Qwen's credit pool — see `scripts/panel.mjs`) | Claude — judge only, never also a panelist |

GLM Coding Plan (Zhipu/Z.ai) is a verified, equally-usable Category-A alternate to Qwen — swap the `dashscope` route key for `zhipu` anywhere in `dsh/profiles/*.cordis.yml`, same shape. Codex stays available (confirmed authenticated) but isn't in the default set.

## Why Qwen (or GLM), why this shape

Alibaba Cloud's Qwen Token Plan and Zhipu's GLM Coding Plan are both prepaid credit subscriptions, spent per-token against a unified pool, via an OpenAI-compatible API. Economically they behave like a subscription — flat monthly commitment, steep discount vs. raw pay-as-you-go. Mechanically they're still metered credentials, not the zero-marginal-cost OAuth pattern Claude Code and Codex use. Qwen3.8-Max ($2/$6 per M tokens) and GLM-5.2 ($1.40/$4.40) are both legitimately frontier-adjacent and well under Claude pricing — that's what makes either the default for reasoning-heavy envelopes rather than a compromise. Claude is reserved for the hardest `design` go/kill calls and panel judging, where being a different family is the point (see `panel-pattern.md`).

## The mechanism — verified live, 2026-09-18, real credentials

`dsh-llm-pi-ai` ships in the base composition with **no config at all** — zero routes, fully dormant. `dsh/host-patches/llm-pi-ai.cordis.yml` feeds it real ones. Two corrections, both found by testing against real credentials rather than trusting the documented shape:

1. **The provider identifier is the `providers:` route key** (`dashscope`, `zhipu`) — never the literal string `pi-ai`, which only names the adapter package and fails at request time with `NO_ADAPTER`.
2. **`agent-default-model` only takes effect set at the host/profile-patch level.** A copy inside a preset's own composition composes cleanly but is silently inert.

Both Qwen and GLM were confirmed with real live calls, correctly self-identifying:
- Qwen3.6-Flash: *"I'm a coding agent powered by the Qwen 3.6 Flash model, which was developed by Alibaba Group."*
- GLM-5.2: *"I'm powered by the GLM model (glm-5.2), made by Z.ai."*

## Resolved: presets never reach a headless-created agent — profiles replaced them

Finding #2 above led to a bigger discovery, tracked and closed as [issue #7](https://github.com/Obsidian-Owl/sdlc-loom/issues/7): `dsh --profile headless` was built as a deliberate "direct core entry point" (see the harness's own 2026-08-09 architecture decision) specifically to avoid entangling one-shot task execution with Web/Host/browser infrastructure — and `dsh-agent-presets` was never part of that decision. The harness's own source confirms it in a comment: *"This bundle composes no preset roster."* `headless-runner` creates its agent with a direct `agents.create()` call that has no preset parameter at all.

**This repo no longer uses presets.** `dsh/presets/` is gone; `dsh/profiles/*.cordis.yml` replaced it — one complete host-plane patch per envelope (persona, tool capability boundary, model route, skill root), using only mechanisms confirmed live to reach a headless-created agent. This is more files than the preset approach, but every line of it rests on ground already tested, not on the one path just shown not to work.

**A second, related bug found the same way, also now fixed:** disabling `tool-fs` to make an envelope "read-only" doesn't work either — it removes `read` along with `write` (confirmed: they're one package). The correct mechanism, also verified live with a real denied-write-then-unchanged-file test, is `sandbox-policy.mode: read-only`. This governs every file effect for the process, including ones a shell command would cause, not just a dedicated tool — which is a stronger guarantee than tool-hiding would have been anyway.

## Honest limits, stated rather than glossed over

- **`ship`'s "approval before every write" claim was tested and found false.** An ordinary bash write under `workspace-write` mode succeeded immediately, no prompt. The real safety net for `ship` is downstream of dsh entirely — its output is a branch + PR, and human review happens there, not in-session. `dsh/profiles/ship.cordis.yml`'s persona says this honestly now.
- **`ship`'s "git/gh only" is a persona convention past the missing edit tool, not a hard boundary** — bash under `workspace-write` can mutate arbitrary files by construction.
- **GitHub issue creation for the `plan` envelope needs an MCP client mount** for GitHub's official MCP server — the one piece of this repo not verified against dsh's actual MCP-client config schema.
- **`customSkillDirs` (skill vendoring) is checked against the real config schema but not live-tested with an actual skill file** the way the persona/model/sandbox mechanisms above were.
