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

  // Alibaba family — Model Studio / Qwen Token Plan, dsh-native, metered against
  // the prepaid credit pool. Requires a Model Studio credential — see SETUP.md.
  // NOTE, confirmed against dsh 0.1.5-rc.2: `--profile headless` has no
  // `--preset` flag. Preset selection is a profile/settings concern, not a CLI
  // argument, in this dsh version — point `--profile` at a profile whose
  // agent-presets `default:` is already `research` (or whichever envelope
  // this panel run is for) rather than passing one here.
  qwen: (prompt) => runLeg({ family: 'alibaba', cmd: 'dsh', args: ['--profile', 'headless', prompt] }),

  // DeepSeek family — same Model Studio credit pool as qwen (per the current
  // promotion bundling DeepSeek-V4-Pro), distinct family for panel purposes.
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
