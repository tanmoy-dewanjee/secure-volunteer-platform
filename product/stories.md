---
role: product
ticket: A01
owner: Tanmoy Dewanjee
email: a3198175@adelaide.edu.au
---

# MoSCoW user stories


Roles: **Admin** and **Student**. Every Must screen below is what the 27 Nov demo fails without.

## Must

These are client constraints plus security the proposal already promised.

| Id | As a | I want | So that | Notes |
|---|---|---|---|---|
| US-M01 | visitor | to see a persistent Demo Website banner | I do not mistake this for an official university system | Copy: `design/demo-disclaimer.md` |
| US-M02 | visitor | AU-branded layout on every page | the demo matches host guidelines | `design/au-branding.md` |
| US-M03 | Student or Admin | to register and sign in | only authorised people use the portals | Supabase Auth |
| US-M04 | Admin | to create an event with title, location, department, and schedule | students can discover real-shaped data | CRUD |
| US-M05 | Admin | to edit an event | published details stay accurate | |
| US-M06 | Admin | to delete an event | cancelled work is not advertised | Soft-delete acceptable if audit keeps the row |
| US-M07 | Admin | to list all events I manage | I can find a record without a spreadsheet | |
| US-M08 | Student | to explore upcoming events | I can see what is on | |
| US-M09 | Student | to filter/search events | I can narrow by location and department | Client filter rule |
| US-M10 | Student | to open an event and see recommendations | I can find similar work | Location, department, similarity to the opened event |
| US-M11 | Student | to be denied Admin writes | I cannot change other people’s events | RBAC |
| US-M12 | Admin | to be denied another Admin’s destructive action without being signed in as Admin | sessions are actually checked | Server-side |
| US-M13 | any signed-in user | my input to be validated | garbage and injection do not land in the database | Jeet |
| US-M14 | security reviewer | to read an audit row when an Admin mutates an event | the spreadsheet-era “who changed this” gap is closed | |
| US-M15 | Student | my password to be stored only as a hash / IdP secret | a dump does not yield reusable credentials | Supabase Auth |

## Should

Build after Must is on Vercel and UAT-able. Still in the approved proposal.

| Id | As a | I want | So that |
|---|---|---|---|
| US-S01 | Student | to create and edit my volunteer profile | coordinators know who I am without emailing a spreadsheet |
| US-S02 | Student | to apply for a volunteer role on an event | I can express interest in-app |
| US-S03 | Admin | to review applications | I am not tracking interest in a shared inbox |
| US-S04 | Student | to see the status of my application | I am not chasing email |

## Could

Proposal inclusions. Demo can succeed without them if M6 is late.

| Id | As a | I want | So that |
|---|---|---|---|
| US-C01 | Admin | to allocate an approved volunteer to a shift | rostering is in the system |
| US-C02 | Student | to view my assigned shifts | I know where to be |
| US-C03 | Admin | to record attendance | the university has an auditable presence record |

## Won’t (this project)

| Id | Item | Why |
|---|---|---|
| US-W01 | University SSO / HR / payroll | Proposal exclusion |
| US-W02 | Native iOS or Android apps | Responsive web only |
| US-W03 | Payments or SMS | Proposal exclusion |
| US-W04 | Paid third-party pentest | Student project |
| US-W05 | Real student PII in seeds or screenshots | Ethics / Privacy Act |
| US-W06 | High-availability multi-region | Prototype |

## Screen list for wireframes

Must screens:

1. Sign in / register (Student and Admin can share the shell; role is a stored claim)
2. Admin event list
3. Admin event create/edit
4. Student explore (cards + filter)
5. Student event detail including recommendation rail
6. Shared chrome: AU header, demo banner, sign out

Should/Could screens are not drawn until Must wireframes are signed.

`design/wireframes/index.html`.
