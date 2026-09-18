# Setup

What you need to provide, up front, and exactly why. Nothing below blocks anything else in this repo from being built or reviewed — only from actually running against a live model.

## 1. A Model Studio API key (the one real gap)

Every envelope's default route is Qwen via Alibaba Cloud's [Qwen Token Plan](https://www.alibabacloud.com/en/campaign/ai-landing-page-token), a prepaid credit subscription accessed through an OpenAI-compatible API at [modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com).

- **Start on the Standard tier** ($18/mo, ~40,000 credits/month) to prove the pattern before considering Pro. This is your spend decision, not one this repo makes for you.
- A running promotion currently 2x's credit usage for **Qwen3.8-Max** and **DeepSeek-V4-Pro** specifically — both are bundled in the same credit pool, so one key plausibly covers dsh's native DeepSeek path too. Worth confirming against the console at signup time, since promotions change.
- Once you have a key: it needs to reach dsh through a `llm-pi-ai:` section in `$DSH_HOME/settings.yaml` (dsh's multi-provider adapter, mounted dormant until you supply provider profiles). **This repo's preset files declare the intended route (`provider: pi-ai, model: qwen3.8-max` etc.) but the actual override was not confirmed to take effect against the host default in dsh 0.1.5-rc.2 — see the known gap in `docs/model-routing.md` before assuming this works end-to-end.** Confirm with `dsh --profile <x> --dump-config` and a real headless run once you have the key.

## 2. Nothing else, for the panel script's Claude and Codex legs

Confirmed working on this machine as of this repo's first commit:
- `claude` (Claude Code CLI) — already authenticated via your existing subscription login.
- `codex` (Codex CLI) — already authenticated via ChatGPT.

Both ran for real during this repo's own build and verification. No action needed unless you're setting this up on a new machine, in which case: `claude` and `codex` each have their own `login` flow — run it once, interactively, per machine.

## 3. Optional, not assumed: live Codex or Qwen legs in GitHub Actions

Financial Fusion's `claude.yml`/`claude-code-review.yml` already carry `CLAUDE_CODE_OAUTH_TOKEN` as a repo secret — the escalation/judge path in a CI-triggered run can reuse that with no new secret. Routine Qwen-routed dispatch in CI needs a Model Studio secret added to the consuming repo's Actions settings; this is named here as a decision to make, not assumed or silently required.

## What you don't need to do anything about

- `dsh` itself installs and runs (`dsh --dump-config`, preset composition, the CLI surface) with **zero credentials**. That's how this repo's presets got tested before any key existed.
