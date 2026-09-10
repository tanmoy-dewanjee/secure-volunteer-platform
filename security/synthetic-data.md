---
role: security
owner: Jeet Amish Dalal
email: a1988846@adelaide.edu.au
date: 2026-09-10
---

# Synthetic data rule


## Rule

Every seed, screenshot, progress note, report figure, and demo click uses **fake** people and events.

Allowed: obviously fake emails (`alex.demo@example.edu.au`), invented event titles, campus names that exist as public geography, lorem descriptions.

Not allowed:

- Classmates’ real emails, student IDs, or phone numbers
- Scraped staff directories
- Production spreadsheets from any club or faculty
- Health, political, or union membership data “to make the demo realistic”

## How we will implement it (M5)

- A committed `prisma/seed` or SQL seed file with ~8 events and 2 demo accounts: `admin@demo.local` and `student@demo.local` (or Supabase test users documented in README).
- Passwords only in Vercel env and a local `.env.example` placeholder, never a real reused password.
- If UAT testers type their own email, Jay’s consent script applies and we wipe on request.

## Breach of this rule

Delete the row, rotate any exposed demo password, tell Tanmoy the same day, and do not put the real data in git history. If it already landed in a commit, treat it as a secret leak (rewrite only if the Team Leader agrees and the commit has not been submitted for marking).
