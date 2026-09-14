---
role: risk
owner: Tanmoy Dewanjee
email: a3198175@adelaide.edu.au
date: 2026-09-14
---

# Risk register

**Matrix:** Likelihood {Unlikely, Possible, Likely} × Impact {Low, Medium, High}.  
High if Likely+High or Possible+High. Medium if Possible+Medium or Likely+Medium. Else Low.  
Host has no published matrix in the brief; this is the team matrix (Week 03). Proposal numbers mapped into labels.

Owner is the person who runs the mitigation, not the only person affected.

| ID | Risk | L | I | Rating | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|
| R01 | Scope creep (full brief vs client Must) | Likely | High | High | MoSCoW sign-off today; cut Should/Could first | Tanmoy | Open — pack in `plan/moscow-signoff.md` |
| R02 | Team member unavailable / uneven load | Possible | High | High | Board CSV, 12-hour blocker rule, pair on silos | Tanmoy | Watch |
| R03 | Requirements ambiguity / late feedback | Possible | Medium | Medium | Design gate today; minutes capture decisions | Tanmoy | Open today |
| R04 | Auth / RBAC defect | Possible | High | High | ASVS table + RBAC matrix; Jeet on every write PR | Jeet | Open until M6 tests |
| R05 | Schema / data integrity | Unlikely | Medium | Low | Schema + OpenAPI this gate; constraints in SQL | Nishanth | Mitigating |
| R06 | Next.js / Supabase integration delay | Possible | Medium | Medium | Prototype in M5 week 1, not week 2 | Kavya / Nishanth | Watch |
| R07 | Vercel / Supabase free-tier outage at demo | Unlikely | High | Low | Deploy early; screenshot + local fallback | Nishanth | Watch |
| R08 | Prototype mistaken for official AU system | Unlikely | High | Low | Persistent Demo Website banner (wired in UI kit) | Mahima / Nishanth | Mitigating |
| R09 | Insufficient testing / late defects | Possible | High | High | Test plan with unit/RBAC/UAT scripts this gate | Jay | Open until M6 |
| R10 | Real PII in seeds or UAT | Possible | High | High | Synthetic-data rule; UAT consent; wipe path | Jeet / Jay | Open |
| R11 | GitHub Projects rejected as Gantt of record | Possible | Low | Low | CSV imports to Asana/TeamGantt without new WBS | Tanmoy | Watch |
| R12 | M4 shown today before 19 Sep calendar window | Likely | Low | Low | Artefacts ready for this Tuesday; calendar M4 window still used for revisions | Tanmoy | Accepted |
| R13 | Brand tokens differ from official 2026 AU kit | Unlikely | Medium | Low | Wireframes use adelaide.edu.au Dark Blue / Bright Blue / Purple / Limestone | Mahima | Mitigating |

Review this table every Tuesday. Close a row only with evidence (test log, sign-off, deploy URL).
