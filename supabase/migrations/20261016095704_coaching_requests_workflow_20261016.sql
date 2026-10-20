-- Workflow migration recorded in Supabase on 2026-10-16.
create unique index if not exists student_coaches_student_coach_unique
  on public.student_coaches (student_id, coach_id)
  where student_id is not null and coach_id is not null;

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
        or coalesce(p.full_name, '') ilike '%' || trim(search_text) || '%'
        or coalesce(p.specialties, '') ilike '%' || trim(search_text) || '%'
        or coalesce(p.bio, '') ilike '%' || trim(search_text) || '%'
      )
    order by
      (p.id = '6aff5f48-44ec-4ddd-8dc4-4a77a05629dc'::uuid) desc,
      p.full_name asc nulls last;
end;
$$;

create or replace function public.create_coaching_request(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  requester uuid := auth.uid();
  requester_role text;
  target_role text;
  new_request_id uuid;
begin
  if requester is null then
    raise exception 'Authentication required';
  end if;
  if target_user_id is null or target_user_id = requester then
    raise exception 'Invalid recipient';
  end if;

  select p.role into requester_role from public.profiles p where p.id = requester;
  select p.role into target_role from public.profiles p where p.id = target_user_id;

  if not ((requester_role = 'client' and target_role = 'coach')
       or (requester_role = 'coach' and target_role = 'client')) then
    raise exception 'A student and a coach must request each other';
  end if;

  if requester_role = 'client' and not exists (
    select 1 from public.profiles p where p.id = target_user_id and p.role = 'coach'
  ) then
    raise exception 'Coach not found';
  end if;

  if exists (
    select 1 from public.student_coaches sc
    where sc.student_id = case when requester_role = 'client' then requester else target_user_id end
      and sc.coach_id = case when requester_role = 'coach' then requester else target_user_id end
  ) then
    raise exception 'Already connected';
  end if;

  if exists (
    select 1 from public.coaching_requests cr
    where cr.status = 'pending'
      and ((cr.sender_id = requester and cr.receiver_id = target_user_id)
        or (cr.sender_id = target_user_id and cr.receiver_id = requester))
  ) then
    raise exception 'Request already pending';
  end if;

  insert into public.coaching_requests(sender_id, receiver_id, status)
  values (requester, target_user_id, 'pending')
  returning id into new_request_id;

  return new_request_id;
end;
$$;

create or replace function public.list_coaching_requests()
returns table (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  status text,
  created_at timestamptz,
  sender_name text,
  sender_role text,
  receiver_name text,
  receiver_role text
)
language sql
security definer
set search_path = ''
as $$
  select cr.id, cr.sender_id, cr.receiver_id, cr.status, cr.created_at,
         sender.full_name, sender.role, receiver.full_name, receiver.role
  from public.coaching_requests cr
  join public.profiles sender on sender.id = cr.sender_id
  join public.profiles receiver on receiver.id = cr.receiver_id
  where auth.uid() is not null
    and (cr.sender_id = auth.uid() or cr.receiver_id = auth.uid())
  order by cr.created_at desc;
$$;

create or replace function public.respond_to_coaching_request(request_id uuid, decision text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row public.coaching_requests%rowtype;
  sender_role text;
  receiver_role text;
  student_uuid uuid;
  coach_uuid uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if decision not in ('accepted', 'rejected') then
    raise exception 'Decision must be accepted or rejected';
  end if;

  select * into request_row
  from public.coaching_requests cr
  where cr.id = request_id
  for update;

  if request_row.id is null then
    raise exception 'Request not found';
  end if;
  if request_row.receiver_id <> auth.uid() then
    raise exception 'Only the recipient can respond';
  end if;
  if request_row.status <> 'pending' then
    raise exception 'Request already processed';
  end if;

  select p.role into sender_role from public.profiles p where p.id = request_row.sender_id;
  select p.role into receiver_role from public.profiles p where p.id = request_row.receiver_id;

  if not ((sender_role = 'client' and receiver_role = 'coach')
       or (sender_role = 'coach' and receiver_role = 'client')) then
    raise exception 'Invalid request participants';
  end if;

  update public.coaching_requests
  set status = decision
  where id = request_row.id;

  if decision = 'accepted' then
    student_uuid := case when sender_role = 'client' then request_row.sender_id else request_row.receiver_id end;
    coach_uuid := case when sender_role = 'coach' then request_row.sender_id else request_row.receiver_id end;

    insert into public.student_coaches(student_id, coach_id)
    values (student_uuid, coach_uuid)
    on conflict (student_id, coach_id) do nothing;
  end if;
end;
$$;

revoke all on function public.search_coaches(text) from public, anon;
revoke all on function public.create_coaching_request(uuid) from public, anon;
revoke all on function public.list_coaching_requests() from public, anon;
revoke all on function public.respond_to_coaching_request(uuid, text) from public, anon;
grant execute on function public.search_coaches(text) to authenticated;
grant execute on function public.create_coaching_request(uuid) to authenticated;
grant execute on function public.list_coaching_requests() to authenticated;
grant execute on function public.respond_to_coaching_request(uuid, text) to authenticated;
