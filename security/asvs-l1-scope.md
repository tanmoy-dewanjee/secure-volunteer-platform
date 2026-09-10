---
role: security
owner: Jeet Amish Dalal
email: a1988846@adelaide.edu.au
date: 2026-09-10
---

# ASVS 5.0 Level 1 scope

**Standard:** OWASP ASVS 5.0, Level 1 on **surfaces we ship**. We are not claiming Level 2/3 or a paid pentest.

## In scope (Must surfaces)

| Family | Why it is in | M5–M6 evidence |
|---|---|---|
| V2 Authentication | Client and proposal require sign-in | Supabase Auth, no custom hash in our tables |
| V3 Session | Stolen cookies would skip RBAC | HttpOnly session, logout, timeout as provider default |
| V4 Access control | Admin vs Student isolation | Server checks on every event write; Jay tests ACC-07 |
| V5 Validation | Event fields are attacker-controlled | Length, type, reject unexpected fields |
| V6 Cryptography (stored secrets) | No plaintext passwords | Provider-managed; no secrets in git |
| V7 Error handling | Stack traces must not hit the Student UI | Generic 4xx/5xx bodies in production |
| V8 Data protection | Classification | `design/data-classification.md` |
| V9 Communication | Demo is HTTPS on Vercel | No mixed-content admin actions |
| V14 Configuration | Env for Supabase URL/keys | `.env` gitignored; Vercel env vars |
| V15 LCM / malicious use | Dependency hygiene | Lockfile; no unused admin debug routes |

## Out of scope (documented, not ignored)

- Full ASVS Level 2/3
- Professional pentest (proposal exclusion)
- University SSO (proposal exclusion)
- Mobile app attestation
- Secrets in a vault product (Vercel env is enough for a $0 demo)

## Definition of Done for a security-relevant PR

1. Mentions the US-M story or ASVS family it touches
2. Jay has or updates an automated or UAT case
3. Jeet records pass/fail on the mapping row in `security/asvs.md`

Critical findings block merge to main (charter).
