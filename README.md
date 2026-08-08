# Discovery AI Index

[Discovery AI Index](https://discovery-index.alexreeder.chatgpt.site) is an evidence-first catalog of
discoveries materially enabled by AI. It explains what changed, why the result matters, how AI
contributed, and the strongest evidence available.

This repository is the public source for the application, data model, tests, and editorial rules.
It is intentionally **not** a self-editing website.

## Safety model

The application has two separate paths:

1. A daily scanner can search approved sources and add or refresh **private candidates** in D1.
2. A separately authenticated Luna Max automation can assess candidates and move structured records
   through the same evidence and transition rules as an editor.
3. A human editor remains available as an override; neither automation path can edit application
   code, schema, taxonomy, thresholds, or deployment configuration.

The scanner cannot publish a record, change a public status, delete a record, edit this repository,
deploy the site, alter the schema or taxonomy, or change editorial thresholds. The scheduled
GitHub workflow has no repository permissions and holds only the candidate-intake token.

```text
Daily GitHub trigger
        |
        v
Protected intake endpoint -> bounded source scan -> private D1 candidates + run log
                                                        |
                                                        v
                                      authenticated editorial review
                                                        |
                                                        v
                                          under review / verified registry
```

## Architecture

- React and Vite render the public interface.
- A Codex Sites Worker serves the application and API.
- D1 is the canonical structured registry and audit store.
- SQL migrations define the schema and founding seed records.
- GitHub Actions validates pull requests and triggers the candidate-only daily scan.
- Codex Sites remains the deployment transport; a D1 data change does not require a rebuild.

The scanner checks bounded recent windows across arXiv, bioRxiv, medRxiv, PubMed, and Crossref,
deduplicates by canonical primary-source URL, and writes only private candidates. It is a set of
bounded intake lanes, not an automatic publication system or a comprehensive global research monitor.

## Local development

Requirements: Node.js 20 or newer and npm.

```bash
npm ci
npm run dev
```

Validation:

```bash
npm run check
npm audit --audit-level=high
```

`npm run build` creates the Cloudflare Workers-compatible Sites bundle in `dist/` and stages D1
migrations under `dist/.openai/drizzle/`.

## Runtime configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `INTAKE_ENABLED` | Enables candidate-only source scanning | `false` |
| `INTAKE_LOOKBACK_DAYS` | Recent window for each approved source, clamped to 2–30 days | `14` |
| `INTAKE_MAX_RESULTS` | Per-run source cap, clamped to 1–25 | `12` |
| `INTAKE_SOURCES` | Optional comma-separated source-key allowlist; unset means all approved feeds | all |
| `INTAKE_TOKEN` | Bearer token for the protected intake endpoint | unset / fail closed |
| `EDITORIAL_TOKEN` | Separate bearer token for editorial review routes | unset / fail closed |
| `AUTOMATION_TOKEN` | Separate bearer token for the Luna Max structured-data route | unset / fail closed |

Secrets belong in Sites environment variables and GitHub Actions secrets, never in Git. Forks must
replace the Sites project identifier in `.openai/hosting.json` with their own project.

## Daily candidate intake

The scheduled workflow runs daily at `10:17 UTC` and can also be started manually from GitHub. It
sends a protected `POST` request to `/api/intake/run`; it does not check out, edit, commit, or deploy
the repository.

To run the same intake manually:

```bash
curl --fail-with-body --request POST \
  --header "Authorization: Bearer $DISCOVERY_AI_INTAKE_TOKEN" \
  https://discovery-index.alexreeder.chatgpt.site/api/intake/run
```

Every source run is bounded, deduplicated, logged in `intake_runs`, and protected against overlap. A
source failure leaves every public record unchanged and is reported separately from successful source
runs. Candidate records are excluded from all public APIs.

## Daily Luna Max assessment

The Codex automation named **Discovery AI Index — daily Luna Max pass** runs locally each morning
using the existing Codex plan allowance. It reads the private queue through the protected
`/api/automation/queue` route and applies only validated JSON updates through the protected
`/api/automation/discoveries/:id/transition` route. The helper at
[`scripts/luna-automation.mjs`](scripts/luna-automation.mjs) keeps the production token in the
local macOS keychain rather than in the repository or the model prompt.

The automation may move a candidate to `under_review`, move an under-review record to `verified` or
`rejected` when the existing evidence rules permit it, and update an under-review record in place.
Every change writes an append-only `editorial_events` row with actor `luna-max-automation`. It cannot
change a verified record in place, bypass a transition, publish without a verification note, or
edit code, migrations, schema, editorial rules, or deployment configuration.

## Data and editorial workflow

The primary tables are:

- `discoveries`: canonical records and their publication state;
- `editorial_events`: append-only status and classification audit events;
- `intake_runs`: scheduled-run status, counts, and failures.

Publication states are `candidate`, `under_review`, `verified`, and `rejected`. See
[`EDITORIAL.md`](EDITORIAL.md) for the transition rules, evidence requirements, and review checklist.
Routine discoveries belong in the structured editorial workflow—not new application code or schema
migrations.

## Deployment and rollback

Changes merge to the public GitHub `main` branch after CI, then the same validated source is pushed
to the dedicated Sites deployment remote and published as a version. Sites versions provide code
rollback. Registry corrections use a new audited editorial event; history is preserved rather than
silently overwritten.

If candidate intake misbehaves, set `INTAKE_ENABLED=false`. This stops new scans without affecting
the public registry. Never rotate or expose production tokens in an issue or pull request.

## Contributing

Corrections and proposed sources are welcome. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and do not
present a paper, model output, or press release as verified without primary evidence.

## License

Application code is MIT licensed. Original registry data and editorial content are CC BY 4.0. See
[`LICENSE`](LICENSE) and [`DATA_LICENSE.md`](DATA_LICENSE.md). Third-party research remains under its
original copyright and is linked rather than relicensed.
