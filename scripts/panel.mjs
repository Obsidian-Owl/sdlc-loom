#!/usr/bin/env node
// sdlc-loom panel — fan out one prompt to N families, judge with a family
// none of the panelists used. Plain process orchestration: this needs no
// harness at all, dsh included, so it runs identically whether or not dsh
// is installed. See docs/panel-pattern.md.
//
// Default composition matches docs/model-routing.md: Qwen (primary) and
// DeepSeek (same Model Studio credit pool, distinct family) as panelists,
// Claude as judge-only. Codex stays available via --leg codex but is not
// part of the default set — see docs/model-routing.md for why.

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HOST_PATCH = join(__dirname, '..', 'dsh', 'host-patches', 'llm-pi-ai.cordis.yml')
const profilePatch = (envelope) => join(__dirname, '..', 'dsh', 'profiles', `${envelope}.cordis.yml`)

/** Run one CLI leg, returning {family, ok, text, error}. Never throws. */
function runLeg({ family, cmd, args }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (err += d))
    child.on('error', (e) => resolve({ family, ok: false, text: '', error: `spawn failed: ${e.message}` }))
    child.on('close', (code) => {
      if (code === 0) resolve({ family, ok: true, text: out.trim(), error: null })
      else resolve({ family, ok: false, text: '', error: err.trim() || `exit ${code}` })
    })
  })
}

const LEGS = {
  // Anthropic family — subscription (Max), one-shot via -p. Judge-only by default.
  claude: (prompt) => runLeg({ family: 'anthropic', cmd: 'claude', args: ['-p', prompt] }),

  // OpenAI family — subscription (ChatGPT), available but not in the default set.
  codex: (prompt) => runLeg({ family: 'openai', cmd: 'codex', args: ['exec', prompt] }),

  // Alibaba family — Model Studio / Qwen Token Plan, dsh-native, metered
  // against the prepaid credit pool. Requires DASHSCOPE_API_KEY — see
  // SETUP.md. Envelopes are dsh/profiles/*.cordis.yml patches, not presets
  // (presets never reach a headless-created agent — issue #7). `research` is
  // this leg's default since a panel run is inherently advisory, not a
  // default matched to whichever envelope invoked the panel — override via
  // the `envelope` option below when running from inside a different one.
  qwen: (prompt, envelope = 'research') =>
    runLeg({
      family: 'alibaba',
      cmd: 'dsh',
      args: ['--profile', 'headless', '--patch', HOST_PATCH, '--patch', profilePatch(envelope), prompt],
    }),

  // DeepSeek family — dsh's own native adapter (deepseek-official), needs
  // its own DEEPSEEK_API_KEY, separate from the Qwen/GLM keys. A running
  // Model Studio promotion suggests DeepSeek-V4-Pro may also be reachable
  // through the SAME dashscope route as qwen — not verified here, so this
  // leg uses the plain native default instead of an unverified assumption.
  deepseek: (prompt) =>
    runLeg({ family: 'deepseek', cmd: 'dsh', args: ['--profile', 'headless', prompt] }),
}

async function panel(prompt, { legs = ['qwen', 'deepseek'], judge = 'claude' } = {}) {
  if (legs.includes(judge)) {
    throw new Error(`judge "${judge}" cannot also be a panelist — see the anti-bias rule in docs/panel-pattern.md`)
  }

  const results = await Promise.all(legs.map((leg) => LEGS[leg](prompt)))

  const usable = results.filter((r) => r.ok)
  if (usable.length === 0) {
    return { results, judged: null, note: 'no panelist returned a usable result — nothing to judge' }
  }

  const judgePrompt = [
    `Panel verdicts for: ${prompt}`,
    '',
    ...usable.map((r) => `--- ${r.family} ---\n${r.text}`),
    '',
    'Adjudicate: where do these agree, where do they disagree, and what is the ' +
      'most defensible answer? Name which panelist you favor and why.',
  ].join('\n')

  const judged = await LEGS[judge](judgePrompt)
  return { results, judged }
}

// CLI entry: node panel.mjs "<prompt>" [--legs qwen,deepseek] [--judge claude]
async function main() {
  const args = process.argv.slice(2)
  const prompt = args.find((a) => !a.startsWith('--'))
  if (!prompt) {
    console.error('Usage: panel.mjs "<prompt>" [--legs qwen,deepseek,codex] [--judge claude]')
    process.exit(1)
  }
  const legsArg = args.find((a) => a.startsWith('--legs='))
  const judgeArg = args.find((a) => a.startsWith('--judge='))
  const legs = legsArg ? legsArg.split('=')[1].split(',') : undefined
  const judge = judgeArg ? judgeArg.split('=')[1] : undefined

  const { results, judged, note } = await panel(prompt, { legs, judge })

  for (const r of results) {
    console.log(`\n=== ${r.family} (${r.ok ? 'ok' : 'FAILED: ' + r.error}) ===`)
    if (r.ok) console.log(r.text)
  }
  if (note) {
    console.log(`\n${note}`)
  } else {
    console.log(`\n=== judge (${judged.ok ? 'ok' : 'FAILED: ' + judged.error}) ===`)
    if (judged.ok) console.log(judged.text)
  }
}

main()
