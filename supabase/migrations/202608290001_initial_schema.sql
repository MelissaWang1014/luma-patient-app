create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'patient' check (role in ('patient','caregiver')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null default current_date,
  title text not null default '',
  body text not null,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  record_date date not null default current_date,
  medication_taken boolean,
  sleep_minutes integer check (sleep_minutes is null or sleep_minutes between 0 and 1440),
  sleep_quality smallint check (sleep_quality is null or sleep_quality between 1 and 5),
  movement_minutes integer check (movement_minutes is null or movement_minutes >= 0),
  steps integer check (steps is null or steps >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(patient_id,record_date)
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  ai_response text,
  summary text,
  created_at timestamptz not null default now()
);

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  created_at timestamptz not null default now()
);

create table public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now(),
  unique(patient_id,caregiver_id)
);

create table public.symptom_observations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  caregiver_id uuid not null references public.profiles(id) on delete cascade,
  condition_name text not null,
  symptoms jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now()
);

create index on public.journal_entries(patient_id,entry_date desc);
create index on public.daily_records(patient_id,record_date desc);
create index on public.check_ins(patient_id,created_at desc);
create index on public.medical_records(patient_id,created_at desc);
create index on public.caregiver_links(patient_id,status);
create index on public.caregiver_links(caregiver_id,status);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name,role)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.raw_user_meta_data->>'role','patient'));
 return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.daily_records enable row level security;
alter table public.check_ins enable row level security;
alter table public.medical_records enable row level security;
alter table public.caregiver_links enable row level security;
alter table public.symptom_observations enable row level security;

revoke all on public.profiles,public.journal_entries,public.daily_records,public.check_ins,public.medical_records,public.caregiver_links,public.symptom_observations from anon;
grant select,insert,update,delete on public.profiles,public.journal_entries,public.daily_records,public.check_ins,public.medical_records,public.caregiver_links,public.symptom_observations to authenticated;

create policy "own profile select" on public.profiles for select to authenticated using ((select auth.uid())=id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);

create policy "own journals select" on public.journal_entries for select to authenticated using ((select auth.uid())=patient_id);
create policy "own journals insert" on public.journal_entries for insert to authenticated with check ((select auth.uid())=patient_id);
create policy "own journals update" on public.journal_entries for update to authenticated using ((select auth.uid())=patient_id) with check ((select auth.uid())=patient_id);
create policy "own journals delete" on public.journal_entries for delete to authenticated using ((select auth.uid())=patient_id);

create policy "own daily records select" on public.daily_records for select to authenticated using ((select auth.uid())=patient_id);
create policy "own daily records insert" on public.daily_records for insert to authenticated with check ((select auth.uid())=patient_id);
create policy "own daily records update" on public.daily_records for update to authenticated using ((select auth.uid())=patient_id) with check ((select auth.uid())=patient_id);
create policy "own daily records delete" on public.daily_records for delete to authenticated using ((select auth.uid())=patient_id);

create policy "own checkins select" on public.check_ins for select to authenticated using ((select auth.uid())=patient_id);
create policy "own checkins insert" on public.check_ins for insert to authenticated with check ((select auth.uid())=patient_id);
create policy "own checkins delete" on public.check_ins for delete to authenticated using ((select auth.uid())=patient_id);

create policy "own medical metadata select" on public.medical_records for select to authenticated using ((select auth.uid())=patient_id);
create policy "own medical metadata insert" on public.medical_records for insert to authenticated with check ((select auth.uid())=patient_id);
create policy "own medical metadata delete" on public.medical_records for delete to authenticated using ((select auth.uid())=patient_id);

create policy "links visible to participants" on public.caregiver_links for select to authenticated using ((select auth.uid()) in (patient_id,caregiver_id));
create policy "patients create links" on public.caregiver_links for insert to authenticated with check ((select auth.uid())=patient_id);
create policy "participants update links" on public.caregiver_links for update to authenticated using ((select auth.uid()) in (patient_id,caregiver_id)) with check ((select auth.uid()) in (patient_id,caregiver_id));
create policy "participants delete links" on public.caregiver_links for delete to authenticated using ((select auth.uid()) in (patient_id,caregiver_id));

create policy "observers create symptoms" on public.symptom_observations for insert to authenticated with check ((select auth.uid())=caregiver_id and exists(select 1 from public.caregiver_links l where l.patient_id=symptom_observations.patient_id and l.caregiver_id=(select auth.uid()) and l.status='accepted'));
create policy "symptoms visible to participants" on public.symptom_observations for select to authenticated using ((select auth.uid()) in (patient_id,caregiver_id));
