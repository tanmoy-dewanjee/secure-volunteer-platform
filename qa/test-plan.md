---
role: qa
owner: Jay Mistry
email: a1987916@adelaide.edu.au
date: 2026-09-14
---

# Test plan

Unit, RBAC, and UAT scripts for Must. Should/Could stay listed, not scripted.  
**Traces:** `product/stories.md`, `design/openapi.yaml`, `security/asvs.md`, `qa/uat-consent.md`.  
**Tools (M5+):** Vitest for unit/RBAC; Playwright against the Vercel URL for UAT.

## Defects

GitHub Issue `bug`. Severity: Critical (auth bypass, PII leak) / High (CRUD broken, recs wrong) / Medium / Low. Critical/High block M6 Done.

---

## Unit scripts

Run in CI on every PR that touches API or validation.

### U-01 Register and login (ACC-01, US-M03)

1. Register `unique@demo.local` / 12+ char password / display name → 201, `role=student`.
2. Login with same credentials → 200 and user payload.
3. Login with wrong password → 401, no session.
4. Register with `role: admin` in the body → still `role=student` (threat model).

### U-02 Event validation (ACC-09, US-M13)

1. Title `""` → 400.
2. Title length 121 → 400.
3. `endsAt` before `startsAt` → 400.
4. Extra property `createdBy` in body is ignored or 400; row `created_by` is the session user.

### U-03 Recommendations (ACC-04, US-M10)

Given events A (opened, Adelaide City, Student Life, title “Open Day wayfinding”), B same location, C same department different location, D similar title, E unrelated, and A must not appear in any of the three arrays.

### U-04 Audit (ACC-10, US-M14)

Admin PATCH event → one `event.update` row, metadata without cookies. Student PATCH → 403 and **no** new audit success row.

---

## RBAC matrix (ACC-07, US-M11–12)

| Call | No cookie | Student | Admin |
|---|---|---|---|
| POST /api/auth/login | 200/401 | — | — |
| GET /api/auth/session | 401 | 200 student | 200 admin |
| GET /api/events | 401 | 200 | 200 |
| POST /api/events | 401 | **403** | 201 |
| PATCH /api/events/{id} | 401 | **403** | 200 |
| DELETE /api/events/{id} | 401 | **403** | 204 |
| GET /api/events/{id}/recommendations | 401 | 200 | 200 |
| GET /api/admin/audit | 401 | **403** | 200 |

Automate this table as one Vitest file `rbac.events.test.ts`. A single 200 where 403 is required is Critical.

---

## UAT scripts

Consent first (`qa/uat-consent.md`). Synthetic accounts only.

Demo users (M5 seed): `admin@demo.local` / `student@demo.local`.

### UAT-01 Banner and chrome (ACC-08, US-M01–02)

1. Open the live URL signed out → still see **Demo Website** if we later add a public landing; once signed in, banner on Student and Admin.
2. Banner is readable and not dismissible.
3. Footer says Adelaide University.

Pass / fail: ____

### UAT-02 Student explore and filter (ACC-03, US-M08–09)

1. Sign in as Student.
2. Explore shows at least two synthetic events.
3. Set location to Adelaide City → Mawson Lakes event disappears.
4. Set department to Libraries → only library-tagged rows.
5. Impossible filter → empty state, not a stack trace.

Pass / fail: ____

### UAT-03 Recommendations (ACC-04, US-M10)

1. Open “Open Day wayfinding”.
2. Rail has a same-location card, a same-department card, a similar-title card (or fewer if seed is thin — note it).
3. The opened title is not in the rail.

Pass / fail: ____

### UAT-04 Admin CRUD (ACC-02, US-M04–07)

1. Sign in as Admin (or review shortcut in wireframes today).
2. Create event with location + department.
3. See it on the Admin list and on Student explore (second browser/profile).
4. Edit title; Student sees new title.
5. Delete; confirm; Student no longer sees it.

Pass / fail: ____

### UAT-05 Student cannot mutate (ACC-07)

1. As Student, request `POST /api/events` (browser devtools or Jay’s Playwright).
2. Expect 403. Explore unchanged.

Pass / fail: ____

Should UAT (apply, profile) and Could UAT (shift, attendance) are **not** in this gate.

---

## Exit for M6

All Must unit + RBAC automated. UAT-01–05 recorded with date and tester initials. Waivers only in writing by Tanmoy + Jeet.
