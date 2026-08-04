# Discovery AI Index editorial operations

The public registry is intentionally narrower than the database:

- `candidate` — private, machine-found lead; never returned by a public API.
- `under_review` — visible as a reported result with its open verification questions.
- `verified` — published in the registry with a primary source and verification note.
- `rejected` — private and retained for audit history.

Every record also has two independent editorial classifications:

- `discovery_type` — whether AI helped find, prove, design, translate, or enable the result.
- `validation_stage` — the strongest documented scientific check, which may be a formal proof,
  field confirmation, laboratory result, animal study, human trial, or deployment.

Registry status controls publication. Validation stage describes evidence maturity. One never
automatically determines the other.

## Publication invariant

Candidate intake can only insert `candidate` records. A candidate must move to
`under_review` before an authenticated editor or the separately authenticated Luna Max automation
can move it to `verified`. Every transition writes an `editorial_events` audit row, and publication
requires a non-empty verification note plus a non-weak validation stage.

## Protected editorial API

Configure `EDITORIAL_TOKEN` as a secret runtime value before using these routes:

- `GET /api/editorial/queue`
- `POST /api/editorial/discoveries/:id/transition`
- `PATCH /api/editorial/discoveries/:id/classification`

A transition request uses a bearer token and a JSON body:

```json
{
  "status": "under_review",
  "note": "Primary paper checked; independent evidence review assigned.",
  "title": "Editor-written public title",
  "summary": "Plain-language account of the result and the human role.",
  "field": "Materials science",
  "aiSystem": "System name",
  "sourceLabel": "arXiv author preprint",
  "sourceType": "Preprint",
  "evidenceLevel": "preprint_experimental",
  "discoveryType": "discovery",
  "validationStage": "author_reported_experimental",
  "whyItMatters": "A scoped explanation of the possible significance.",
  "verificationNote": "The specific evidence and open checks."
}
```

Candidate-to-review transitions require all public editorial fields so raw
machine-found metadata cannot become visible by accident. Publishing uses
`status: "verified"` and must include `verificationNote`. The API fails closed
when the token is absent.

Classification can later be updated without inventing a status transition:

- `PATCH /api/editorial/discoveries/:id/classification`

It requires a valid `discoveryType`, `validationStage`, and non-empty editorial note. The
change is written to the existing audit log while the record keeps its current publication
status.

## Luna Max automation API

The daily Codex automation uses a separate `AUTOMATION_TOKEN`; it never reuses a human editor
credential. It calls:

- `GET /api/automation/queue`
- `POST /api/automation/discoveries/:id/transition`
- `PATCH /api/automation/discoveries/:id/transition` for an under-review record that remains under review
- `PATCH /api/automation/discoveries/:id/classification`

The route shares the same allow-list, required fields, evidence-stage guard, and append-only audit
event behavior as the editorial API. Automation can update structured D1 data only. It cannot edit
the application, migrations, schema, taxonomy, thresholds, workflow permissions, or deployment.

## Candidate intake

The worker exposes a scheduled handler and a protected manual
`POST /api/intake/run` hook. Both call the same bounded source scanner.

The initial scanner:

1. Searches a date-bounded arXiv query for AI-assisted discovery language.
2. Caps each run at 25 source records.
3. Applies a second keyword screen.
4. Inserts only `candidate` records.
5. Preserves reviewed or verified records on duplicate URLs.
6. Logs every run and failure in `intake_runs`.
7. Allows only one active run per source and safely skips overlapping triggers.

Set `INTAKE_ENABLED=true` only when a production schedule is attached. Set
`INTAKE_TOKEN` as a secret if the manual scheduler hook is used. The default is
safe-off; a source outage never changes published records.

The production GitHub workflow is a thin trigger with no repository permissions. It receives no editorial,
repository-write, migration, or deployment credential. It cannot edit this application or make a
candidate public. The initial scanner covers recent arXiv candidates only; expanding its approved
sources or changing its rules requires a reviewed code change.

## Review checklist

Before moving a record to `verified`, an editor should confirm:

1. The source is the original paper, preprint, dataset, or official technical report.
2. The title and summary do not imply that AI worked without human direction.
3. The AI system's contribution is separated from later experiments or expert checks.
4. The novelty claim is scoped to what the source actually demonstrates.
5. The verification note names the strongest completed check and any material limit.
