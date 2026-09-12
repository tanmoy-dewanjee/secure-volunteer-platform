---
role: security
owner: Jeet Amish Dalal
email: a1988846@adelaide.edu.au
date: 2026-09-12
---

# ASVS 5.0 Level 1 mapping (Must surfaces)

**Standard:** OWASP ASVS 5.0, Level 1 only, on shipped routes in `design/openapi.yaml`.  
**We are not claiming L2/L3 or a paid pentest.** Scope: `security/asvs-l1-scope.md`.

Status column is the build target.

| ASVS (family) | Control we take | Where | Test | Status |
|---|---|---|---|---|
| V2 Auth | Register/login via Supabase Auth; min password length 12 | `/api/auth/*` | ACC-01 | Designed |
| V2 Auth | No password column in `users` | `design/schema.md` | Review | Designed |
| V2 Auth | Public register is `student` only; Admin seeded | OpenAPI register | ACC-07 | Designed |
| V3 Session | HttpOnly session cookie; logout clears it | `/api/auth/logout` | ACC-07 stripped cookie | Designed |
| V3 Session | `/api/auth/session` 401 when missing | session | ACC-01 | Designed |
| V4 Access | Server checks `role=admin` on POST/PATCH/DELETE `/events` | API | ACC-02, ACC-07 | Designed |
| V4 Access | Student GET events allowed; Student write 403 | API | ACC-07 | Designed |
| V4 Access | `/admin/audit` admin only | API | ACC-10 | Designed |
| V5 Validation | Title 1–120, description 1–4000, ends > starts, no extra fields | EventWrite | ACC-09 | Designed |
| V5 Validation | UUID path params; reject non-uuid | `/events/{id}` | unit | Designed |
| V5 Validation | Query `q` max 80 | GET /events | unit | Designed |
| V6 Crypto | Secrets only in env; never committed | `.env.example` | review | Designed |
| V7 Errors | JSON `{error, message}` without stack traces in production | all | UAT | Designed |
| V8 Data | Classification enforced: Student cannot list other accounts | RLS + API | ACC-07 | Designed |
| V8 Data | Audit metadata has no tokens | audit_logs | ACC-10 | Designed |
| V9 Comms | HTTPS on Vercel; cookies Secure in production | host | smoke | Designed |
| V14 Config | `NEXT_PUBLIC_*` never holds service role key | env list | review | Designed |
| V14 Config | Service role key server-only | API routes | review | Designed |
| V15 LCM | No debug admin route in production | architecture | review | Designed |

## PR rule

A security-relevant PR names the row it changes. Jay updates the matching ACC case. Critical/High findings block merge.
