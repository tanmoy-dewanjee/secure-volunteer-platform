---
role: product
ticket: A01
---

# Requirements

## Scope

Community organisations frequently rely on spreadsheets, email and social media to coordinate volunteers across multiple events. This creates risks relating to unauthorised access, accidental disclosure of personal information and inconsistent record keeping.

This project will design and develop a secure web-based platform that allows authorised coordinators to create events, advertise volunteer roles, manage applications, allocate shifts and record attendance. Volunteers should be able to maintain their own profiles and view their assigned activities.

The development process must apply an appropriate secure development framework, such as the OWASP Software Assurance Maturity Model, OWASP Application Security Verification Standard or a comparable framework. The final system should demonstrate secure authentication, role-based access control, input validation, secure data storage, audit logging and protection against common web application vulnerabilities.

**Host:** Adelaide University

**Skills:** Web development, database, programming

**Special requirements:** none

## Client constraints

- Client: Adelaide University / Abhilash
- Branding: follow AU branding guidelines; state that the site is a demo
- Standards: OWASP ASVS; document how it was applied
- Roles: Admin; Students (volunteers)
- Admin features: event CRUD
- Student features: explore events; filter events; recommended events by location, department, and similarity to the opened event

## MoSCoW

Stories with acceptance wording: `product/stories.md`. This section is the product lock.

**Must** — demo fails without these: Demo Website banner; AU branding; authentication; server-side RBAC (Admin vs Student); Admin event CRUD; Student explore, filter, and recommendations (location, department, similarity to the opened event); input validation; credential protection; audit log of sensitive Admin event mutations; ASVS 5.0 Level 1 on the surfaces we ship.

**Should** — proposal inclusions after Must is live: student-owned volunteer profile; apply for a role; Admin review; application status.

**Could** — proposal inclusions if Must UAT is green and calendar allows: shift allocation; student view of assigned shifts; attendance recording.

**Won’t** — university SSO/HR/payroll; native apps; payments; SMS; paid pentest; real student PII in seeds; high-availability scaling.

The original brief is wider than the client Must list. MoSCoW is the control (Week 07). If the increment slips, cut Should and Could, not Must.

## Stack (locked M2)

Next.js, TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth), Vercel. Actual demo spend $0 on hobby/free tiers.
