# InveStar Remittance Platform

InveStar is a cross-border remittance and investment platform that lets users send money internationally, manage a portfolio, trade through an OMS, and interact with Stellar-based payment rails — all from a single React application backed by Supabase and packaged for Android and iOS via Capacitor.

## Table of Contents

- [Codebase and Repository Scope](#codebase-and-repository-scope)
- [SCF Review Snapshot](#scf-review-snapshot)
- [Live Traction](#live-traction)
- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Architecture](#architecture)
- [Backend Microservices](#backend-microservices)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Development Workflows](#development-workflows)
- [Testing](#testing)
- [Supabase Functions and Data](#supabase-functions-and-data)
- [Stellar and MoneyGram Integration](#stellar-and-moneygram-integration)
  - [Data Flows — Three Delivery Tracks](#data-flows--three-delivery-tracks)
  - [Soroban Contract Map](#soroban-contract-map)
- [Soroban Smart Contract Roadmap](#soroban-smart-contract-roadmap)
- [Security Architecture](#security-architecture)
- [Mobile Build Notes](#mobile-build-notes)
- [Milestones and Budget](#milestones-and-budget)
- [Team](#team)
- [Documentation Index](#documentation-index)
- [Engineering Guidelines](#engineering-guidelines)
- [License](#license)
- [Contributing](#contributing)
- [Security Policy](#security-policy)
- [Ownership and Contacts](#ownership-and-contacts)
- [Troubleshooting](#troubleshooting)

## Codebase and Repository Scope

This public repository contains only a **curated subset** of the InveStar codebase intended to demonstrate architecture, Stellar integration patterns, and core product flows.

The majority of production services, custody implementations, treasury logic, and partner integrations are maintained in **private repositories** for intellectual property, security, and contractual reasons, including NDAs with infrastructure and brokerage partners. As a result, not all modules referenced in the architecture and SCF materials are visible here, but every capability described can be validated through:

- Public endpoints and demos
- On-chain activity and Soroban contract sources where applicable
- Selected open modules and documentation

This approach aligns with industry best practices for protecting sensitive financial and custody infrastructure while still giving reviewers enough transparency to assess the project.

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

## Live Traction

> InveStar is a **registered entity in MoneyGram's partner management system** with Stellar USDC Withdraw and Deposit products **ACTIVE** — not a letter of intent. This directly confirms milestones M1.2, M2.2, and the Module C FX infrastructure.

| Traction Metric | Verified Data |
|---|---|
| Testnet operations | 1,000+ · snapshot 2026-04-18 · verifiable on [stellar.expert/testnet](https://stellar.expert/explorer/testnet) |
| Mainnet activity | Verifiable on [stellar.expert/public](https://stellar.expert/explorer/public) — live mainnet accounts visible |
| Beta-user wallets on-chain | 993 Stellar accounts created via `stellar-ramp-service` |
| Mainnet accounts | 2 live · beta-limited · cutover Q2 2026 per SCF milestone plan |
| MoneyGram partner | Chain: Stellar · Asset: USDC · Withdraw, Deposit — **ACTIVE** confirmed |
| DSE OMS integration | Live in beta · only startup with direct Dhaka Stock Exchange integration |
| Capabilities shipped | 9 live: Stellar SDK · wallets · DEX swaps · fiat ramps · remittance · mobile · DSE OMS · dashboard |
| Live URLs | [app.investarbd.com](https://app.investarbd.com) · [app.investarbd.com/traction](https://app.investarbd.com/traction) · [oms-investar.dev.sandbox3000.com](https://oms-investar.dev.sandbox3000.com) |

**On-chain verification:**

| Network | Link |
|---------|------|
| Testnet explorer | [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet) |
| Testnet account example | [GBFKKNKO44IBRZYFMDPZMZCLWDZ57FV2XENUECMDTSKX3KDT6O26ZTNM](https://stellar.expert/explorer/testnet/account/GBFKKNKO44IBRZYFMDPZMZCLWDZ57FV2XENUECMDTSKX3KDT6O26ZTNM) |
| Mainnet explorer | [stellar.expert/explorer/public](https://stellar.expert/explorer/public) |

**Curl verify — on-chain operations:**

```bash
curl "https://horizon-testnet.stellar.org/accounts/GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR/operations?limit=200&order=desc"
```

**Demo video:** <https://www.youtube.com/shorts/NuoyWrr63Qg>

---

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

## Backend Microservices

All five backend modules are built around the Stellar rail. Module milestone mapping: **Mod A = M1.1–M1.2 · Mod B = M2.2 · Mod C = M2.1 · Mod D = M3.2–M3.3**. Azure Key Vault HSM FIPS 140-2 L3: private keys never leave the secure boundary.

> **Why Stellar — not Ethereum or Solana:** MoneyGram Ramps runs exclusively on Stellar SEP-24/10. Bangladesh Bank's USDC prohibition is solved by the SEP-12/24 compliance stack paired with MoneyGram's fiat conversion infrastructure. Stellar's $0.001 tx fee is the only way to hit ~1% all-in cost on a $50–200 transfer. The Soroban programmable investment layer is Stellar-native — no equivalent exists elsewhere for this corridor.

| Mod. | Service | Stellar Integration | Status |
|------|---------|-------------------|--------|
| A | `stellar-ramp-service` | SEP-10/24 · Horizon API · Azure Key Vault HSM JIT signing · USDC SAC | **Live on testnet** — 993 wallets · 1,000+ ops |
| B | `moneygram-transfer-service` | USDC → MG Transfer API · bKash/bank BDT delivery | **Sandbox tested** · MoneyGram onboarded |
| C | `treasury-conversion-service` | USDC → USD · MoneyGram FX conversion bridge (BD Bank compliance) | **Architecture complete** |
| D | `remit-to-invest-connector` | Horizon SSE → InveStar B2B DSE OMS (live, direct brokerage) · Soroban AutoInvestVault T3 | **DSE OMS live** · Soroban T3 |
| E | `ai-coach-service` | Horizon API read-only · tx history · fee savings display | Excluded from SCF budget |

**Tranches:** T1 MVP $43,600 · Wks 1–6 &nbsp;|&nbsp; T2 Testnet $45,225 · Wks 5–11 &nbsp;|&nbsp; T3 Mainnet $52,500 · Wks 10–16

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

Create `.env` in the repository root. Copy the template below and fill in your values.

```env
# Required
VITE_SUPABASE_URL=           # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY=  # Supabase public anon key
VITE_OMS_API_BASE_URL=       # OMS API domain or full base URL

# Optional (defaults applied in code)
VITE_OMS_APP_ID=InvestarOMS  # OMS app identifier sent by client integrations
VITE_OMS_API_VERSION=v1      # OMS API version selector
```

Notes:

- OMS base URL can be overridden at runtime from local storage (`OMS_API_BASE_URL_OVERRIDE`).
- Keep all secrets out of source control.
- Supabase Function secrets (`STELLAR_ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) are set in Supabase project secrets — not in the frontend `.env`.

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

This codebase includes implemented **Stellar transaction flows** (wallet lifecycle, USDC, DEX), an **initial-phase Soroban contract scaffold with tests**, and **fiat-ramp application workflows** aligned to an onboarded MoneyGram integration path while production SEP-24 endpoint cutover remains environment-gated.

### Integration Flows

- `USDC on Stellar`: trustline checks, creation, and signed USDC payments via Horizon using `stellar-usdc-transfer` (real transactions; network is configurable).
- `XLM/USDC DEX`: path finding, quotes, and signed path payments via `stellar-dex-swap` (real on-chain swaps on the selected network).
- `Fiat on/off-ramp (SEP-24-shaped)`: deposit and withdrawal orchestration via `stellar-anchor-ramp`—auth, wallet linkage, fees, transaction records, and interactive URL handoff. MoneyGram onboarding is complete; the repo currently uses development stand-ins for anchor endpoints and interactive URLs until production SEP-24 endpoint cutover.
- `MoneyGram ramps UI`: MoneyGram access/onboarding surface at `/moneygram-ramps`; onboarding is complete, and this page remains the product-side integration surface rather than the certified production SEP-24 flow itself.
- `Soroban remittance contract`: `contracts/investar_remit` is an early-stage contract scaffold for remittance lifecycle modeling and contract interface iteration.

### Edge Function Map

- `create-stellar-wallet`: creates Stellar keys and stores **AES-GCM–encrypted** secrets server-side.
- `stellar-usdc-transfer`: trustline and USDC payments via Stellar SDK; **defaults to testnet** (Friendbot can fund new testnet accounts); **mainnet is supported** when the client passes the mainnet network option—use explicit environment and rollout controls before production traffic.
- `stellar-dex-swap`: **live** XLM/USDC quotes and swaps on Horizon for **testnet or mainnet** (path payments, liquidity-dependent).
- `stellar-anchor-ramp`: ramp **workflow** with `moneygram` and `circle` options; MoneyGram onboarding is complete, but the current repo still uses **stub anchor metadata** and non-production interactive URLs until the production endpoints are wired in.
- `test-stellar`: utility endpoint for Stellar test operations.

### Data Flows — Three Delivery Tracks

**Track 1 — SEP-24 Cash Pickup (T1 MVP · M1.2)**

US/UAE sender → SEP-10 JWT auth + MFA → HSM JIT-signs USDC payment → Stellar 3–5s settlement → MoneyGram Ramps SEP-24 anchor → KYC webview → cash pickup reference → BDT cash pickup in Bangladesh.

| Step | Actor | Action |
|------|-------|--------|
| 1 | User | Initiates transfer with SEP-10 JWT + MFA |
| 2 | `stellar-ramp-service` | GET `/auth?account={pubkey}` — XDR challenge from MG anchor |
| 3 | Azure HSM | `signTransaction(challenge)` — Ed25519 inside HSM boundary |
| 4 | `stellar-ramp-service` | POST `/auth` signed challenge → JWT token |
| 5 | `stellar-ramp-service` | POST `/transactions/withdraw/interactive` → webview URL |
| 6 | User | Completes KYC inside MoneyGram webview |
| 7 | Azure HSM | JIT-signs USDC payment transaction |
| 8 | Stellar Network | `submitTransaction(signedXDR)` → TX hash · SCP 3–5s |
| 9 | `stellar-ramp-service` | Polls GET `/transaction?id={id}` until `status=complete` |
| 10 | Recipient | Collects BDT at MoneyGram agent with cash pickup reference |

**Track 2 — bKash / Bank Direct (T2 · M2.2)**

USDC settles on Stellar → `treasury-conversion-service` FX guardrail check → USDC→USD via MoneyGram FX → `moneygram-transfer-service` Quote→Payout → BDT credited direct to bKash or bank account. BD government 2.5% remittance incentive applied per transaction.

| Step | Actor | Action |
|------|-------|--------|
| 1 | User | Initiates transfer (SEP-10 JWT) |
| 2 | `stellar-ramp-service` | Submits HSM JIT-signed USDC payment → TX hash · 3–5s irreversible |
| 3 | `treasury-conversion-service` | `on_settlement(stellarTxHash, usdcAmount)` — FX + position guardrail check |
| 4 | MoneyGram FX | USDC→USD conversion (`idempotencyKey=txHash`) → float credited |
| 5 | `moneygram-transfer-service` | POST `/quote` + validate Pre-Payment Disclosure |
| 6 | MoneyGram Transfer API | POST `/reference-data` (bKash or bank) → payout channel confirmed |
| 7 | MoneyGram Transfer API | PUT `/transactions/{id}` confirm → `reference_number` · BDT delivered |
| 8 | Recipient | BDT credited to bKash or bank account |

**Track 3 — Remit-to-Invest: Horizon SSE → DSE Trade (T3 · M3.2–M3.3)**

No competitor combines Stellar settlement + DSE investing. Soroban `AutoInvestVault` automates this on-chain.

| Step | Actor | Action |
|------|-------|--------|
| 1 | Stellar Network | SSE payment event (USDC inbound to treasury) |
| 2 | `remit-to-invest-connector` | Filters: USDC? Above threshold? Invest toggle ON? |
| 3 | Soroban `AutoInvestVault` | `on_settlement(recipient, amount)` — reads `invest_bps` preference |
| 4 | Soroban `AutoInvestVault` | Calculates `invest_amount = amount × bps / 10000` · emits INVEST event on-chain |
| 5 | `remit-to-invest-connector` | Horizon SSE: INVEST event received |
| 6 | DSE OMS API | `executeTrade(instrument, invest_amount, ref=txHash)` → `trade_confirmation` |
| 7 | User | Push notification: transfer + investment complete · portfolio updated |

**Stellar vs SWIFT comparison:**

| Metric | SWIFT (traditional) | InveStar on Stellar |
|--------|--------------------|--------------------|
| Settlement time | 2–5 business days | 3–5 seconds |
| Cost per transaction | 3–7%+ | ~1% all-in |
| Transaction fee | $25–50 flat | $0.001 |
| Programmable investing | ❌ | ✅ Soroban AutoInvestVault |
| BDT delivery method | Bank wire | bKash · bank · cash pickup |

### Soroban Contract Map

- `contracts/investar_remit/src/lib.rs`: `InveStarRemitContract` — remittance transfer lifecycle state machine (PendingCompliance → Approved → Funded → Settled / Cancelled), with typed errors, auth guards, and TTL-managed persistent storage
- `contracts/investar_remit/src/test.rs`: Rust unit tests covering happy paths, invalid transitions, auth guards, pagination, and edge cases — run with `cargo test`
- `contracts/README.md`: contract workspace usage and purpose

**Current status:** The contract compiles and all tests pass in the Soroban sandbox. It is **not yet deployed** to testnet or mainnet (no contract address exists) and is **not yet called** from the frontend or any Supabase Edge Function. Phase 2 will deploy to Stellar testnet and wire the contract into the remittance flow (see planned tranches below).

### Frontend Integration Points

- `src/components/BackendStellarWallet.tsx`
- `src/components/USDCTransfer.tsx`
- `src/components/stellar/DexSwap.tsx`
- `src/components/FiatRamp.tsx`
- `src/pages/MoneyGramRamps.tsx`
- `src/pages/SendMoney.tsx`

### What's shipped vs planned (tranches)

- **In this repo now:** Encrypted wallet lifecycle; **real** on-chain USDC trustline and transfer flows; **real** DEX swap flows; fiat-ramp UX and orchestration APIs; Soroban contract workspace (`investar_remit`) with compiled, tested contract logic — **not yet deployed or integrated into the application**.
- **Current network posture:** Testnet is the default for Stellar operations. Mainnet-capable paths exist in code for USDC transfer and DEX and are gated behind explicit environment controls.
- **Phase 2 — Soroban deployment and integration:** Deploy `investar_remit` to Stellar testnet, wire a new `stellar-remit-contract` Supabase Edge Function to invoke it, and connect the remittance UI flow to the on-chain contract. This is the phase where the contract becomes a live feature.
- **Phase 1, Track 1 (SEP-24 MVP):** Replace stub anchor configuration and interactive URLs with live SEP-24 integrations against approved anchor environments, with production monitoring, reconciliation, and limit management.
- **Later tracks (e.g. Transfer API, bKash, broader rails):** Extend the Stellar integration and deployed Soroban contract into corridor-specific payout rails and automated investing flows described in `INVESTAR_AUTOMATION_PLAYBOOK.md`.

### Operational Notes

- Validate destination address format and transfer amount before initiating transactions.
- Expect and handle trustline/account initialization requirements before USDC transfers.
- Record transaction hashes and map them to internal transaction records for support and reconciliation.
- Add retries/backoff for transient Horizon/API failures.

## Soroban Smart Contract Roadmap

> **Open-Source Commitment (SCF Requirement):** All Soroban contracts will be published to [github.com/Farihanrahman/InveStar](https://github.com/Farihanrahman/InveStar) under MIT licence before Tranche 3 payment is claimed. This is a hard precondition for T3 release — verifiable via Stellar testnet deployment tx hash at M3.3.

| Phase | Round | Key Deliverable |
|-------|-------|----------------|
| **Phase 1** | This round (T3 · M3.3) | **AutoInvestVault** — replaces the live off-chain DSE OMS bridge with on-chain automation. `on_settlement()` → INVEST event → Horizon SSE → DSE trade. MIT OSS on GitHub. Also includes `PreferenceStore`: `set_preference()`, instrument + bps, TTL: 17,280 ledgers. |
| **Phase 2** | Next SCF round | **InvestRouter** — cross-contract calls · no off-chain bridge · Principal Invariant. **VaultFactory** — per-user isolated vaults (salt = SHA256(addr)). **DSE Adapter** — `DseAdapterTrait` deposit/withdraw. |
| **Phase 3** | SCF round +2 | **YieldVault** — DRR model · `APY_eff = APY_DeFi × (1−R)` · utility-backed Stellar DeFi TVL. Integration with Blend/DeFindex. |

**Current phase 1 contract (`investar_remit`) — transfer lifecycle state machine:**

```
PendingCompliance → Approved → Funded → Settled
                ↘                    ↗
                     Cancelled
```

State machine is implemented in `contracts/investar_remit/src/lib.rs` and fully tested via `cargo test`. Contract is **not yet deployed** — Phase 1 AutoInvestVault deployment to testnet is the T3 M3.3 deliverable.

## Security Architecture

InveStar uses a five-layer defence-in-depth model. Every request traverses all 5 layers before any Stellar transaction is signed.

| Layer | Control | Detail |
|-------|---------|--------|
| **1 · Network** | TLS 1.3 + rate limiting | Azure APIM per-user rate limits · anomaly detection on tx velocity |
| **2 · Auth** | SEP-10 JWT + MFA | Challenge-response with MoneyGram Ramps anchor · TOTP/OTP gate |
| **3 · Key Custody** | Azure Key Vault HSM FIPS 140-2 L3 | Ed25519 keys non-exportable · JIT sign inside HSM boundary · private key **never** in app memory (AES-256-GCM staging) |
| **4 · Application** | Check-Effect-Interaction pattern | Pending state written before external call · Stellar TX hash as idempotency key · AI coach hard-walled from tx paths |
| **5 · Compliance** | FX guardrail + AML/KYC | SEP-12 with MG anchor · FX rate tolerance checks · append-only audit log keyed to Stellar TX hash |

**Regulatory constraints handled by architecture:**

| Constraint | Architecture Impact |
|---|---|
| Bangladesh Bank USDC prohibition | Module C (`treasury-conversion-service`) is mandatory — USDC must be converted to USD outside Bangladesh via MoneyGram FX before any last-mile BDT delivery. Direct USDC receipt is blocked at code level. |
| MoneyGram Pre-Payment Disclosure | Enforced in Module B before every Transfer API call. Cannot be bypassed in retry flows. Validated against MG's compliance schema before Quote submission. |
| BD govt 2.5% remittance incentive | M3.5 reconciliation tooling calculates and logs the government bonus per transaction — aligned with Bangladesh Bank's formal incentive programme. |
| SCF Soroban open-source mandate | All Soroban contracts published under MIT licence at M3.3. Hard precondition for T3 payment. Verifiable via testnet deployment tx hash. Phase 2+3 contracts also committed to future OSS. |

## Mobile Build Notes

Capacitor configuration is in `capacitor.config.ts`.

Typical Android sync/build sequence:

```bash
npm run build
npx cap sync android
npx cap open android
```

For full release workflow details, use the deployment guide linked below.

## Milestones and Budget

**SCF Build Award #43 · Integration Track (Large) · $141,325 · 16 Weeks · May 1 – August 21, 2026**

$8,675 under the $150K cap. Back-weighted payments: 10% / 20% / 30% / 40%.

| Tranche | Focus | Cost | Weeks |
|---------|-------|------|-------|
| **T1 MVP** (3 milestones) | Stellar wallet + SEP-10/24 + MoneyGram Ramps (onboarded) | $43,600 | 1–6 |
| **T2 Testnet** (5 milestones) | Treasury + MG Transfer API + SEP-12 KYC + 50-user beta | $45,225 | 5–11 |
| **T3 Mainnet** (7 milestones) | Mainnet + remit-to-invest + Soroban OSS + mobile + SDK | $52,500 | 10–16 |
| **TOTAL** | | **$141,325** | ≤16 |

**Team rates:** Senior dev ×2 @ $80–85/hr (University of Toronto CS + Bristol MEng · Stellar TypeScript SDK + Azure HSM) · Mid dev ×1 @ $65–75/hr (React Native, integration testing, SDK documentation).

**Tranche 1 — MVP ($43,600 · Wks 1–6)**

| Milestone | Scope | Verifiable Proof |
|-----------|-------|-----------------|
| **M1.1 · $23,800** | Stellar Custodial Wallet Backend: NestJS + Stellar TypeScript SDK + Horizon API · Azure Key Vault HSM JIT signing · testnet deployment | Stellar testnet account address + first tx hash (stellar.expert) · HSM non-exportability log · GitHub: JIT signing · Horizon Postman collection |
| **M1.2 · $17,850** | SEP-10 Auth + SEP-24 MoneyGram Ramps: full withdrawal flow → webview → USDC → poll → ref · MoneyGram onboarding completed | Demo video: SEP-10→SEP-24→USDC tx→ref · testnet tx hash to MG anchor · SEP-10 JWT token log |
| **T1 QA · $1,950** | E2E integration tests for wallet creation, SEP-10 auth, SEP-24 withdrawal · QA coverage report | QA matrix M1.1+M1.2 pass/fail · zero P0/P1 bugs · public testnet URL |

**Tranche 2 — Testnet ($45,225 · Wks 5–11)**

| Milestone | Scope | Verifiable Proof |
|-----------|-------|-----------------|
| **M2.1 · $16,800** | USDC→USD via MoneyGram FX · FX guardrails + position limits + Pre-Payment Disclosure + idempotency (Stellar TX hash) + full audit trail | 100% unit test coverage FX+limits · E2E log: USDC→USD→float credited · idempotency: duplicate rejected |
| **M2.2 · $14,400** | MoneyGram Transfer API: Quote→Reference Data→Update · all 3 payout types (cash, bKash, bank) · retry logic | Sandbox $100 test: cash, bKash, bank · reference number logs · forced-failure retry video |
| **M2.3 · $5,250** | SEP-12 KYC exchange with MG anchor · AML checklist + data-retention policy | SEP-12 testnet demo · AML checklist · GitHub commit |
| **M2.4 · $6,500** | Full backend on Stellar testnet · 50 diaspora beta users: wallet→SEP-24→USDC→payout ref · backend monitoring | Live testnet URL + 50+ sessions · monitoring dashboard · Stellar community post |
| **T2 QA · $2,275** | Full regression SEP-10/24/12 + MG Transfer API · ≥80% test coverage | All 3 SEP + MG Transfer test report · coverage ≥80% · zero P0 bugs |

**Tranche 3 — Mainnet ($52,500 · Wks 10–16)**

| Milestone | Scope | Verifiable Proof |
|-----------|-------|-----------------|
| **M3.1 · $11,900** | All services to Stellar MAINNET · Azure HSM production · CI/CD · Grafana/BetterUptime · DR/HA + failover | First mainnet tx hash public · Grafana dashboard URL · DR failover report |
| **M3.2 · $16,800** | Horizon SSE → DSE OMS API · Stellar settlement → invest allocation · ≥3 test trades | Live mainnet: Stellar tx→invest→DSE trade (video) · ≥3 test trades · mainnet tx hashes |
| **M3.3 · $5,950** | Soroban AutoInvestVault Phase 1 · Stellar testnet deployment · public GitHub + MIT licence | GitHub: public repo + MIT licence ✅ · Stellar testnet deployment tx hash · README arch doc |
| **M3.4 · $10,500** | React Native mobile: custodial wallet (send/receive USDC) + SEP-24 + Horizon tx history + biometric auth · TestFlight (iOS) + Play Store Internal (Android) | iOS on TestFlight — USDC send confirmed · Android Play Store Internal · demo video |
| **M3.5 · $2,625** | Stellar tx alert stack · FX guardrail tuning · BD govt 2.5% incentive reconciliation · ≥5 live US→BD mainnet transactions | ≥5 live mainnet tx hashes · FX guardrail screenshot · MG Ramps mainnet approval |
| **M3.6 · $2,450** | TypeScript/JS SDK: Stellar wallet + SEP-10/24/12 + MG payout APIs · NPM package + hosted docs + quickstart | NPM package published · docs site live · external dev tester quickstart verified |
| **T3 QA · $2,275** | Full mainnet regression · load test ≥500 VU p95 <3s · real iOS + Android device testing · incident-response playbook | Load test ≥500 VU p95 <3s · real device screenshots · zero P0 bugs |

## Team

| Name | Role | Credentials |
|------|------|-------------|
| **Farihan Rahman** | CEO since 2023 | EIR Draper University (Silicon Valley) · Nasdaq Milestone Makers Fall 2025 (first Bangladeshi EdTech/FinTech) · O-1 + EB-2 NIW |
| **Shafkat Alam** | CTO since mid-2023 | University of Toronto CS · Leads all Stellar architecture + production code + team of 8 engineers |
| **Dipro Chowdhury** | COO since mid-2023 | Masters MEng University of Bristol · 10+ years capital markets investor · operations + legal |

[investarbd.com](https://investarbd.com) · [app.investarbd.com/traction](https://app.investarbd.com/traction) · [hello@investarbd.com](mailto:hello@investarbd.com) · [github.com/Farihanrahman/InveStar](https://github.com/Farihanrahman/InveStar)

## Documentation Index

**Architecture & SCF materials:**

- [`InveStar SCF ARCHITECTURE.html`](https://htmlpreview.github.io/?https://github.com/Farihanrahman/InveStar/blob/main/InveStar%20SCF%20ARCHITECTURE.html) — Interactive architecture document with Mermaid diagrams (C4, data flows, state machine, Gantt) — rendered view for SCF reviewers
- [`InveStar_Architecture_FULL 20Apr.pdf`](InveStar_Architecture_FULL%2020Apr.pdf) — Full technical architecture: C4 diagrams, data flow sequences, security model, Soroban roadmap, milestone detail, and regulatory constraints (SCF #43)
- [`InveStar_SCF_Brief architecture 20Apr.pdf`](InveStar_SCF_Brief%20architecture%2020Apr.pdf) — SCF reviewer brief: value metrics, module summary, MoneyGram traction evidence, security layers, milestones and team

**Developer guides:**

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

## Security Policy

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
