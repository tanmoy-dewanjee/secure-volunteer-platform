---
role: governance
owner: Tanmoy Dewanjee
email: a3198175@adelaide.edu.au
date: 2026-09-14
---

# MoSCoW sign-off pack

**Meeting:** Tuesday 15 Sep 2026 — client Abhilash Sridhara, mentor Wenhao Liang (Eagle), team C262T-4104.  
**Ask:** Sign the Must list so we do not rebuild the original spreadsheet-era brief in full before 27 Nov.

Stories: `product/stories.md`. Screens: `design/wireframes/index.html`.

## Must — demo fails without these

1. Persistent **Demo Website** banner and AU-styled chrome  
2. Sign in / register (Admin seeded; public register is Student)  
3. Admin **event CRUD** (title, location, department, schedule, description; soft delete)  
4. Student **explore**, **filter** (location, department, search)  
5. **Recommendations** on the opened event: location, department, similarity — opened event excluded  
6. Server-side **RBAC**, validation, credential protection, **audit** of Admin event mutations  
7. Live URL on **Vercel** with synthetic data only  

## Should — after Must is UAT-able on Vercel

Volunteer profile; apply for a role; Admin review; application status.

## Could — only if Must is idle

Shift allocation; student view of assigned shifts; attendance.

## Won’t

University SSO/HR/payroll; native apps; payments; SMS; paid pentest; real student PII; high-availability.

## Decision record

| Question | Team position | Client (tick) | Mentor (tick) |
|---|---|---|---|
| Recommendations are Must (client 11 Aug) | Agree | | |
| Shifts and attendance are Could | Agree | | |
| Stack stays Next.js + Supabase + Vercel | Agree | | |
| GitHub Projects + `plan/tasks.csv` as board ($0) | Agree; import elsewhere if required | | |
| No application code until this pack is accepted | Agree | | |

**Signed (name / date)**

- Client: ______________________________  
- Mentor: ______________________________  
- Team lead: Tanmoy Dewanjee, 14 Sep 2026  

If unsigned today, we still freeze Must as above until a written change. Scope change goes through this table, not chat.
