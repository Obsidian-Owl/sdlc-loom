# The panel pattern

Fan out one prompt to N models from different vendor families, collect their answers, and have a judge from a family that wasn't a panelist adjudicate. The anti-bias rule this encodes — never judge with the same family as any panelist — isn't invented here; it's a rule already in production use for LLM-as-judge testing on another project, applied to review instead of testing.

## Why a plain script, not a dsh workflow

dsh's own `dsh-workflow` package (`agent()`, `parallel()`, `pipeline()`) can express this exact pattern, and its documentation is explicit that the scripting vocabulary matches Claude Code's dynamic-workflows shape. But making the pattern a plain Node script that shells out to each CLI (`claude`, `codex`, `dsh`) keeps it genuinely harness-agnostic — it runs identically whether or not dsh is installed, which matters for a repo whose whole premise is not depending on one harness. `scripts/panel.mjs` is that script; dsh's workflow engine is one optional richer orchestrator for the same idea, not the only way to run it.

## Verified, not theoretical

This exact mechanism — spawn two CLI processes in different families, collect output, feed both to a third family as judge — ran for real during this repo's own build: Codex (OpenAI family) as the panelist, Claude (Anthropic family) as judge, on a real prompt, producing a real adjudication that correctly noticed it only had one panelist to compare and critiqued the answer on its merits. The default composition (Qwen + DeepSeek panelists, Claude judge) uses the same code path; it's gated only on the Model Studio credential in `SETUP.md`, not on anything about the mechanism itself.

## Using it

```bash
node scripts/panel.mjs "<prompt>"                        # default: qwen+deepseek panelists, claude judges
node scripts/panel.mjs "<prompt>" --legs=codex,claude --judge=... # any family combination, judge excluded from legs
```

The script refuses to run if the judge is also listed as a panelist — that's not a suggestion, it throws.

## When to reach for this

Not every `design` decision needs a panel — most don't, and running three model calls for a routine choice is waste. Reach for it when a wrong call is expensive to discover later: an architecture decision that's costly to reverse, a go/kill call on a spike where you don't fully trust your own read, a security-relevant judgment. The single-model `design` envelope is the default; the panel is the escalation.
