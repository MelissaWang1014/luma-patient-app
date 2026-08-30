# Connect Luma to Supabase

The application now supports Supabase accounts and account-scoped patient data. It stays in demo mode until a Supabase project is connected.

## 1. Create the project

Create a Supabase project, then open **SQL Editor** and run:

`supabase/migrations/202608290001_initial_schema.sql`

This creates the patient-data tables, account profile trigger, indexes, grants, and Row Level Security policies.

## 2. Add the browser-safe configuration

Copy `.env.example` to `.env.local` and enter the project URL and publishable key shown in **Project Settings → API**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never put a service-role key, database password, or other server secret in a `VITE_` variable. Vite exposes these values to the browser.

Restart the development server after changing environment variables.

## 3. Current connected behavior

- Sign up and sign in use Supabase Auth.
- A profile is created automatically for every account.
- Saved journal entries are attached to the signed-in patient's user ID.
- The newest journal entry is restored when that account returns.
- Safe-space check-ins and medical-record metadata are attached to the user ID.
- Row Level Security prevents one patient account from reading another patient's rows.

The actual PDF or DOC contents are not uploaded yet; only metadata is recorded. Before production use, configure a private Storage bucket and its RLS policies.

## Healthcare warning

This schema is a secure prototype foundation, not proof of HIPAA or regulatory compliance. Do not store real patient health information until hosting, agreements, encryption, auditing, retention, consent, incident response, backups, and a professional security/privacy review are complete.
