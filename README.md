# InveStar Remittance Platform

A TypeScript React application for portfolio tracking, OMS-backed trading workflows, wallet funding, and cross-border remittance experiences, with Supabase-powered backend functions and mobile packaging through Capacitor. Core backend services (`stellar-ramp-service`, `treasury-conversion-service`, `moneygram-transfer-service`) are maintained in separate repositories and are available for SCF panel review on request.

## Table of Contents

- [SCF Review Snapshot](#scf-review-snapshot)
- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Environment Template](#environment-template)
- [Development Workflows](#development-workflows)
- [Testing](#testing)
- [Supabase Functions and Data](#supabase-functions-and-data)
- [Stellar and MoneyGram Integration](#stellar-and-moneygram-integration)
- [Soroban Contract Map](#soroban-contract-map)
- [Mobile Build Notes](#mobile-build-notes)
- [Deployment Environments](#deployment-environments)
- [Documentation Index](#documentation-index)
- [Engineering Guidelines](#engineering-guidelines)
- [License](#license)
- [Contributing](#contributing)
- [Security](#security)
- [Ownership and Contacts](#ownership-and-contacts)
- [Troubleshooting](#troubleshooting)

## SCF Review Snapshot

This public repository now evidences the following parts of the InveStar scope claimed in the SCF application:

- React + TypeScript application for investor onboarding, portfolio, wallet, and remittance UX
- Supabase Edge Functions for Stellar wallet creation, USDC transfers, DEX swaps, and fiat-ramp workflow orchestration
- Capacitor mobile packaging for Android/iOS delivery
- Soroban smart contract workspace at [`contracts/`](contracts/) with an initial-phase `investar_remit` contract crate and Rust tests
- MIT licensing at the repository root for open-source reviewability

Current Soroban work in this repo is in the initial phase:

- `contracts/investar_remit`: an early-stage remittance contract scaffold for transfer lifecycle modeling
- Contract source: `contracts/investar_remit/src/lib.rs`
- Contract tests: `contracts/investar_remit/src/test.rs`
- Workspace manifest: `Cargo.toml`

SCF reviewers should treat this repository as the public evidence base for:

- frontend and mobile product surfaces
- Supabase-mediated Stellar integration flows
- initial-phase Soroban contract scaffolding and tests

Core backend microservices referenced in the application architecture remain in separate service repositories and can be shared with the SCF panel on request.

## Overview

This project combines:

- Portfolio and market monitoring
- OMS authentication and order flows
- Wallet and payment rails integration
- Soroban smart contract workspace for early-stage Stellar contract development
- AI-assisted chat/coaching surfaces
- Mobile-ready packaging for Android/iOS

The frontend runs on Vite + React. Backend integrations are handled through Supabase client calls and Supabase Edge Functions.

## Core Capabilities

- OMS login and session handling
- Dashboard, portfolio, orders, and virtual trading screens
- Watchlist with persisted user data and real-time prices
- Wallet operations and USDC transfer flows
- Initial-phase Soroban remittance contract scaffold
- Remittance and AI assistant pages
- Push notification plumbing for mobile clients

## Architecture

```text
React UI (pages/components)
  -> hooks + service layer (src/hooks, src/services/oms)
  -> API client + auth context (src/lib/api, src/lib/auth)
  -> Soroban contract workspace (contracts/*)
  -> External systems:
     - OMS APIs
     - Supabase (Auth, Postgres, Edge Functions)
     - Stellar / Soroban
     - Mobile runtime via Capacitor
```

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + Radix UI components
- TanStack Query
- Supabase (Auth, Postgres, Edge Functions)
- Soroban SDK / Rust workspace for Stellar smart contracts
- Axios for OMS/service API calls
- Capacitor for mobile app packaging

## Project Structure

```text
.
├── src/
│   ├── pages/                 # Route-level screens
│   ├── components/            # Reusable UI and feature components
│   ├── hooks/                 # Custom React hooks and API hooks
│   ├── services/oms/          # OMS service layer
│   ├── lib/api/               # API client/config/types
│   ├── lib/auth/              # OMS token/auth context utilities
│   └── integrations/supabase/ # Supabase client + generated types
├── supabase/
│   ├── functions/             # Edge Functions
│   ├── migrations/            # SQL migrations
│   └── config.toml            # Supabase local config
├── android/                   # Capacitor Android project
├── contracts/                 # Soroban smart contract crates (including investar_remit)
├── Cargo.toml                 # Rust workspace manifest for Soroban contracts
├── public/                    # Static assets
└── *.md                       # Integration and deployment docs
```

## Prerequisites

- Node.js 20+ (required for Vite 5 and the test suite; see `.nvmrc`)
- npm 9+ (default package manager in this guide)
- Git
- Supabase project credentials
- For Soroban contract work:
  - Rust / Cargo
  - Stellar CLI
- For mobile work:
  - Android Studio + JDK 17
  - Xcode (macOS) for iOS builds

## Quick Start

```bash
# 1) Install dependencies
npm install

# 2) Create a .env file in project root and add required variables

# 3) Start the development server
npm run dev
```

Open the app at the URL shown in terminal (typically `http://localhost:5173`).

## Environment Variables

Create `.env` in the repository root.

Required:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_OMS_API_BASE_URL=
```

Optional (with defaults in code):

```env
VITE_OMS_APP_ID=InvestarOMS
VITE_OMS_API_VERSION=v1
```

Notes:

- OMS base URL can be overridden at runtime from local storage (`OMS_API_BASE_URL_OVERRIDE`).
- Keep all secrets out of source control.

## Environment Template

Use this as a starting `.env` template:

```env
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_OMS_API_BASE_URL=

# Optional
VITE_OMS_APP_ID=InvestarOMS
VITE_OMS_API_VERSION=v1
```

Variable notes:

- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase public anon key used by frontend.
- `VITE_OMS_API_BASE_URL`: OMS API domain or full base URL.
- `VITE_OMS_APP_ID`: OMS app identifier sent by client integrations.
- `VITE_OMS_API_VERSION`: OMS API version selector.

## Development Workflows

### Available Scripts

```bash
npm run dev            # Start local dev server
npm run build          # Production build
npm run build:dev      # Development-mode build
npm run preview        # Preview production build locally
npm run lint           # Lint codebase
npm run typecheck      # TypeScript type-check without emitting files
npm run test           # Run the full test suite once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with V8 coverage report
```

### Common Local Flow

```bash
npm run lint
npm run build
npm run dev
```

For Soroban contract verification:

```bash
cargo test
stellar contract build
```

### Routing Overview

Primary routes are defined in `src/App.tsx`, including:

- `/auth`, `/dashboard`, `/portfolio`, `/orders`
- `/wallet`, `/fund-wallet`, `/send-money`
- `/ai-coach`, `/investar-ai`, `/remit`

## Testing

Automated tests are configured with **Vitest** + **React Testing Library** for unit/component coverage. The project requires **Node.js 20+** to run tests (`.nvmrc` pins this; run `nvm use` if using nvm).

Soroban contract tests are also included under `contracts/investar_remit/src/test.rs` and can be run with `cargo test`.

**Continuous integration:** On GitHub, the workflow `.github/workflows/ci.yml` runs on pushes and pull requests to `main`. It installs dependencies with `npm ci`, then runs the same checks below.

Current quality gate before merging (locally and in CI):

```bash
npm run test
npm run lint
npm run build
cargo test
```

Test command shortcuts:

```bash
npm run test           # Run the full test suite once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with V8 coverage report (requires @vitest/coverage-v8)
npm run typecheck      # Type-check without building
```

### Test coverage

| File | What is covered |
|------|----------------|
| `src/lib/validation.test.ts` | Stellar address format validation, `isValidStellarAddress`, transfer amount limits, password strength, email rules, sign-up/sign-in schemas, rate limiting, input sanitisation |
| `src/lib/auth/tokenStorage.test.ts` | OMS token set/get/remove, `hasOmsToken`, user data persistence (incl. malformed JSON recovery), auth provider switching |
| `src/lib/api/utils.test.ts` | `objectToApiQueryString` (nulls, encoding, nested objects), `extractErrorMessage` (axios shapes, plain Error, unknown), `isUnauthorizedError`, `isCancelledRequest` |
| `src/components/ui/button.test.tsx` | Button rendering and variant class application |
| `src/lib/utils.test.ts` | `cn` Tailwind class merging utility |
| `contracts/investar_remit/src/test.rs` | Early Soroban contract scaffold tests covering the current remittance lifecycle flow design |

Recommended manual smoke checks:

- Login/logout flow (`/auth`)
- Portfolio and watchlist rendering (`/portfolio`)
- Order and wallet screens (`/orders`, `/wallet`)
- AI/remittance screens (`/ai-coach`, `/remit`)

## Supabase Functions and Data

Edge Functions live under `supabase/functions/` and include services for:

- market data and historical prices
- wallet operations and transfer rails
- AI chat/coaching
- OMS auth proxying
- notifications and audit logging

Schema changes are tracked in `supabase/migrations/`.

## Stellar and MoneyGram Integration

This codebase includes implemented **Stellar transaction flows** (wallet lifecycle, USDC, DEX), an **initial-phase Soroban contract scaffold with tests**, and **fiat-ramp application workflows** that are being advanced toward live SEP-24 anchor integration.

### Integration Flows

- `USDC on Stellar`: trustline checks, creation, and signed USDC payments via Horizon using `stellar-usdc-transfer` (real transactions; network is configurable).
- `XLM/USDC DEX`: path finding, quotes, and signed path payments via `stellar-dex-swap` (real on-chain swaps on the selected network).
- `Fiat on/off-ramp (SEP-24-shaped)`: deposit and withdrawal orchestration via `stellar-anchor-ramp`—auth, wallet linkage, fees, transaction records, and interactive URL handoff. Anchor endpoints and interactive URLs are **development stand-ins**, not production MoneyGram or Circle SEP-24 yet.
- `MoneyGram ramps UI`: application and onboarding at `/moneygram-ramps` (product surface; distinct from certified production ramp integration).
- `Soroban remittance contract`: `contracts/investar_remit` is an early-stage contract scaffold for remittance lifecycle modeling and contract interface iteration.

### Edge Function Map

- `create-stellar-wallet`: creates Stellar keys and stores **AES-GCM–encrypted** secrets server-side.
- `stellar-usdc-transfer`: trustline and USDC payments via Stellar SDK; **defaults to testnet** (Friendbot can fund new testnet accounts); **mainnet is supported** when the client passes the mainnet network option—use explicit environment and rollout controls before production traffic.
- `stellar-dex-swap`: **live** XLM/USDC quotes and swaps on Horizon for **testnet or mainnet** (path payments, liquidity-dependent).
- `stellar-anchor-ramp`: ramp **workflow** with `moneygram` and `circle` options; uses **stub anchor metadata** and non-production interactive URLs until Phase 1 Track 1 (SEP-24 MVP) connects real anchor endpoints.
- `test-stellar`: utility endpoint for Stellar test operations.

### Soroban Contract Map

- `contracts/investar_remit/src/lib.rs`: initial-phase `InveStarRemitContract` scaffold for remittance lifecycle data structures and contract flow design
- `contracts/investar_remit/src/test.rs`: early Rust tests covering the current scaffolded lifecycle paths
- `contracts/README.md`: contract workspace usage and purpose

### Frontend Integration Points

- `src/components/BackendStellarWallet.tsx`
- `src/components/USDCTransfer.tsx`
- `src/components/stellar/DexSwap.tsx`
- `src/components/FiatRamp.tsx`
- `src/pages/MoneyGramRamps.tsx`
- `src/pages/SendMoney.tsx`

### Configuration and Secrets

Frontend `.env` (already listed above):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Supabase Function secrets (set in Supabase project secrets, not in frontend `.env`):

- `STELLAR_ENCRYPTION_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (used by selected functions)

### What's shipped vs planned (tranches)

- **In this repo now:** Encrypted wallet lifecycle; **real** on-chain USDC trustline and transfer flows; **real** DEX swap flows; fiat-ramp UX and orchestration APIs; Soroban contract workspace with an initial-phase `investar_remit` scaffold and Rust tests.
- **Current network posture:** Testnet remains the default environment for lower-cost iteration and integration testing. Mainnet-capable paths exist in code for selected Stellar operations and are intended to be enabled only with explicit environment, compliance, and operational controls.
- **Phase 1, Track 1 (SEP-24 MVP):** Replace stub anchor configuration and interactive URLs with live SEP-24 integrations against approved anchor environments, with production monitoring, reconciliation, and limit management.
- **Later tracks (e.g. Transfer API, bKash, broader rails):** Extend the current Stellar integration and initial Soroban scaffold into corridor-specific payout rails and automated investing flows described in `INVESTAR_AUTOMATION_PLAYBOOK.md`.

### Operational Notes

- Validate destination address format and transfer amount before initiating transactions.
- Expect and handle trustline/account initialization requirements before USDC transfers.
- Record transaction hashes and map them to internal transaction records for support and reconciliation.
- Add retries/backoff for transient Horizon/API failures.

## Mobile Build Notes

Capacitor configuration is in `capacitor.config.ts`.

Typical Android sync/build sequence:

```bash
npm run build
npx cap sync android
npx cap open android
```

For full release workflow details, use the deployment guide linked below.

## Deployment Environments

Use separate Supabase and OMS credentials per environment.

- `development`: local testing, non-production keys, debug logging enabled.
- `staging`: pre-release validation, production-like APIs with test data where possible.
- `production`: live credentials, hardened config, release-only changes.

Recommended file strategy:

- `.env.local` for developer machine overrides
- `.env.staging` for staging builds
- `.env.production` for production builds

For mobile builds, run `npm run build` before `npx cap sync <platform>` to keep web assets aligned.

## Documentation Index

- `DEPLOYMENT_GUIDE.md`
- `OMS_API_INTEGRATION.md`
- `OMS_LOGIN_INTEGRATION.md`
- `WATCHLIST_DOCUMENTATION.md`
- `MOBILE_ASSETS_GUIDE.md`

## Engineering Guidelines

- Keep feature logic in `services/` + `hooks/` and keep page components focused on orchestration.
- Prefer typed service interfaces over ad-hoc inline fetch logic.
- Run lint and build checks before opening a PR.
- For API or auth changes, update the corresponding integration docs.
- Avoid committing keys, tokens, or generated secret artifacts.

## License

This project’s source code is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 InveStar. Third-party dependencies are subject to their own licenses (see each package in `node_modules` or your lockfile / SBOM tooling).

## Contributing

Branch naming convention:

- `feature/<short-description>`
- `fix/<short-description>`
- `chore/<short-description>`

Commit message convention:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `chore: ...`

Pull request checklist:

- Run `npm run lint`
- Run `npm run build`
- Add screenshots for UI changes
- Update relevant docs (`README.md` or integration guides)
- Note environment/config changes in PR description

## Security

- Never commit credentials, tokens, private keys, or keystore passwords.
- Rotate keys immediately if accidental exposure occurs.
- Keep runtime secrets in environment variables or secure CI/CD secret stores.
- Validate auth and tenant headers for OMS-related changes.
- Review Supabase RLS and function access when changing data models.

## Ownership and Contacts

- OMS/API integration owner: `InveStar BD`
- Supabase functions and DB owner: `InveStar BD`
- Mobile release owner: `InveStar BD`
- Security escalation contact: `hello@investarbd.com`

## Troubleshooting

- `Missing VITE_* variables`: verify `.env` exists and restart the dev server.
- `401/403 from OMS`: confirm token state and `VITE_OMS_API_BASE_URL` value.
- `Supabase function errors`: verify project URL/key and function deployment status.
- `Capacitor build mismatch`: run `npm run build` then `npx cap sync <platform>` again.
