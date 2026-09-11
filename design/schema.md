---
role: data
owner: Nishanth Mogilicharla
email: a3191407@adelaide.edu.au
date: 2026-09-11
---

# Schema (Must + stubs)

Implements `design/erd-outline.md`. Host: **Supabase PostgreSQL**. Auth secrets stay in Supabase Auth; `users.id` matches `auth.users.id`.

UUID primary keys. Timestamps `timestamptz`. Soft delete on events via `deleted_at`.

## Must tables

### users

Application profile. Created on first successful register/login webhook or insert from the API after Supabase Auth sign-up.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | Same as `auth.users.id` |
| email | citext unique not null | Account class |
| display_name | text not null | 1–80 chars |
| role | text not null | `admin` \| `student` check constraint |
| created_at | timestamptz not null default now() | |
| updated_at | timestamptz not null default now() | |

### events

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| title | text not null | 1–120 chars |
| description | text not null | 1–4000 chars |
| location | text not null | controlled list in M5 (Adelaide City, Mawson Lakes, Magill, Waite — public campus names on adelaide.edu.au) |
| department | text not null | controlled list in M5 |
| starts_at | timestamptz not null | |
| ends_at | timestamptz not null | check ends_at > starts_at |
| created_by | uuid not null FK users(id) | Admin who created; RBAC still checked in API |
| created_at | timestamptz not null default now() | |
| updated_at | timestamptz not null default now() | |
| deleted_at | timestamptz null | null = visible |

Indexes: `(location)`, `(department)`, `(starts_at)`, `(deleted_at)`.

### audit_logs

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| actor_id | uuid not null FK users(id) | |
| action | text not null | `event.create` \| `event.update` \| `event.delete` |
| entity_type | text not null | `event` |
| entity_id | uuid not null | event id even after soft delete |
| metadata | jsonb not null default '{}' | field names changed; **no passwords, no session tokens** |
| created_at | timestamptz not null default now() | |

No update/delete from the API. Index `(entity_type, entity_id)`.

## Recommendation (no table)

`GET /api/events/{id}/recommendations` reads other non-deleted events:

1. Same `location`, exclude self, limit 3
2. Same `department`, exclude self and already picked, limit 3
3. Similar `title`: `word_similarity` or `ILIKE` on significant tokens, exclude self, limit 3

## Should stubs (create empty tables in M5 so FKs exist; no UI)

- `profiles (user_id PK FK users, department text, campus text, bio text)`
- `volunteer_roles (id, event_id FK events, title, requirements, slots int)`
- `applications (id, volunteer_role_id, user_id, status text, created_at)` unique (volunteer_role_id, user_id)

## Could stubs

- `shifts (id, volunteer_role_id, user_id null, starts_at, ends_at)`
- `attendance (id, shift_id, user_id, present boolean, recorded_by FK users)`

## Row Level Security (intent)

Supabase RLS is defence in depth. The Next.js API still enforces RBAC (Jeet).

- `users`: select own row; admin select all
- `events`: select where `deleted_at is null` (all authenticated); insert/update/delete (soft) admin only
- `audit_logs`: insert from service role / server; select admin only

Exact policies are M5 SQL.
