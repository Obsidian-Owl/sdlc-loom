# Setup

What you need to provide, up front, and exactly why. Nothing below blocks anything else in this repo from being built or reviewed — only from actually running against a live model.

## 1. A Model Studio API key (the one real gap)

Every envelope's default route is Qwen via Alibaba Cloud's [Qwen Token Plan](https://www.alibabacloud.com/en/campaign/ai-landing-page-token), a prepaid credit subscription accessed through an OpenAI-compatible API at [modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com).

- **Start on the Standard tier** ($18/mo, ~40,000 credits/month) to prove the pattern before considering Pro. This is your spend decision, not one this repo makes for you.
- A running promotion currently 2x's credit usage for **Qwen3.8-Max** and **DeepSeek-V4-Pro** specifically — both are bundled in the same credit pool, so one key plausibly covers dsh's native DeepSeek path too. Worth confirming against the console at signup time, since promotions change.
- Once you have a key: it needs to reach dsh through `dsh/host-patches/llm-pi-ai.cordis.yml` (a **plugin config row**, not a settings.yaml section as an earlier draft of this file said) plus a model-tier patch from `dsh/profiles/` — see `docs/model-routing.md` for the exact, live-verified shape. Both Qwen and GLM Coding Plan are confirmed working end-to-end as of 2026-09-18, real credentials, real responses.
- **Read `docs/model-routing.md`'s last section before relying on this in automation.** Model routing itself is solid; whether preset selection (the actual capability-boundary mechanism) reaches a headless/CI-triggered session is a separate, larger open question — check the linked issue's status.

## 2. Nothing else, for the panel script's Claude and Codex legs

Confirmed working on this machine as of this repo's first commit:
- `claude` (Claude Code CLI) — already authenticated via your existing subscription login.
- `codex` (Codex CLI) — already authenticated via ChatGPT.

Both ran for real during this repo's own build and verification. No action needed unless you're setting this up on a new machine, in which case: `claude` and `codex` each have their own `login` flow — run it once, interactively, per machine.

## 3. Optional, not assumed: live Codex or Qwen legs in GitHub Actions

Financial Fusion's `claude.yml`/`claude-code-review.yml` already carry `CLAUDE_CODE_OAUTH_TOKEN` as a repo secret — the escalation/judge path in a CI-triggered run can reuse that with no new secret. Routine Qwen-routed dispatch in CI needs a Model Studio secret added to the consuming repo's Actions settings; this is named here as a decision to make, not assumed or silently required.

## What you don't need to do anything about

- `dsh` itself installs and runs (`dsh --dump-config`, preset composition, the CLI surface) with **zero credentials**. That's how this repo's presets got tested before any key existed.
