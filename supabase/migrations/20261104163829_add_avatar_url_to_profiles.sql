ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

NOTIFY pgrst, 'reload schema';
