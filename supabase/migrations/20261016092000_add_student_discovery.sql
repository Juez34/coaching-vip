-- Test branch only. Do not apply to the shared Supabase project until its production status is confirmed.
create or replace function public.search_students(search_text text default null)
returns table (
  id uuid,
  full_name text,
  fitness_goal text,
  experience_level text
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
    where p.id = auth.uid() and p.role = 'coach'
  ) then
    raise exception 'Only coaches can search students';
  end if;

  return query
    select p.id, p.full_name, p.fitness_goal, p.experience_level
    from public.profiles p
    where p.role = 'client'
      and (
        nullif(trim(search_text), '') is null
        or coalesce(p.full_name, '') ilike '%' || trim(search_text) || '%'
        or coalesce(p.fitness_goal, '') ilike '%' || trim(search_text) || '%'
        or coalesce(p.experience_level, '') ilike '%' || trim(search_text) || '%'
      )
      and not exists (
        select 1 from public.student_coaches sc
        where sc.student_id = p.id and sc.coach_id = auth.uid()
      )
    order by p.full_name asc nulls last;
end;
$$;

revoke all on function public.search_students(text) from public, anon;
grant execute on function public.search_students(text) to authenticated;
