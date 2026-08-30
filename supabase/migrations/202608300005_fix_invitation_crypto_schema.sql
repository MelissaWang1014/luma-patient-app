create or replace function public.create_patient_invitation(
  patient_name text,
  patient_dob date default null,
  condition_text text default null,
  communication_text text default null
)
returns table(patient_id uuid, invitation_code text, expires_at timestamptz)
language plpgsql security definer set search_path = public
as $$
declare
  clinician_role text;
  new_patient_id uuid;
  plain_code text;
  expiry timestamptz := now() + interval '7 days';
begin
  select role into clinician_role from public.profiles where id = auth.uid();
  if clinician_role not in ('clinician', 'admin') then raise exception 'Clinician access required'; end if;
  if length(trim(patient_name)) < 2 then raise exception 'Patient name is required'; end if;

  insert into public.patients(display_name,date_of_birth,condition_summary,communication_needs,created_by)
  values(trim(patient_name),patient_dob,nullif(trim(condition_text),''),nullif(trim(communication_text),''),auth.uid())
  returning id into new_patient_id;
  insert into public.patient_access(patient_id,account_id,relationship,status,can_record,can_assign)
  values(new_patient_id,auth.uid(),'clinician','active',true,true);

  plain_code := upper(substr(encode(extensions.gen_random_bytes(6),'hex'),1,8));
  insert into public.patient_invitations(patient_id,code_hash,created_by,expires_at)
  values(new_patient_id,extensions.crypt(plain_code,extensions.gen_salt('bf')),auth.uid(),expiry);
  return query select new_patient_id, plain_code, expiry;
end;
$$;

create or replace function public.claim_patient_invitation(patient_name text, invitation_code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare invitation public.patient_invitations; matched_patient uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before claiming an invitation'; end if;
  select i.* into invitation
  from public.patient_invitations i join public.patients p on p.id=i.patient_id
  where lower(trim(p.display_name))=lower(trim(patient_name))
    and i.claimed_at is null and i.expires_at>now()
    and extensions.crypt(upper(trim(invitation_code)),i.code_hash)=i.code_hash
  order by i.created_at desc limit 1;
  if invitation.id is null then raise exception 'Invitation not found, expired, or already used'; end if;
  insert into public.patient_access(patient_id,account_id,relationship,status,can_record,can_assign)
  values(invitation.patient_id,auth.uid(),'caregiver','active',true,false)
  on conflict(patient_id,account_id,relationship) do update set status='active',can_record=true;
  update public.patient_invitations set claimed_by=auth.uid(),claimed_at=now() where id=invitation.id;
  matched_patient := invitation.patient_id;
  return matched_patient;
end;
$$;
