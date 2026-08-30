-- Deterministic summary engine for the prototype.
-- AI narrative generation may enrich this output later, but alert status and
-- metrics remain reproducible from stored caregiver events.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger patients_touch_updated_at before update on public.patients
for each row execute function public.touch_updated_at();
create trigger assessment_assignments_touch_updated_at before update on public.assessment_assignments
for each row execute function public.touch_updated_at();
create trigger assessment_responses_touch_updated_at before update on public.assessment_responses
for each row execute function public.touch_updated_at();
create trigger medication_plans_touch_updated_at before update on public.medication_plans
for each row execute function public.touch_updated_at();

create or replace function public.refresh_patient_summary(
  target_patient uuid,
  range_start date default (current_date - 13),
  range_end date default current_date
)
returns public.patient_summaries
language plpgsql
security definer
set search_path = ''
as $$
declare
  observation_count integer;
  watch_count integer;
  urgent_count integer;
  medication_total integer;
  medication_taken integer;
  open_red_alerts integer;
  adherence numeric;
  summary_status text;
  evidence uuid[];
  result public.patient_summaries;
begin
  if range_end < range_start then
    raise exception 'Summary end date must not precede start date';
  end if;

  if not public.has_patient_access(target_patient) then
    raise exception 'Not authorized for this patient' using errcode = '42501';
  end if;

  select
    count(*)::integer,
    count(*) filter (where severity = 'watch')::integer,
    count(*) filter (where severity = 'urgent')::integer,
    coalesce(array_agg(id order by observed_at), '{}'::uuid[])
  into observation_count, watch_count, urgent_count, evidence
  from public.care_observations
  where patient_id = target_patient
    and observed_at >= range_start::timestamptz
    and observed_at < (range_end + 1)::timestamptz;

  select
    count(*)::integer,
    count(*) filter (where status = 'taken')::integer
  into medication_total, medication_taken
  from public.medication_events
  where patient_id = target_patient
    and recorded_at >= range_start::timestamptz
    and recorded_at < (range_end + 1)::timestamptz;

  select count(*)::integer into open_red_alerts
  from public.clinical_alerts
  where patient_id = target_patient
    and severity = 'red'
    and status in ('open', 'acknowledged')
    and created_at < (range_end + 1)::timestamptz;

  adherence := case
    when medication_total = 0 then null
    else round((medication_taken::numeric / medication_total::numeric) * 100, 1)
  end;

  summary_status := case
    when urgent_count > 0 or open_red_alerts > 0 then 'red'
    when watch_count > 0 or (adherence is not null and adherence < 90) then 'yellow'
    else 'green'
  end;

  insert into public.patient_summaries (
    patient_id, period_start, period_end, status, metrics, narrative,
    evidence_observation_ids, generation_method, generated_at
  ) values (
    target_patient,
    range_start,
    range_end,
    summary_status,
    jsonb_build_object(
      'observation_count', observation_count,
      'watch_observation_count', watch_count,
      'urgent_observation_count', urgent_count,
      'medication_events', medication_total,
      'medication_taken', medication_taken,
      'medication_adherence_percent', adherence,
      'open_red_alert_count', open_red_alerts
    ),
    jsonb_build_object(
      'headline', case summary_status
        when 'red' then 'Urgent changes need clinician review.'
        when 'yellow' then 'Recent patterns leave room for improvement.'
        else 'No urgent change is visible in the recorded data.'
      end,
      'limitations', case
        when observation_count = 0 then 'No caregiver observations were recorded in this period.'
        else 'Summary reflects recorded entries only and is not a diagnosis.'
      end
    ),
    evidence,
    'rules',
    now()
  )
  on conflict (patient_id, period_start, period_end)
  do update set
    status = excluded.status,
    metrics = excluded.metrics,
    narrative = excluded.narrative,
    evidence_observation_ids = excluded.evidence_observation_ids,
    generation_method = excluded.generation_method,
    generated_at = excluded.generated_at,
    review_status = 'draft',
    reviewed_by = null
  returning * into result;

  return result;
end;
$$;

revoke all on function public.touch_updated_at() from public;
revoke all on function public.refresh_patient_summary(uuid, date, date) from public;
grant execute on function public.refresh_patient_summary(uuid, date, date) to authenticated;
