<title>sdlc-loom</title>

# sdlc-loom

A harness-agnostic definition of the full software delivery lifecycle — not just build and fix — as seven **envelopes**, each a real capability boundary with its own model-routing policy and content sourced from real, actively-maintained upstream projects.

## The two rules everything else follows

1. **State lives in things that already exist and that a human can read without this repo** — git history, GitHub issues and PRs, a markdown file in your project. Never a directory only a tool understands.
2. **Skill content is adopted, not authored**, wherever something with real maintainers already covers the ground. This repo does not vendor BMAD-METHOD's or superpowers' text — it points at their real files (`envelopes/*.yml`, `skills:` field) and lets you fetch them.

Both rules exist because the alternative — a bespoke methodology with its own state model and its own hand-rolled skills — is exactly what got retired before this repo was written. See `docs/why.md`.

## The seven envelopes

| Envelope | Shape | What it is |
|---|---|---|
| `research` | open-ended, killable | No fixed deliverable; success is a cheap, honest answer |
| `design` | open-ended, killable | Architecture/spike decisions; ends in an explicit go/kill |
| `plan` | decomposition | Turns an approved design into dependency-ordered GitHub issues |
| `build` | gated-linear | Defers to your project's own build discipline (e.g. obra/superpowers) |
| `verify` | gated-linear | Read-only, runs your real gate commands, ideally against a live environment |
| `ship` | gated-linear | Git/gh only, approval-gated |
| `operate` | continuous-reactive | Read-only production observation, externally triggered |

Full definitions: `envelopes/*.yml`. dsh reference implementations: `dsh/profiles/*.cordis.yml` — one complete host-plane patch per envelope (persona, tool boundary, model route, skill root). Not presets: `dsh-agent-presets` never reaches a headless-created agent, confirmed live and tracked as [issue #7](https://github.com/Obsidian-Owl/sdlc-loom/issues/7) — see `docs/model-routing.md` for the full story.

## Quickstart

1. Read `SETUP.md` first — it names exactly what credential/access you need and why, before you touch anything else.
2. Copy `sdlc-loom.config.example.yml` into your repo as `sdlc-loom.config.yml` and set `artifactsRoot` to wherever your project already keeps planning docs.
3. Vendor the skills an envelope needs (see each `envelopes/*.yml`'s `skills:` list) — a `git clone` and a copy, recorded in your own lockfile. There's no installer CLI yet; see `MAINTENANCE.md`.
4. For the panel pattern (multiple models on one hard decision, judged by an unused family): `node scripts/panel.mjs "<prompt>"`. Works with or without dsh.

## Model routing

Qwen (Alibaba Cloud Token Plan, via Model Studio) is the default for every envelope. Claude is reserved for explicit escalation and as panel judge — never a default route. Full rationale and a known gap in the current dsh integration: `docs/model-routing.md`.

## What this is not

Not a workflow engine, not a state machine, not a fork of BMAD or superpowers. It's small on purpose.

## License

MIT — see `LICENSE`.
