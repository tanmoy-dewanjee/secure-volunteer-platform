# Secure Volunteer and Event Coordination Platform

**Adelaide University · Industry Research Project A01 · Team C262T-4104**

> **Educational demonstration only.** This project is not an official Adelaide University service. Use synthetic accounts and data only; do not submit real personal information.

A two-portal volunteer coordination prototype: **Students** can discover events, view details, apply for opportunities and access volunteer workflows; authorised **Admins** can manage events and review coordination information. The project emphasises server-side access control, traceable event administration and an explicitly labelled demo experience.

**Client:** Abhilash Sridhara  
**Academic mentor:** Wenhao Liang (Eagle)  
**Host organisation:** Adelaide University

## Quick links

| Resource | Location |
|---|---|
| Source repository | [GitHub — secure-volunteer-platform](https://github.com/tanmoy-dewanjee/secure-volunteer-platform) |
| Student portal | [auvolunteers.online](https://auvolunteers.online) |
| Admin portal | [admin.auvolunteers.online](https://admin.auvolunteers.online) |
| Architecture | [`design/architecture.md`](design/architecture.md) |
| API specification | [`design/openapi.yaml`](design/openapi.yaml) |
| Security mapping | [`security/asvs.md`](security/asvs.md) |
| Test plan | [`qa/test-plan.md`](qa/test-plan.md) |

> **Deployment note:** The domains above are the URLs recorded in the project report; confirm they resolve and correspond to the final tested revision before submission. The earlier student preview URL was `https://secure-volunteer-platform.vercel.app`.

## Project status and milestones

The source archive contains working Next.js application code for both portals, database migrations and project documentation. Features and security controls should be considered **implemented in source**, not automatically independently validated in production. Final acceptance, test logs and the tested Git commit must be recorded in the handover package.

| Date | Milestone |
|---|---|
| 15 September 2026 | Design review: wireframes, schema, OpenAPI, ASVS and tests |
| 30 October 2026, 23:59 | Group technical report |
| 6 November 2026, 23:59 | Slide deck |
| 27 November 2026 | Live demonstration: 20 minutes plus 40 minutes Q&A |

## Technology and repository structure

| Layer | Technology / location | Purpose |
|---|---|---|
| Student frontend and routes | `mvp/` — Next.js 16, React 19, TypeScript, Tailwind CSS | Student discovery, applications, profile and volunteer flows |
| Admin frontend and routes | `admin/` — Next.js 16, React 19, TypeScript, Tailwind CSS | Event administration, attendance and operational views |
| Database and identity | Supabase PostgreSQL / Auth | Shared persistent data and authentication where configured |
| Database changes | `supabase/migrations/` | Ordered SQL migrations and synthetic seed data |
| Hosting | Vercel | Separate Student and Admin deployments |
| Design and governance | `design/`, `product/`, `security/`, `qa/`, `plan/`, `team/` | Requirements, architecture, security, testing and delivery evidence |

The two Next.js apps are separate deployments and use the **same Supabase project** when configured. The code also contains demo-data paths; do not assume those paths provide equivalent persistence or security guarantees.

## Core workflows

**Student portal:** Event browsing and filtering, event details, volunteer applications, profile and shift-related workflows, and recommendation/discovery interfaces.

**Admin portal:** Authentication, event creation/editing/deletion, application/volunteer management views, attendance-related functionality and audit-oriented administrative views.

**Security design:** Server-side authorisation checks, authentication/session controls, input validation and administrative audit mechanisms are documented in the security materials. See the client handover for the ASVS Level 1 control-by-control status, test evidence and unresolved risks. **Do not interpret a documented control as proof of a passed security test.**

**Recommendation scope:** The client requested recommendations based on location, department and similarity to the opened event. Verify each dimension against the final code and demo; document any unimplemented dimension as a limitation. Advanced AI/ML allocation was excluded from the agreed MVP.

## Local development

### Prerequisites

- Node.js compatible with Next.js 16 (Node.js **20.9 or later**).
- npm.
- Optional: a Supabase project for persistent, shared Student/Admin data.

### Start the Student portal

```bash
cd mvp
npm ci
npm run dev
```

Open <http://localhost:3000>.

### Start the Admin portal

In a **second terminal**, from the repository root:

```bash
cd admin
npm ci
npm run dev
```

Open <http://localhost:3010/login>. The Admin script explicitly uses port 3010.

> Do not publish or hard-code shared demo usernames/passwords in this README. Request current synthetic demo credentials from the project team through an appropriate private channel. Rotate any previously published credentials before deployment.

### Configure environment variables

Copy the appropriate example into each app's local file:

```bash
cp mvp/.env.example mvp/.env.local
cp admin/.env.example admin/.env.local
```

On Windows PowerShell:

```powershell
Copy-Item mvp/.env.example mvp/.env.local
Copy-Item admin/.env.example admin/.env.local
```

The exact required variables depend on whether the app uses demo fallback or Supabase-backed functionality. The example files include:

| Variable | Location | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Both | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both | Browser-safe public key used by configured Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Both, **server-only** | Privileged backend access; never expose to browser |
| `STUDENT_SESSION_SECRET` | Student | Student session signing/verification configuration |
| `ADMIN_SESSION_SECRET` | Admin | Admin session signing/verification configuration |
| `ADMIN_CSRF_SECRET` | Admin | Admin CSRF protection configuration |
| `ADMIN_ORIGIN` / `STUDENT_ORIGIN` | As shown in example files | Trusted application origins |
| `COOKIE_SECURE` | Both | Cookie transport configuration; use secure settings on HTTPS deployments |

Use the checked-in `.env.example` files as the authoritative variable inventory. Never commit `.env.local`, secrets, tokens, real account details or production database exports. Restart the development servers after changing environment files.

## Supabase database setup

Read [`supabase/README.md`](supabase/README.md) alongside these instructions. The archive contains **seven** SQL files, not only the first two mentioned in the older README:

| Order | File | Purpose indicated by filename |
|---|---|---|
| 1 | `0001_init.sql` | Initial schema |
| 2 | `0002_seed_demo.sql` | Synthetic demonstration seed |
| 3 | `0003_attendance.sql` | Attendance functionality |
| 4 | `0004_applications_submit.sql` | Application submission logic |
| 5 | `0005_asvs_rpc_grants.sql` | RPC privileges / security changes |
| 6 | `0006_signup_username.sql` | Username-related signup changes |
| 7 | `0007_fix_applications_rpc.sql` | Application RPC correction |

For a **fresh disposable demo database**, apply the migration scripts in numerical order through the Supabase SQL Editor or the team's migration workflow. Before doing so, inspect each SQL file for preconditions, re-run behaviour and dependencies. Do not run the synthetic seed against a real-user database. **Seven migration files do not mean seven successful migration tests:** record the actual execution results separately.

The previous `supabase/README.md` mentions only migrations 0001 and 0002 and includes public demo credentials; update that file consistently before publishing the repository.

## Quality checks

Run these commands independently in each application directory:

```bash
npm run lint
npm run build
```

The checked-in `package.json` files provide `dev`, `build`, `start` and `lint` scripts; **neither app currently declares an `npm test` script**. Follow [`qa/test-plan.md`](qa/test-plan.md) and the client handover's evidence register for manual/API/database/ASVS verification. Do not describe unexecuted checks as passed.

The final handover should record the test ID, date, environment, revision, tester, expected outcome, actual outcome, pass/fail result and evidence link. Include the outstanding security findings and their mitigation/acceptance decisions.

## Security, privacy and responsible demonstration

- The demo is not an official university platform. Keep the **Demo Website** notice visible across Student and Admin experiences.
- Use synthetic volunteer, event and account records only; never expose real student personal data.
- Restrict Admin actions with server-side authorisation, not merely hidden UI controls.
- Keep privileged Supabase keys and session secrets server-side and out of version control.
- Review [`security/asvs.md`](security/asvs.md), [`security/asvs-l1-scope.md`](security/asvs-l1-scope.md), [`security/threat-model.md`](security/threat-model.md), [`security/privacy-notice.md`](security/privacy-notice.md) and [`security/synthetic-data.md`](security/synthetic-data.md).
- Document unresolved controls, limitations and residual risks transparently. Do not claim full OWASP ASVS or accessibility compliance without completed evidence.
- Follow the approved data-retention/handover decision. The project notes call for wiping the hosted demo database at handover or by **27 November 2026**; confirm the timing and authorisation with the client before performing a destructive operation.

## Deployment and handover

The Student and Admin applications are deployed separately on Vercel and should point to the intended shared Supabase project. A production handover should include:

1. Verified Student/Admin URLs and the tested Git commit SHA.
2. Required environment-variable **names** and ownership (never secret values in the report).
3. Database migration and synthetic-data procedures, with backup/rollback precautions.
4. Smoke-test evidence for login, RBAC, Admin CRUD, audit records, Student discovery/applications and demo disclaimer.
5. Security verification results and outstanding risks, plus recovery steps for hosting or database downtime.
6. Client acceptance/approval evidence and the approved demo-data disposal procedure.

Do not assume Vercel Hobby or Supabase free-tier uptime. Follow the team's documented restart/recovery procedure and verify it before the final demo.

## Project documentation

| Area | Repository path |
|---|---|
| Requirements and prioritisation | [`product/requirements.md`](product/requirements.md), [`product/stories.md`](product/stories.md) |
| Wireframes and UI kit | [`design/wireframes/`](design/wireframes/), [`design/ui-kit.html`](design/ui-kit.html) |
| Architecture and schema | [`design/architecture.md`](design/architecture.md), [`design/schema.md`](design/schema.md) |
| OpenAPI | [`design/openapi.yaml`](design/openapi.yaml) |
| OWASP ASVS | [`security/asvs.md`](security/asvs.md), [`security/asvs-l1-scope.md`](security/asvs-l1-scope.md) |
| Privacy and threat model | [`security/privacy-notice.md`](security/privacy-notice.md), [`security/threat-model.md`](security/threat-model.md) |
| Synthetic data | [`security/synthetic-data.md`](security/synthetic-data.md) |
| QA and UAT | [`qa/test-plan.md`](qa/test-plan.md), [`qa/uat-consent.md`](qa/uat-consent.md) |
| Supabase setup | [`supabase/README.md`](supabase/README.md) |
| Team roles | [`team/people.md`](team/people.md) |
| Milestones and task board | [`plan/milestones.md`](plan/milestones.md), [`plan/tasks.csv`](plan/tasks.csv) |

### Design-only preview

The repository also includes static wireframes. From the repository root:

```bash
python -m http.server 8765
```

Open <http://127.0.0.1:8765/design/wireframes/index.html>. **This previews design assets; it does not run the Student or Admin applications.**

## Team

| Member | Responsibility |
|---|---|
| Tanmoy Dewanjee | Team Leader and Scrum Master |
| Mahima Hiteshkumar Shah | Frontend Engineering Lead |
| Kavyakumar Shaileshkumar Patel | Backend Lead |
| Nishanth Mogilicharla | Database and DevOps Lead |
| Jeet Amish Dalal | Security and DevSecOps Lead |
| Jay Mistry | QA and Testing Lead |

## Academic submission and provenance

This repository is part of the team's academic assessment and client demonstration. The assessor requested a **public repository preserving the genuine development commit history**, rather than a new one-commit copy. Provide the public repository URL and final tested SHA in the technical report and client handover.

The separate submission artefacts include the technical report (with project-management journey), client ASVS handover evidence, presentation, AI-use declaration and genuine approval/sign-off evidence. Optional multimedia demonstrations may be supplied separately.

**Current evidence status:** The README documents source structure and the expected verification process. It is not a substitute for dated test logs, deployed smoke checks or client sign-off.
