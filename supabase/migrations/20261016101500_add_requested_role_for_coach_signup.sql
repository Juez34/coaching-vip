-- Coach registrations are requests only; public signups remain clients until approved.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requested_role text NOT NULL DEFAULT 'client';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_requested_role_allowed'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_requested_role_allowed
      CHECK (requested_role IN ('client', 'coach'));
  END IF;
END
$$;
