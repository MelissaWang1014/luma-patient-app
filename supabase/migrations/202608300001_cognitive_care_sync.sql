-- Shared cognitive-care data model.
-- Patients are clinical subjects and do not need their own login account.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('patient', 'caregiver', 'clinician', 'admin'));

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  external_ref text unique,
  display_name text not null,
  date_of_birth date,
  condition_summary text,
  communication_needs text,
  functional_status text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patient_access (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  account_id uuid not null references public.profiles(id) on delete cascade,
  relationship text not null check (relationship in ('patient', 'caregiver', 'guardian', 'clinician')),
  status text not null default 'active' check (status in ('pending', 'active', 'revoked')),
  can_record boolean not null default false,
  can_assign boolean not null default false,
  created_at timestamptz not null default now(),
  unique (patient_id, account_id, relationship)
);

create table public.care_observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  observed_at timestamptz not null default now(),
  category text not null check (category in ('medication', 'sleep', 'activity', 'nutrition', 'mood', 'behavior', 'function', 'safety', 'other')),
  value_number numeric,
  value_text text,
  unit text,
  severity text not null default 'routine' check (severity in ('routine', 'watch', 'urgent')),
  source text not null default 'caregiver' check (source in ('patient', 'caregiver', 'device', 'clinician', 'import')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete set null,
  assessment_code text not null,
  title text not null,
  instructions text,
  due_at timestamptz,
  status text not null default 'assigned' check (status in ('draft', 'assigned', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessment_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null unique references public.assessment_assignments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  respondent_id uuid not null references public.profiles(id) on delete restrict,
  answers jsonb not null default '{}'::jsonb,
  score numeric,
  interpretation text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medication_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  ordered_by uuid not null references public.profiles(id) on delete restrict,
  medication_name text not null,
  dose text not null,
  instructions text not null,
  schedule jsonb not null default '{}'::jsonb,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'held', 'stopped', 'completed')),
  reconciliation_status text not null default 'unverified' check (reconciliation_status in ('unverified', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medication_events (
  id uuid primary key default gen_random_uuid(),
  medication_plan_id uuid not null references public.medication_plans(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  scheduled_at timestamptz,
  recorded_at timestamptz not null default now(),
  status text not null check (status in ('taken', 'missed', 'declined', 'unable', 'unknown')),
  note text
);

create table public.patient_summaries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status text not null check (status in ('green', 'yellow', 'red')),
  metrics jsonb not null default '{}'::jsonb,
  narrative jsonb not null default '{}'::jsonb,
  evidence_observation_ids uuid[] not null default '{}',
  generation_method text not null default 'rules' check (generation_method in ('rules', 'rules_and_ai')),
  review_status text not null default 'draft' check (review_status in ('draft', 'reviewed', 'filed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now(),
  unique (patient_id, period_start, period_end)
);

create table public.clinical_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  observation_id uuid references public.care_observations(id) on delete set null,
  alert_type text not null,
  severity text not null check (severity in ('yellow', 'red')),
  title text not null,
  detail text,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index patient_access_account_idx on public.patient_access(account_id, status);
create index care_observations_patient_time_idx on public.care_observations(patient_id, observed_at desc);
create index assessment_assignments_patient_status_idx on public.assessment_assignments(patient_id, status);
create index medication_plans_patient_status_idx on public.medication_plans(patient_id, status);
create index medication_events_patient_time_idx on public.medication_events(patient_id, recorded_at desc);
create index patient_summaries_patient_period_idx on public.patient_summaries(patient_id, period_end desc);
create index clinical_alerts_patient_status_idx on public.clinical_alerts(patient_id, status, created_at desc);

create or replace function public.has_patient_access(target_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.patient_access a
    where a.patient_id = target_patient
      and a.account_id = (select auth.uid())
      and a.status = 'active'
  );
$$;

create or replace function public.can_record_patient(target_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.patient_access a
    where a.patient_id = target_patient
      and a.account_id = (select auth.uid())
      and a.status = 'active'
      and a.can_record
  );
$$;

create or replace function public.can_assign_patient(target_patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.patient_access a
    where a.patient_id = target_patient
      and a.account_id = (select auth.uid())
      and a.status = 'active'
      and a.can_assign
  );
$$;

revoke all on function public.has_patient_access(uuid), public.can_record_patient(uuid), public.can_assign_patient(uuid) from public;
grant execute on function public.has_patient_access(uuid), public.can_record_patient(uuid), public.can_assign_patient(uuid) to authenticated;

alter table public.patients enable row level security;
alter table public.patient_access enable row level security;
alter table public.care_observations enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.assessment_responses enable row level security;
alter table public.medication_plans enable row level security;
alter table public.medication_events enable row level security;
alter table public.patient_summaries enable row level security;
alter table public.clinical_alerts enable row level security;

revoke all on public.patients, public.patient_access, public.care_observations,
  public.assessment_assignments, public.assessment_responses, public.medication_plans,
  public.medication_events, public.patient_summaries, public.clinical_alerts from anon;
grant select on public.patients, public.patient_access, public.care_observations,
  public.assessment_assignments, public.assessment_responses, public.medication_plans,
  public.medication_events, public.patient_summaries, public.clinical_alerts to authenticated;
grant insert on public.care_observations, public.assessment_assignments,
  public.assessment_responses, public.medication_plans, public.medication_events to authenticated;
grant update on public.assessment_assignments, public.assessment_responses,
  public.medication_plans, public.clinical_alerts, public.patient_summaries to authenticated;

create policy "linked accounts view patients" on public.patients
  for select to authenticated using (public.has_patient_access(id));
create policy "accounts view own access" on public.patient_access
  for select to authenticated using (account_id = (select auth.uid()));

create policy "linked accounts view observations" on public.care_observations
  for select to authenticated using (public.has_patient_access(patient_id));
create policy "recorders add observations" on public.care_observations
  for insert to authenticated with check (
    recorded_by = (select auth.uid()) and public.can_record_patient(patient_id)
  );

create policy "linked accounts view assignments" on public.assessment_assignments
  for select to authenticated using (public.has_patient_access(patient_id));
create policy "clinicians assign assessments" on public.assessment_assignments
  for insert to authenticated with check (
    assigned_by = (select auth.uid()) and public.can_assign_patient(patient_id)
  );
create policy "clinicians update assignments" on public.assessment_assignments
  for update to authenticated using (public.can_assign_patient(patient_id))
  with check (public.can_assign_patient(patient_id));

create policy "linked accounts view responses" on public.assessment_responses
  for select to authenticated using (public.has_patient_access(patient_id));
create policy "assigned care partners start responses" on public.assessment_responses
  for insert to authenticated with check (
    respondent_id = (select auth.uid())
    and public.can_record_patient(patient_id)
    and exists (
      select 1 from public.assessment_assignments a
      where a.id = assignment_id and a.patient_id = assessment_responses.patient_id
    )
  );
create policy "respondents update responses" on public.assessment_responses
  for update to authenticated using (respondent_id = (select auth.uid()))
  with check (respondent_id = (select auth.uid()));

create policy "linked accounts view medication plans" on public.medication_plans
  for select to authenticated using (public.has_patient_access(patient_id));
create policy "clinicians create medication plans" on public.medication_plans
  for insert to authenticated with check (
    ordered_by = (select auth.uid()) and public.can_assign_patient(patient_id)
  );
create policy "clinicians update medication plans" on public.medication_plans
  for update to authenticated using (public.can_assign_patient(patient_id))
  with check (public.can_assign_patient(patient_id));

create policy "linked accounts view medication events" on public.medication_events
  for select to authenticated using (public.has_patient_access(patient_id));
create policy "care partners record medication events" on public.medication_events
  for insert to authenticated with check (
    recorded_by = (select auth.uid())
    and public.can_record_patient(patient_id)
    and exists (
      select 1 from public.medication_plans m
      where m.id = medication_plan_id and m.patient_id = medication_events.patient_id
    )
  );

create policy "linked accounts view summaries" on public.patient_summaries
  for select to authenticated using (public.has_patient_access(patient_id));
create policy "clinicians review summaries" on public.patient_summaries
  for update to authenticated using (public.can_assign_patient(patient_id))
  with check (public.can_assign_patient(patient_id));

create policy "linked accounts view alerts" on public.clinical_alerts
  for select to authenticated using (public.has_patient_access(patient_id));
create policy "clinicians manage alerts" on public.clinical_alerts
  for update to authenticated using (public.can_assign_patient(patient_id))
  with check (public.can_assign_patient(patient_id));

-- Synthetic records used by the current prototype. No real PHI is inserted.
insert into public.patients (id, external_ref, display_name, condition_summary, communication_needs, functional_status)
values
  ('11111111-1111-4111-8111-111111111111', 'SYN-ALZ-084', 'Margaret Lewis', 'Alzheimer''s disease, late stage', 'Minimal vocalization; caregiver collateral required', 'Near-bedbound; total assistance for daily care'),
  ('22222222-2222-4222-8222-222222222222', 'SYN-ASD-020', 'Noah Bennett', 'Autism spectrum disorder, Level 3', 'AAC tablet, picture board, gestures, and fewer than 10 functional words', 'High direct support; walks independently')
on conflict (id) do nothing;
