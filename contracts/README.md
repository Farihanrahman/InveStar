# Soroban Contracts

This directory contains Soroban smart contracts for the InveStar project.

Current contract crates:

- `investar_remit`: remittance intent and status registry for transfer lifecycle tracking.

Typical commands once Rust and Stellar CLI are installed:

```bash
stellar contract build
cargo test
```

`investar_remit` is designed to store on-chain remittance metadata that is safe for chain use:

- sender address
- hashed recipient reference
- payout rail and corridor labels
- asset code and amount
- external and settlement reference hashes
- transfer status transitions: pending compliance -> approved -> funded -> settled/cancelled
