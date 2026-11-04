ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personal_records jsonb NOT NULL DEFAULT '{}'::jsonb;
