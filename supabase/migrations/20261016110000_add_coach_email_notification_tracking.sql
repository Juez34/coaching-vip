-- Track email notifications for coach requests and approvals.
alter table public.profiles
  add column if not exists coach_request_notified_at timestamptz;

alter table public.profiles
  add column if not exists coach_approval_notified_at timestamptz;
