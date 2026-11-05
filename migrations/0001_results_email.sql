-- Stored "email me these results" requests (capture fold-in, Brad's
-- ruling 2026-11-05). The request — address + a snapshot of the results
-- on screen — is recorded here. Actual delivery awaits a mail send
-- leg, which does not exist yet; it is tracked as an open item in the
-- capture plan (capture-and-monetize-plan-2026-11-04.md). Nothing in
-- this table is emailed until that leg is built.
create table if not exists results_email_requests (
  id bigint generated always as identity primary key,
  email text not null,
  surface text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists results_email_requests_created_at_idx
  on results_email_requests (created_at);
