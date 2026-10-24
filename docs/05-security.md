# Security

Baseline: OWASP ASVS Level 2 and OWASP API Security Top 10. This doc is the threat model plus the checklist every release must pass.

## 1. Assets and trust boundaries

| Asset | Sensitivity | Notes |
|---|---|---|
| Farm business data (milk, sales, ledgers, costs) | High | Competitive and financial |
| Customer/staff PII (names, phones, salaries) | High | Privacy obligations |
| Credentials, tokens, PIN hashes, TOTP secrets | Critical | |
| Animal passport public data | Low (owner-chosen) | Public by design |
| Audit logs | High | Integrity matters |

Boundaries: internet -> Cloudflare -> proxy -> web/api; mobile -> api; api -> DB/Redis/S3; worker -> external providers. Each hop authenticates and validates.

## 2. Threats and controls

| Threat | Control |
|---|---|
| Cross-tenant data access (IDOR) | RLS on every table, composite FKs, API role without BYPASSRLS, per-table leak tests, object-level permission checks, opaque UUIDs |
| Broken authentication | Argon2id, rotating refresh tokens with reuse detection, lockout, rate limits, device binding for PIN logins, optional TOTP, session list and revoke |
| Credential stuffing / brute force | Per-IP and per-identifier throttling (Redis), exponential backoff, breached-password check, generic login errors, bot challenge (Cloudflare Turnstile) on public forms |
| Privilege escalation | Server-side `module.action` check per route, deny-by-default, role editing requires `roles.manage`, owner role cannot be removed from last owner, tests per permission |
| Injection (SQL/NoSQL/command) | Parameterized queries only (Drizzle / bound params), no string-built SQL; allowlisted sort/filter fields; strict Zod validation |
| XSS | React escaping, no `dangerouslySetInnerHTML` without sanitizer, nonce-based CSP, user content sanitized on PDF/report render |
| CSRF | SameSite=Lax cookies + double-submit CSRF token on state-changing web calls; mobile uses bearer tokens |
| SSRF / unsafe fetch | No user-supplied URLs fetched server-side; webhook/image URLs not accepted; egress allowlist for worker |
| File upload abuse | Size/type allowlist, magic-byte check, AV scan, EXIF stripped, private bucket, signed short-lived URLs, tenant-prefixed keys |
| Mass assignment / over-exposure | Strict DTOs in and out, no entity serialization |
| Replay / double-submit of money actions | Idempotency-Key, unique constraints, transactional ledger writes |
| DoS / abuse | Cloudflare WAF and rate limits, request size limits, pagination caps, export job quotas, queue backpressure |
| Secrets leakage | Secret manager / env only, secret scanning in CI, log redaction (tokens, passwords, phone/PIN), no PII in URLs |
| Supply chain | Lockfile pinned, Renovate with review, `pnpm audit` + OSV scan in CI, minimal dependencies, no postinstall scripts unless allowlisted |
| Insider/support access | Audited, time-boxed read-only impersonation; reason required; owner notified |
| Data loss / ransomware | PITR backups, offsite copy, restore tests, least-privilege cloud keys, deletion protection |
| Public passport scraping | Unguessable slug, rate limit, owner-chosen fields, revocation, no buyer/customer data |
| WhatsApp/SMS abuse | Opt-in tracking, per-farm send quotas, template-only messages, unsubscribe handling |
| Mobile device theft | Secure storage for tokens, optional app PIN/biometric lock, remote session/device revoke, local DB encrypted (SQLCipher or OS file protection) |

## 3. Authentication details

- Password policy: min 10 chars, no composition rules, breached-password reject, no max below 128.
- PIN: 6 digits, hashed with Argon2id + per-user salt, valid only on a registered device, 5 failures lock 15 min, owner can reset.
- OTP: 6 digits, 5 min TTL, single use, 3 attempts, resend throttled.
- Access token 10 min; refresh token 30 days rotating; reuse of an old refresh token revokes the family and notifies the user.
- Sensitive actions re-authenticate (change password/phone, disable 2FA, export all data, delete farm, void invoice over threshold).
- Account recovery by verified email/phone with cooldown; owner transfer needs 2FA when enabled.

## 4. HTTP security configuration

- CORS: exact-origin allowlist from env; `Vary: Origin`; credentials only for the web origin; preflight cached 10 min; no wildcard.
- Headers: `Content-Security-Policy` (nonce, `default-src 'self'`, no inline script), `Strict-Transport-Security` (2 years, preload), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera self only on scan routes; geolocation only on attendance), `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-site`, `frame-ancestors 'none'`. API responses: `Cache-Control: no-store` for authenticated data.
- Cookies: `__Host-` prefix, Secure, HttpOnly, SameSite=Lax.
- TLS 1.2+ only; HTTP redirected; internal traffic over private network with TLS to managed services.
- Errors never expose stack traces, SQL, or internal ids; request id shown for support.

## 5. Data protection and privacy

- Encryption in transit and at rest (managed DB/storage encryption; backups encrypted). Field-level encryption for TOTP secrets and provider API keys (envelope encryption, key rotation supported).
- Data minimization: collect only what features need; staff CNIC/ID numbers optional and encrypted.
- Per-farm export (JSON/CSV zip) and deletion with 90-day grace, then verified purge.
- Consent records for WhatsApp/SMS messaging to customers; audit of who exported what.
- Privacy policy, terms, and data processing summary published before pilot.

## 6. Logging, monitoring, response

- Structured logs with request id, farm id, user id (never secrets/PII bodies). Security events (login failures, token reuse, permission denials, role changes, exports, impersonation) go to a separate high-retention stream with alerts.
- Alerts: spike in 401/403/429, refresh-token reuse, RLS violation errors, queue failures, unusual export volume.
- Incident response runbook in docs/13: triage, contain (revoke sessions/keys), eradicate, recover, notify affected farms within 72 hours of confirmed personal-data breach, post-mortem.

## 7. Release security checklist

- [ ] RLS enabled on all new tables; leak test added and green
- [ ] Every new endpoint: authn, permission, Zod validation, rate limit, audit
- [ ] No new `any`/unsafe casts around auth or tenancy code
- [ ] Dependency and secret scans clean (or exceptions documented)
- [ ] CSP/CORS/headers verified in staging with automated header test
- [ ] Error responses reviewed for information leakage
- [ ] Upload and export paths tested with hostile files and large inputs
- [ ] Backup restore test within last quarter
- [ ] Penetration checklist run before GA (and external test before first 50 paying farms)
