# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` branch | ✅ Active |
| Older branches | ❌ No patches |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Email us directly at **hello@investarbd.com** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fix (optional)

We will acknowledge receipt within **48 hours** and aim to provide a fix or mitigation within **7 days** for critical issues.

## Scope

This policy covers:

- The InveStar React frontend (`src/`)
- Supabase Edge Functions (`supabase/functions/`)
- Soroban smart contracts (`contracts/`)
- CI/CD configuration (`.github/`)

## Security practices in this codebase

- **Private keys** are never stored in source code. Stellar Ed25519 keys are managed via Azure Key Vault HSM (FIPS 140-2 L3) with JIT signing — keys never leave the HSM boundary.
- **Secrets** (Supabase service role keys, Stellar encryption keys) are stored in Supabase project secrets and CI/CD secret stores — never in `.env` files committed to the repo.
- **AES-GCM encryption** is applied to any wallet secrets stored server-side.
- **SEP-10 JWT + MFA** is required for all Stellar transaction flows.
- The **Check-Effect-Interaction** pattern is enforced in all financial transaction paths.
- Stellar TX hashes are used as **idempotency keys** to prevent double-spend.

## Disclosure

We follow responsible disclosure. Public disclosure is coordinated with the reporter after a fix is deployed.
