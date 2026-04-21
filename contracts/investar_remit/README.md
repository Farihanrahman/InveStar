# investar_remit — Soroban Remittance Contract

**Status:** Compiles and tests pass · Not yet deployed (Phase 1 T3 M3.3 deliverable)  
**Network:** Stellar testnet (deployment target)  
**Licence:** MIT  
**SDK:** soroban-sdk 23.0.1

---

## Purpose

`investar_remit` models the remittance transfer lifecycle on Stellar. It provides a typed, auth-guarded state machine that tracks every transfer from compliance review through to final settlement — forming the foundation for the Phase 2 `AutoInvestVault` contract that will automate on-chain DSE investing.

---

## State machine

```
PendingCompliance → Approved → Funded → Settled
                ↘                    ↗
                       Cancelled
```

| Transition | Who can trigger |
|------------|----------------|
| `PendingCompliance → Approved` | Admin only |
| `PendingCompliance → Cancelled` | Admin or original sender |
| `Approved → Funded` | Admin only |
| `Approved → Cancelled` | Admin or original sender |
| `Funded → Settled` | Admin only |

Any other transition panics with `InvalidStatusTransition`.

---

## Public interface

### `initialize(admin: Address)`

Initialises the contract with an admin address. Can only be called once — subsequent calls panic with `AlreadyInitialized`.

### `create_transfer(...) → u64`

Creates a new transfer in `PendingCompliance` status. Returns the assigned transfer ID.

| Param | Type | Description |
|-------|------|-------------|
| `sender` | `Address` | Authenticated sender (requires auth) |
| `recipient_hash` | `BytesN<32>` | SHA-256 hash of recipient identity |
| `payout_method` | `String` | e.g. `"bkash"`, `"bank"` |
| `corridor` | `String` | e.g. `"US-BD"` |
| `asset_code` | `String` | e.g. `"USDC"` |
| `amount` | `i128` | Must be > 0 |
| `external_ref` | `BytesN<32>` | External reference ID |

### `approve_transfer(admin, transfer_id)`
### `mark_funded(admin, transfer_id)`
### `settle_transfer(admin, transfer_id, settlement_ref: BytesN<32>)`
### `cancel_transfer(actor, transfer_id)`

State transition methods. Admin-only except `cancel_transfer` which also accepts the original sender.

### `get_transfer(transfer_id) → RemittanceTransfer`

Returns the full transfer struct.

### `next_transfer_id() → u64`

Returns the ID that will be assigned on the next `create_transfer` call.

### `list_transfers(start_after: u64, limit: u32) → Vec<RemittanceTransfer>`

Paginated transfer list. Pass `start_after=0` to start from the beginning.

---

## Error codes

| Code | Name | When |
|------|------|------|
| 1 | `AlreadyInitialized` | `initialize` called twice |
| 2 | `NotInitialized` | Contract used before `initialize` |
| 3 | `Unauthorized` | Wrong admin or wrong sender |
| 4 | `InvalidAmount` | `amount <= 0` |
| 5 | `TransferNotFound` | ID does not exist in storage |
| 6 | `InvalidStatusTransition` | Illegal state change attempted |

---

## Storage and TTL

Transfers are stored as **persistent** entries with:

- **Lifetime threshold:** 17,280 ledgers (~1 day) — TTL is extended when below this
- **Bump amount:** 518,400 ledgers (~30 days) — extended to this on every write

The admin address and next transfer ID counter use **instance** storage.

---

## Running tests

```bash
cargo test
```

11 tests covering:

- Full happy-path lifecycle (PendingCompliance → Approved → Funded → Settled)
- Admin cancel after approval
- Sender cancel of own pending transfer
- Paginated `list_transfers`
- Double-initialize rejection
- Zero and negative amount rejection
- Non-admin approval rejection
- Invalid status transition rejection
- Settled transfer cannot be cancelled
- Third-party cancel rejection

---

## Roadmap

| Phase | Contract | Round |
|-------|----------|-------|
| **Phase 1 (this round · T3 M3.3)** | `AutoInvestVault` — `on_settlement()` → INVEST event → Horizon SSE → DSE OMS trade | SCF #43 |
| **Phase 2** | `InvestRouter` + `VaultFactory` + `DSE Adapter` | Next SCF round |
| **Phase 3** | `YieldVault` DRR model | SCF round +2 |

All contracts will be published under MIT licence before the T3 payment is claimed.
