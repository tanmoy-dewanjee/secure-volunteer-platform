# Secure Volunteer and Event Coordination Platform

Student **demo** for Adelaide University Industry Research Project **A01** (team C262T-4104). Not an official university system. Do not enter real personal data.

## Demo accounts (synthetic)

- `admin@demo.local`
- `student@demo.local`

Passwords: set locally; never commit them.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Deploy

Vercel Hobby. Set the same env vars in the Vercel project. Seed synthetic events only (`security/synthetic-data.md`).

## Docs

- Requirements / MoSCoW: `product/requirements.md`
- API: `design/openapi.yaml`
- Schema: `design/schema.md`
- ASVS: `security/asvs.md`
- Tests: `qa/test-plan.md`
- Privacy: `security/privacy-notice.md`

## Licence / handover

Course artefact. Wipe the hosted database at handover or 27 Nov 2026.
