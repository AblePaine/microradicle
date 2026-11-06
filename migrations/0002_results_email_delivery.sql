-- Send-leg delivery state for results_email_requests (capture plan;
-- Brad's go 2026-11-06). sent_at NULL = pending. Attempts + last error
-- give the drain job a retry cap and a paper trail.
alter table results_email_requests
  add column if not exists sent_at timestamptz,
  add column if not exists send_attempts integer not null default 0,
  add column if not exists last_send_error text;

create index if not exists results_email_requests_pending_idx
  on results_email_requests (created_at)
  where sent_at is null;
