# Secure Volunteer and Event Coordination Platform

Student demo for Adelaide University Industry Research Project **A01** (team **C262T-4104**). Not an official university system. Do not enter real personal data.

A web platform so authorised **Admin** coordinators can create events, and **Student** volunteers can explore, filter, and see recommendations. The 27 Nov demo must ship authentication, server-side RBAC, Admin event CRUD, audit of Admin event mutations, AU chrome, and a persistent Demo Website banner.

**Client:** Abhilash Sridhara  
**Mentor:** Wenhao Liang (Eagle)  
**Host:** Adelaide University

## Status

The design pack (wireframes, schema, OpenAPI, ASVS, tests) is ready for the 15 Sep 2026 client/mentor review.

| Date | Deliverable |
|---|---|
| 15 Sep 2026 | Design review (wireframes, schema, OpenAPI, ASVS, tests) |
| 30 Oct 2026 23:59 | Group report |
| 6 Nov 2026 23:59 | Slide deck |
| 27 Nov 2026 | Live demo (20 min + 40 min Q/A) |

## Stack (locked)

Next.js, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth), Vercel Hobby ($0).

## Preview the Must screens

No application server yet. From the repo root:

```bash
python -m http.server 8765
```

Then open [http://127.0.0.1:8765/design/wireframes/index.html](http://127.0.0.1:8765/design/wireframes/index.html).

UI kit: [design/ui-kit.html](design/ui-kit.html).

## Docs

| Topic | Path |
|---|---|
| Requirements / MoSCoW | `product/requirements.md`, `product/stories.md` |
| Wireframes | `design/wireframes/` |
| API | `design/openapi.yaml` |
| Schema | `design/schema.md` |
| Architecture | `design/architecture.md` |
| ASVS mapping | `security/asvs.md` |
| Privacy | `security/privacy-notice.md` |
| Tests / UAT | `qa/test-plan.md`, `qa/uat-consent.md` |
| Team / RACI | `team/people.md` |
| Board | `plan/tasks.csv`, `plan/milestones.md` |

## Environment

Copy `.env.example` when M5 starts. Never commit `.env` or real student data. Seeds are synthetic only (`security/synthetic-data.md`).

## Team

| Name | Role |
|---|---|
| Tanmoy Dewanjee | Team Leader and Scrum Master |
| Mahima Hiteshkumar Shah | Frontend Engineering Lead |
| Kavyakumar Shaileshkumar Patel | Backend Lead |
| Nishanth Mogilicharla | Database and DevOps Lead |
| Jeet Amish Dalal | Security and DevSecOps Lead |
| Jay Mistry | QA and Testing Lead |

## Handover

Wipe the hosted database at handover or 27 Nov 2026.
