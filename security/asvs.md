---
role: security
owner: Jeet Amish Dalal
email: a1988846@adelaide.edu.au
date: 2026-10-27
---

# ASVS 5.0 evidence (Level 1 on shipped surfaces)

**Standard:** [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release) (May 2025).  
**Claim:** Level 1 on student (`mvp`) and admin portals.  
**Not claimed:** Level 2, Level 3, or a paid pentest. Full ASVS 5.0 is 17 chapters and hundreds of requirements; L2/L3 add HSM, nonce CSP, `__Host-` cookies, pentest, and controls this educational demo does not ship.

Scope: `security/asvs-l1-scope.md`. Official CSV: `v5.0.0-` requirement IDs below.

## Verdict

The apps now implement the **applicable ASVS 5.0 Level 1** controls for a cookie-session web app with password + TOTP, server RBAC, parameterized data access, and HTTPS headers. Chapters that do not apply (GraphQL, OAuth/OIDC as a client, file upload, WebRTC, SOAP, LDAP, native memory safety) are **N/A**, not failed.

## Chapter map

| Chapter | L1 on this product | Status | Proof |
|---|---|---|---|
| V1 Encoding and sanitization | XSS context encoding, URL encoding, parameterized queries, no `eval`, no OS/LDAP/XPath use | Pass | React text rendering (no `dangerouslySetInnerHTML`); Next.js JSON; Supabase client parameterized queries; HTML stripped on profile writes (`mvp/src/lib/security/http.ts` `plainText`) |
| V2 Validation and business logic | Server-side allowlists and sequential auth | Pass | Login/signup length and email allowlist; apply conflict check (`application-conflicts.ts`); password then TOTP before session |
| V3 Web frontend | HSTS, nosniff, CSP, Origin check, POST for writes, cookie flags | Pass with residual | `security/http-headers.ts`; Origin checks in `requireAdmin` / `requireTrustedOrigin`; SameSite cookies. Residual: CSP still allows `'unsafe-inline'`/`'unsafe-eval'` for Next.js; cookies are not `__Host-` prefixed |
| V4 API | JSON `Content-Type` from `NextResponse.json`; no GraphQL; no app WebSockets | Pass / N/A | REST App Router only. Supabase realtime, if used, is `wss://*.supabase.co` |
| V5 File handling | No binary upload | N/A | Resume field stores a filename only |
| V6 Authentication | Password verifier, lockout, generic errors, TOTP, recovery | Pass with residual | Student login 401 on failure (no local bypass); 5/15 min lockout; pending MFA cookie; generic errors. Residual: demo coordinator password is in source for the educational accounts |
| V7 Session | HttpOnly session cookies, logout, idle timeout, audience-bound admin JWT | Pass | Admin JWT `admin-portal` + 15 min; student Supabase HttpOnly cookie; `POST /api/auth/logout`; middleware verifies admin JWT |
| V8 Authorization | Deny by default, RBAC, IDOR bind | Pass | `requireAdmin(permission)`; student APIs bind to `auth.getUser()`; RLS in `0001_init.sql`; admin RPCs revoked from `anon` in `0005_asvs_rpc_grants.sql` |
| V9 Self-contained tokens | Admin session JWT signed, exp, aud | Pass | `admin/src/lib/auth/session.ts` HS256, audience, expiry. Production refuses a default secret |
| V10 OAuth and OIDC | Not used | N/A | Password + TOTP only. University SSO is a documented exclusion |
| V11 Cryptography | TLS in production; no home-rolled hashes | Pass | Passwords stored by Supabase Auth; TOTP via HMAC-SHA1; no password column in `profiles` |
| V12 Secure communication | HTTPS + HSTS header | Pass on deploy | Header always set; browsers apply HSTS only on HTTPS (Vercel) |
| V13 Configuration | Secrets in env, not `NEXT_PUBLIC_` for secret key | Pass | `getSupabaseAdmin` uses `SUPABASE_SECRET_KEY` only; `.env*` gitignored |
| V14 Data protection | Classification, no cache of PII APIs, robots on admin | Pass | `Cache-Control: no-store` on `/api/*`; admin `robots: noindex`; student cannot read another username when Supabase is on |
| V15 Logging | Generic client errors; no password/token logs | Pass with residual | Auth errors are generic. Residual: no SIEM; in-memory lockout is per process |
| V16 / V17 | WebRTC / other unused stacks | N/A | Not shipped |

