# Supabase backend

Student portal (`mvp/`, port 3000) and admin portal (`admin/`, port 3010) share one Supabase project. Without keys, both apps keep working on local demo data.

## 1. Create a project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Authentication → Providers → Email: turn **off** “Confirm email” for the demo, or keep it on and use the seeded users from Admin → Settings → Push catalogue.
3. Project Settings → API: copy **Project URL**, **anon public** key, and **service_role** key.

## 2. Apply the schema and demo data

In the SQL Editor, run these in order:

1. `supabase/migrations/0001_init.sql` — tables, RLS, triggers
2. `supabase/migrations/0002_seed_demo.sql` — demo accounts, 13 events, applications, volunteers, shifts, audit

The seed is safe to re-run. It fills Discover, the admin inbox and My Applications so the project is not empty.

| Portal | Username / email | Password |
|---|---|---|
| Student | `a1991246` or `a1991246@adelaide.edu.au` | `Volunteer1!` |
| Student | `a1882201`, `a1773344`, `a1664488`, `a1556677` | `Volunteer1!` |
| Admin app login | `rotaract.admin`, `super.admin`, `viewer.admin` | `Coordinator1!` |
| Admin (Supabase Auth) | `rotaract.admin@clubs.example.edu.au` | `Coordinator1!` |

## 3. Environment

Copy the same three values into:

- `mvp/.env.local`
- `admin/.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=
```

Use the publishable key from Project Settings → API. Put real values only in `mvp/.env.local` and `admin/.env.local` (gitignored). Restart both Next apps after changing env files.

SSR helpers live in `src/utils/supabase/` (`client.ts`, `server.ts`, `middleware.ts`). Next.js 16 runs session refresh from `src/proxy.ts`. Cookie names differ per portal (`sb-svp-student-auth` vs `sb-svp-admin-auth`) so localhost ports do not share sessions.

Never commit `.env.local` or the service role key.

## 4. Optional extra sync

If you already ran the SQL seed, you do not need this. Admin → **Settings** → **Push catalogue to Supabase** only fills any events that are still missing.

Restart both Next apps after changing env files.

## 5. What is live after that

| Portal | Behaviour |
|---|---|
| Student Discover | Reads `events` (admin edits appear here) |
| Student apply / My applications | Inserts and updates `applications` |
| Student profile / shifts | `profiles` and `shift_assignments` |
| Student signup / login | Supabase Auth; admin accounts are rejected |
| Admin event editor | Upserts `events` including map coordinates |
| Admin inbox / volunteers / audit | `applications`, `volunteer_directory`, `audit_logs` |

If a map search cannot find a venue, coordinators can still pin the campus, type an address without a pin, or enter coordinates. The event saves either way.
