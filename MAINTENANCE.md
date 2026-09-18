# Maintenance

This repo is small on purpose. Keeping it correct is cheaper than most maintenance because there's little of it — but the little there is has real owners and a real cadence, not "someone will notice eventually."

## Vendored skill references (`envelopes/*.yml` → `skills:`)

Each entry names an upstream `{source, ref, skillPath}` — a pointer, not a copy. Drift happens when the upstream file moves, renames, or changes shape.

- **Cadence:** check before each `design`/`plan`/`research` envelope gets meaningfully more use, not on a fixed calendar — these are low-traffic files upstream (BMAD/spec-kit skill directories don't reshuffle often).
- **How:** `curl` the `skillPath` against the pinned `ref`; a 404 or a frontmatter shape change is the signal. There's no automated hash-check yet (see "Deferred" below) — `.github/workflows/validate.yml` checks the YAML schema, not upstream liveness.
- **Owner:** whoever is actively using the envelope that broke. There's no dedicated maintainer role for a repo this size.

## dsh preset files (`dsh/presets/*/agent.cordis.yml`)

- Every package name referenced (`dsh-persona`, `dsh-tool-fs-search`, `dsh-tool-web`, etc.) is pinned against dsh 0.1.5-rc.2's actual shipped composition, verified with `dsh --dump-config` against a scratch profile — not guessed.
- **When dsh cuts a new version:** re-run the same `--dump-config` smoke test in `.github/workflows/validate.yml` against the new version before assuming these still compose. dsh is a developer preview; its own README warns of compatibility-breaking changes.
- **The known model-routing gap in `docs/model-routing.md`** is the highest-priority thing to resolve here — update that file the moment someone tests it with a real Model Studio key, whichever way it goes.

## Qwen model catalog

Alibaba revs Qwen model names and pricing (this repo was written against Qwen3.8-Max/3.6-Flash; Alibaba's own numbering has moved before). Check `docs/model-routing.md`'s pricing table against the current Model Studio console before assuming it's still accurate — model names in the `envelopes/*.yml` `modelPolicy` fields are the ones that actually matter operationally.

## Deferred (filed as issues, not silent)

- A real `sdlc-loom vendor` CLI to replace the manual clone-and-record step, including automated hash-drift checking for vendored skills.
- SSH remote-world wiring for `verify`/`operate`.
- `loom-panel` wired live into CI rather than run by hand.
- Floe and Proof adapters.

Check open issues on this repo before assuming any of the above is still undone — this file is a snapshot, the issue tracker is current.