## Requirement-level evidence (L1 we ship)

| ID | Control | Evidence |
|---|---|---|
| v5.0.0-1.2.1 | Contextual HTML encoding | React JSX text nodes; no `dangerouslySetInnerHTML` in `mvp` or `admin` src |
| v5.0.0-1.2.2 | URL encoding + safe protocols | `encodeURIComponent` on query params; OSM/Unsplash HTTPS only |
| v5.0.0-1.2.3 | JSON encoding | `NextResponse.json` |
| v5.0.0-1.2.4 | Parameterized DB access | `@supabase/supabase-js` queries; no string-concat SQL |
| v5.0.0-1.2.5 | OS command injection | No shell/exec in app code |
| v5.0.0-1.3.1 | HTML sanitization | No WYSIWYG; profile strings run through `plainText()` |
| v5.0.0-1.3.2 | No `eval` | No `eval` / `new Function` in src |
| v5.0.0-1.5.1 | XXE | No XML parser on untrusted input |
| v5.0.0-2.2.1 | Input validation | Length/type checks on auth, profile, applications |
| v5.0.0-2.2.2 | Server-side validation | All writes validated in Route Handlers, not only the browser |
| v5.0.0-2.3.1 | Sequential logic | Password success sets pending MFA cookie; TOTP required before admin session; student apply blocked on clash |
| v5.0.0-3.2.2 | Safe text rendering | React `textContent` path |
| v5.0.0-3.3.1 | Secure cookies | `secure` in production; HttpOnly on session/MFA cookies |
| v5.0.0-3.4.1 | HSTS ≥ 1 year | `Strict-Transport-Security: max-age=31536000; includeSubDomains` |
| v5.0.0-3.4.2 | CORS not `*` | No `Access-Control-Allow-Origin: *`; same-origin fetches |
| v5.0.0-3.5.1 | CSRF | `SameSite=strict` admin session + Origin/Referer allowlist on writes |
| v5.0.0-3.5.3 | Unsafe methods for writes | Mutations are POST/PUT/PATCH/DELETE |
| v5.0.0-4.1.1 | Content-Type | JSON APIs set `application/json` via Next |
| v5.0.0-6.x | Auth | Lockout 5 attempts / 15 min; generic 401; TOTP; no access token in login JSON |
| v5.0.0-7.x | Session | Admin JWT verified in `admin/src/proxy.ts`; logout clears cookies |
| v5.0.0-8.x | Authorization | RBAC permissions; student IDOR bind; RLS; anon cannot `list_all_applications` |

## Residuals (documented, not ignored)

1. Next.js needs `'unsafe-inline'` / `'unsafe-eval'` in CSP for the App Router (V3.4.3 is L2; still a real XSS amplifier).
2. Cookie names are not `__Host-` / `__Secure-` (v5.0.0-3.3.1 prefix).
3. Demo coordinator password `Coordinator1!` is in repo by design for the IRP demo.
4. Student UI still keeps `svp_session` in web storage for chrome; **authorization is the HttpOnly cookie**, not that value.
5. Lockout is in-memory (resets on process restart).
6. `email_confirm: true` on admin-created student users (demo convenience).
7. Hosted QR attendance tables still need `0003_attendance.sql` applied in Supabase.
8. Apply `0005_asvs_rpc_grants.sql` on the hosted project so anon cannot call admin RPCs.

## How to re-verify

1. Failed student login returns **401**, never `source: "local"`.
2. Login JSON has **no** `accessToken`.
3. `GET /api/profile?username=someoneelse` as student A returns **403**.
4. Response headers include CSP, HSTS, `X-Content-Type-Options`, `COOP`.
5. Admin write from a foreign `Origin` returns **403**.
6. Admin middleware rejects a forged `svp_admin_session` cookie that is not a valid JWT.
