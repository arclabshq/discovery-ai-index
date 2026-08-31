# Candidate intake incident runbook

## Current state

The **Daily candidate intake** GitHub workflow is manually paused. Keep it paused. Do not dispatch or
re-enable it until both of these external gates succeed in one coordinated maintenance window:

1. Rotate the same new intake credential into the Cloudflare Worker `INTAKE_TOKEN` secret and the
   GitHub `DISCOVERY_AI_INTAKE_TOKEN` secret without printing or storing the value in Git.
2. Send an authenticated `POST` directly to
   `https://discovery-ai-index-api.helloarclabshq.workers.dev/api/intake/run` and verify a 2xx response
   with `mode: "candidate_only"`, `publicRecordsChanged: 0`, and status `completed` or `skipped`.

The authenticated `POST` is a real production candidate-only intake, not a dry run. It can add or
refresh private candidates and write `intake_runs` audit rows. It cannot publish or change public
records. A `partial` response can retain successful private writes from healthy source lanes even
though the overall gate remains failed.

A `partial`, `failed`, non-2xx, or policy-mismatch response does not clear the pause. Investigate the
named source keys without copying response bodies or credentials into GitHub logs. Re-enabling the
workflow is a separate owner action after both gates pass. After recovery, update the paused-state
language in this runbook and the README so the documentation does not preserve a closed incident as
current truth.
