# Connect Luma to Supabase

Luma uses one Supabase project for the caregiver and clinician applications. Use synthetic data only in the current prototype.

## 1. Apply the database migrations

The GitHub integration reads migrations from the repository-root `supabase/` directory. Apply both migrations in timestamp order, or enable **Deploy to production** after reviewing them:

- `supabase/migrations/202608290001_initial_schema.sql`
- `supabase/migrations/202608300001_cognitive_care_sync.sql`
- `supabase/migrations/202608300002_summary_engine.sql`

The second migration adds the shared cognitive-care workflow. A patient is a clinical subject and does not need a login. Caregivers and clinicians sign in through `profiles` and receive explicit access through `patient_access`.

## 2. Add browser-safe configuration

Copy `.env.example` to `.env.local` and enter the project URL and publishable key shown in the Supabase **Connect** panel:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never put a secret key, service-role key, or database password in a `VITE_` variable. Vite exposes these values to the browser. Add the same two variables to the clinician workspace hosting environment so both frontends use the same project.

## 3. Link demo accounts

Create caregiver and clinician accounts through Supabase Auth, then assign their roles and link them to a synthetic patient. Replace the example account IDs with IDs from **Authentication → Users**:

```sql
update public.profiles set role = 'caregiver'
where id = 'CAREGIVER_AUTH_USER_ID';

update public.profiles set role = 'clinician'
where id = 'CLINICIAN_AUTH_USER_ID';

insert into public.patient_access
  (patient_id, account_id, relationship, status, can_record, can_assign)
values
  ('11111111-1111-4111-8111-111111111111', 'CAREGIVER_AUTH_USER_ID', 'guardian', 'active', true, false),
  ('11111111-1111-4111-8111-111111111111', 'CLINICIAN_AUTH_USER_ID', 'clinician', 'active', false, true);
```

Synthetic patient IDs:

- Margaret Lewis: `11111111-1111-4111-8111-111111111111`
- Noah Bennett: `22222222-2222-4222-8222-222222222222`

## 4. Connected data flow

- A caregiver can record observations and medication events only for an actively linked patient.
- A clinician can assign assessments and create draft medication plans only for an actively linked patient.
- Caregivers can complete assigned assessments; clinicians can read the results.
- Summaries retain calculated metrics, narrative, status, and source observation IDs.
- Row Level Security enforces relationship and capability checks in the database, not only in the interface.

Client helpers are available in `src/lib/care-data.ts` and `luma-clinician-workspace/lib/clinical-data.ts`.

## 5. Summary processing

Write raw caregiver events first. A protected Edge Function should calculate medication adherence, sleep/activity/nutrition changes, assessment trends, and rule-based alerts. It may then ask an AI model to turn those verified facts into a narrative. The function writes the result to `patient_summaries` and includes the supporting `care_observations.id` values in `evidence_observation_ids`.

The `refresh_patient_summary` database function now calculates the initial metrics and green/yellow/red state. Urgent alert creation remains rule-based. AI can explain an alert but should not be the only mechanism that decides status.

## Healthcare warning

This schema is a secure prototype foundation, not proof of HIPAA or regulatory compliance. Do not store real patient information until hosting, agreements, auditing, retention, consent, incident response, backups, and a professional security and privacy review are complete.
