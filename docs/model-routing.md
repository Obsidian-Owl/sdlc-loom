# Model routing

## The policy

| Envelope | Primary | Escalation |
|---|---|---|
| `research`, `design`, `plan` | Qwen3.8-Max (Model Studio) | Claude Code — explicit only, or as panel judge |
| `build` | Qwen3.6-Flash, conversational | not routed here by default |
| `verify`, `ship`, `operate` | Qwen3.6-Flash | not routed here by default |
| Panel (any envelope) | Qwen + DeepSeek/GLM (distinct families) | Claude — judge only, never also a panelist |

GLM Coding Plan (Zhipu/Z.ai) is verified as a second, equally-usable Category-A route — see below. Codex stays available (confirmed authenticated) but isn't in the default set.

## Verified live, 2026-09-18 — both routes, real credentials, real responses

Both Qwen (via Alibaba Cloud's Model Studio) and GLM (via Zhipu's Coding Plan) were wired and tested with real API keys through `dsh 0.1.5-rc.2`. Both returned genuine model output, correctly self-identifying:

- Qwen3.6-Flash: *"I'm a coding agent powered by the Qwen 3.6 Flash model, which was developed by Alibaba Group."*
- GLM-5.2: *"I'm powered by the GLM model (glm-5.2), made by Z.ai."*

### The actual mechanism, corrected from the first pass

`dsh-llm-pi-ai` ships mounted in the base composition with **no config at all** — zero routes, fully dormant. A host-plane patch feeds it real ones:

```yaml
- id: llm-pi-ai
  name: '@deepseek-ai/dsh-llm-pi-ai'
  config:
    providers:
      dashscope:                 # <- this key IS the provider identifier
        apiKeyEnv: DASHSCOPE_API_KEY
        baseURL: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
        api: openai-completions
        models: [{id: qwen3.8-max}, {id: qwen3.6-flash}]
      zhipu:
        apiKeyEnv: ZAI_CODING_API_KEY
        # the Coding Plan uses /api/coding/paas/v4 — NOT /api/paas/v4,
        # which is the separate pay-as-you-go path
        baseURL: https://api.z.ai/api/coding/paas/v4
        api: openai-completions
        models: [{id: glm-5.2}, {id: glm-4.5-air}]
```

Two corrections from the version of this file shipped in the first commit, both found by testing against real credentials rather than trusting the documented shape:

1. **The provider identifier is the route key** (`dashscope`, `zhipu`) — never the literal string `pi-ai`. Using `provider: pi-ai` composes without error and fails at request time with `NO_ADAPTER: no adapter registered for provider "pi-ai"`. `pi-ai` names the adapter package; each entry under `providers:` registers as its own distinct provider.
2. **`agent-default-model` is a host-plane singleton, not a preset concern.** A copy of that row placed inside a preset's own `agent.cordis.yml` composes cleanly (`--dump-config` shows it, no error) but is **silently inert** — the actual model call still falls through to the host default. It only takes effect set at the root, alongside `llm-pi-ai` and `agent-presets`. See `dsh/host-patches/llm-pi-ai.cordis.yml` + `dsh/profiles/{frontier,cheap}.cordis.yml` for the corrected, verified shape — model *tier* is a profile-level patch, stacked alongside whichever preset you select, not something a preset declares for itself.

## A bigger, unresolved finding — read before trusting preset selection in automation

While verifying the above, `--profile headless` with `agent-presets.default: design` set was tested with a prompt designed to surface the `design` preset's specific persona text. **The response showed the standard/generic persona and the full standard tool catalog, not the design preset's restricted read-only tools or its "you decide whether to build this, not how" instruction.** `--dump-config` reports the composition as valid in both cases — that check only proves the YAML parses and referenced packages resolve, *not* that the runtime selects it for a headless-created agent.

This was not chased further — it needs dsh source-level investigation beyond what's verified here. But it matters more than the routing bug above: **the entire premise of section 09's envelopes — that a `research` session physically cannot write code because no write tool is mounted — has only been confirmed for `--dump-config`'s composition check, not for an actual running headless/CI-triggered session.** If preset selection doesn't reach headless-created agents, the orchestration layer in `docs/panel-pattern.md` and the whole `claude.yml` label-dispatch pattern in the Financial Fusion PR would currently run every triggered session on the standard, unrestricted preset regardless of which `loom:<envelope>` label fired it — silently defeating the capability-boundary design, not obviously failing.

Filed as a new, higher-priority issue — check its status before relying on preset-based capability boundaries for anything automated.
