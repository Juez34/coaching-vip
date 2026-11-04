-- Store the actual planned date and time for each coaching session.
-- Existing programs remain unscheduled; their creation time is not a planned date.
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
