---
role: qa
owner: Jay Mistry
email: a1987916@adelaide.edu.au
date: 2026-09-10
---

# Test plan (skeleton)

**Traces to:** `product/stories.md`

## Levels

| Level | Tool (M5+) | Owner |
|---|---|---|
| Unit | Vitest | Author of the module; Jay reviews Must coverage |
| Access control | Vitest against API handlers | Jay + Jeet |
| UAT | Playwright against Vercel URL + this script | Jay |
| Security regression | ASVS L1 checklist | Jeet; Jay logs defects |

## Cases (Must first)

| Id | Story | Type | Priority | Happy | Fail |
|---|---|---|---|---|---|
| ACC-01 | US-M03 | UAT + unit | Must | Register/login as Student and as Admin | Bad password; unknown email |
| ACC-02 | US-M04–07 | UAT + unit | Must | Admin CRUD on an event | Student POST /events → 403 |
| ACC-03 | US-M08–09 | UAT | Must | Explore list; filter by location and department | Empty filter result is an empty state, not an error splash |
| ACC-04 | US-M10 | UAT | Must | Open event; rail shows location, department, similarity | Opened event is not recommended as itself |
| ACC-07 | US-M11–12 | unit | Must | Cross-role writes denied | Session cookie stripped → 401 |
| ACC-08 | US-M01 | UAT | Must | Banner visible on Student and Admin chrome | — |
| ACC-09 | US-M13 | unit | Must | Overlong title / script tag rejected | — |
| ACC-10 | US-M14 | unit | Must | Admin update writes an audit row | Student update attempt writes nothing |
| ACC-05 | US-S02 | UAT | Should | Apply for a role | — |
| ACC-06 | US-C01–03 | UAT | Could | Shift + attendance | — |

## Defects

Log in GitHub Issues (or the Project) as `bug` with severity Critical / High / Medium / Low. Critical/High OWASP items block M6 Done.

## Exit for M6

All Must rows above have a recorded run (pass or waived in writing by Tanmoy + Jeet). UAT run uses `qa/uat-consent.md`.
