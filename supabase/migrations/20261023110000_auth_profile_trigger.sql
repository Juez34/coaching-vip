-- Ensure every new Supabase Auth user gets a profile, even when email confirmation
-- is enabled and the client has no authenticated session yet.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_role_value text;
  height_value numeric;
  weight_value numeric;
  years_value integer;
  birth_date_value date;
begin
  requested_role_value := case
    when metadata ->> 'requested_role' in ('client', 'coach') then metadata ->> 'requested_role'
    else 'client'
  end;

  if coalesce(metadata ->> 'height', '') ~ '^\d+(\.\d+)?$' then
    height_value := (metadata ->> 'height')::numeric;
  end if;
  if coalesce(metadata ->> 'weight', '') ~ '^\d+(\.\d+)?$' then
    weight_value := (metadata ->> 'weight')::numeric;
  end if;
  if coalesce(metadata ->> 'years_experience', '') ~ '^\d+$' then
    years_value := (metadata ->> 'years_experience')::integer;
  end if;
  begin
    birth_date_value := nullif(metadata ->> 'birth_date', '')::date;
  exception when others then
    birth_date_value := null;
  end;

  insert into public.profiles (
    id, email, role, requested_role, first_name, last_name, full_name, phone,
    birth_date, height, weight, specialties, certifications, years_experience, bio
  )
  values (
    new.id,
    lower(nullif(trim(new.email), '')),
    'client',
    requested_role_value,
    nullif(trim(metadata ->> 'first_name'), ''),
    nullif(trim(metadata ->> 'last_name'), ''),
    nullif(trim(metadata ->> 'full_name'), ''),
    nullif(trim(metadata ->> 'phone'), ''),
    birth_date_value,
    height_value,
    weight_value,
    nullif(trim(metadata ->> 'specialties'), ''),
    nullif(trim(metadata ->> 'certifications'), ''),
    years_value,
    nullif(trim(metadata ->> 'bio'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();
