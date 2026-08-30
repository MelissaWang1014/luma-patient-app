-- Safely link authenticated demo accounts to synthetic patients.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'caregiver'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.link_synthetic_demo_patient(
  target_ref text,
  requested_relationship text default 'caregiver'
)
returns public.patient_access
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
  target_patient_id uuid;
  access_row public.patient_access;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_ref not in ('SYN-ALZ-084', 'SYN-ASD-020') then
    raise exception 'Only synthetic demo patients may be linked';
  end if;

  if requested_relationship not in ('caregiver', 'guardian', 'clinician') then
    raise exception 'Unsupported relationship';
  end if;

  select role into current_role from public.profiles where id = auth.uid();

  if requested_relationship = 'clinician' and current_role <> 'clinician' then
    raise exception 'Clinician access requires an administrator-assigned clinician role';
  end if;

  if requested_relationship in ('caregiver', 'guardian') and current_role <> 'caregiver' then
    raise exception 'Caregiver access requires a caregiver profile';
  end if;

  select id into target_patient_id from public.patients where external_ref = target_ref;
  if target_patient_id is null then raise exception 'Synthetic patient not found'; end if;

  insert into public.patient_access
    (patient_id, account_id, relationship, status, can_record, can_assign)
  values
    (target_patient_id, auth.uid(), requested_relationship, 'active', true, requested_relationship = 'clinician')
  on conflict (patient_id, account_id, relationship)
  do update set status = 'active', can_record = excluded.can_record, can_assign = excluded.can_assign
  returning * into access_row;

  return access_row;
end;
$$;

revoke all on function public.link_synthetic_demo_patient(text, text) from public;
grant execute on function public.link_synthetic_demo_patient(text, text) to authenticated;
