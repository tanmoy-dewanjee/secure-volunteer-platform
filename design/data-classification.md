---
role: data
owner: Nishanth Mogilicharla
email: a3191407@adelaide.edu.au
date: 2026-09-11
---

# Data classification


Classification drives what the API may return to each role.

| Class | Meaning | Examples | Who may see it | Retention in this demo |
|---|---|---|---|---|
| Public demo | Safe on an unauthenticated explore page | Event title, published location name, department label, start/end, public description | Anyone, including signed-out visitors if we allow browse-before-login | Until Admin deletes / project handover wipe |
| Account | Identifies a demo user | Email, display name, role | Self; Admin may see name/email of applicants **if Should ships** | Wipe at handover |
| Volunteer profile (Should) | Extra student attributes | Department, campus, availability notes | Self; Admin reviewing an application | Wipe at handover |
| Operational (Could) | Roster and presence | Shift assignment, attendance flag | Assigned Student (own); Admin | Wipe at handover |
| Authentication secret | Credentials | Password hashes / Supabase Auth internals | Nobody in the app UI | Provider-managed; we never log them |
| Audit | Who did what to an event | Actor id, action, entity id, timestamp, IP if collected | Admin (read); Security Lead (export for evidence) | Keep for the demo period then wipe |
| Prohibited | Must not enter the system | Real student IDs, real personal emails of classmates, health data, TFNs | — | Do not store |

## Rules

- Default deny: a Student query never returns another Student’s account class.
- Event public demo fields are the recommendation inputs (location, department, plus a similarity key on the opened event).
- Audit rows are not a social feed. Do not render them on the Student portal.
- Seeds use class **Public demo** + fake **Account** only (`security/synthetic-data.md`).
