-- Candidate intake is append-only and safe to retry. This partial unique index provides a
-- database-backed lease so overlapping schedulers cannot run the same source concurrently.
UPDATE intake_runs
SET
  finished_at = COALESCE(finished_at, CURRENT_TIMESTAMP),
  status = 'failed',
  error_message = COALESCE(
    error_message,
    'Closed while installing the candidate-intake concurrency guard.'
  )
WHERE status = 'running';

CREATE UNIQUE INDEX IF NOT EXISTS intake_runs_one_active_source_idx
  ON intake_runs(source_key)
  WHERE status = 'running';
