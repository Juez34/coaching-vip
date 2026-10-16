-- Follow-up correction for the test-branch request workflow.
-- A normal UNIQUE index allows multiple NULLs while making ON CONFLICT inference reliable.
drop index if exists public.student_coaches_student_coach_unique;
create unique index student_coaches_student_coach_unique
  on public.student_coaches (student_id, coach_id);

create or replace function public.search_coaches(search_text text default null)
returns table (
  id uuid,
  full_name text,
  bio text,
  specialties text,
  certifications text,
  years_experience integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'client'
  ) then
    raise exception 'Only students can search coaches';
  end if;

  return query
    select p.id, p.full_name, p.bio, p.specialties, p.certifications, p.years_experience
    from public.profiles p
    where p.role = 'coach'
      and (
        nullif(trim(search_text), '') is null
        or p.id = '6aff5f48-44ec-4ddd-8dc4-4a77a05629dc'::uuid
        or coalesce(p.full_name, '') ilike '%' || trim(search_text) || '%'
        or coalesce(p.specialties, '') ilike '%' || trim(search_text) || '%'
        or coalesce(p.bio, '') ilike '%' || trim(search_text) || '%'
      )
    order by
      (p.id = '6aff5f48-44ec-4ddd-8dc4-4a77a05629dc'::uuid) desc,
      p.full_name asc nulls last;
end;
$$;

revoke all on function public.search_coaches(text) from public, anon;
grant execute on function public.search_coaches(text) to authenticated;
