#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, Address, BytesN, Env,
    String, Symbol, Vec,
};

// ─── TTL constants ────────────────────────────────────────────────────────────
// 1 ledger ≈ 5 seconds  →  30 days ≈ 518 400 ledgers
const TRANSFER_LIFETIME_THRESHOLD: u32 = 17_280; // ~1 day  — extend when below this
const TRANSFER_BUMP_AMOUNT: u32 = 518_400; // ~30 days — extend to this

// ─── Types ───────────────────────────────────────────────────────────────────

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum TransferStatus {
    PendingCompliance,
    Approved,
    Funded,
    Settled,
    Cancelled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct RemittanceTransfer {
    pub id: u64,
    pub sender: Address,
    pub recipient_hash: BytesN<32>,
    pub payout_method: String,
    pub corridor: String,
    pub asset_code: String,
    pub amount: i128,
    pub external_ref: BytesN<32>,
    pub settlement_ref: Option<BytesN<32>>,
    pub status: TransferStatus,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    NextTransferId,
    Transfer(u64),
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
#[contracterror]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    TransferNotFound = 5,
    InvalidStatusTransition = 6,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct InveStarRemitContract;

#[contractimpl]
impl InveStarRemitContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, ContractError::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::NextTransferId, &1_u64);
    }

    pub fn admin(env: Env) -> Address {
        get_admin(&env)
    }

    pub fn create_transfer(
        env: Env,
        sender: Address,
        recipient_hash: BytesN<32>,
        payout_method: String,
        corridor: String,
        asset_code: String,
        amount: i128,
        external_ref: BytesN<32>,
    ) -> u64 {
        require_initialized(&env);
        sender.require_auth();

        if amount <= 0 {
            panic_with_error!(&env, ContractError::InvalidAmount);
        }

        let id = load_next_id(&env);
        let transfer = RemittanceTransfer {
            id,
            sender: sender.clone(),
            recipient_hash,
            payout_method,
            corridor,
            asset_code,
            amount,
            external_ref,
            settlement_ref: None,
            status: TransferStatus::PendingCompliance,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Transfer(id), &transfer);

        extend_transfer_ttl(&env, id);
        bump_next_id(&env, id + 1);

        env.events().publish(
            (Symbol::new(&env, "created"), id),
            (sender, amount),
        );

        id
    }

    pub fn approve_transfer(env: Env, admin: Address, transfer_id: u64) {
        require_admin(&env, &admin);
        update_status(&env, transfer_id, TransferStatus::Approved);

        env.events().publish(
            (Symbol::new(&env, "approved"), transfer_id),
            (),
        );
    }

    pub fn mark_funded(env: Env, admin: Address, transfer_id: u64) {
        require_admin(&env, &admin);
        update_status(&env, transfer_id, TransferStatus::Funded);

        env.events().publish(
            (Symbol::new(&env, "funded"), transfer_id),
            (),
        );
    }

    pub fn settle_transfer(
        env: Env,
        admin: Address,
        transfer_id: u64,
        settlement_ref: BytesN<32>,
    ) {
        require_admin(&env, &admin);

        let mut transfer = get_transfer_or_panic(&env, transfer_id);
        ensure_transition(&env, &transfer.status, &TransferStatus::Settled);
        transfer.status = TransferStatus::Settled;
        transfer.settlement_ref = Some(settlement_ref.clone());

        env.storage()
            .persistent()
            .set(&DataKey::Transfer(transfer_id), &transfer);

        extend_transfer_ttl(&env, transfer_id);

        env.events().publish(
            (Symbol::new(&env, "settled"), transfer_id),
            (settlement_ref,),
        );
    }

    pub fn cancel_transfer(env: Env, actor: Address, transfer_id: u64) {
        require_initialized(&env);
        actor.require_auth();

        let mut transfer = get_transfer_or_panic(&env, transfer_id);
        let admin = get_admin(&env);

        if actor != transfer.sender && actor != admin {
            panic_with_error!(&env, ContractError::Unauthorized);
        }

        ensure_transition(&env, &transfer.status, &TransferStatus::Cancelled);
        transfer.status = TransferStatus::Cancelled;

        env.storage()
            .persistent()
            .set(&DataKey::Transfer(transfer_id), &transfer);

        extend_transfer_ttl(&env, transfer_id);

        env.events().publish(
            (Symbol::new(&env, "cancelled"), transfer_id),
            (),
        );
    }

    pub fn get_transfer(env: Env, transfer_id: u64) -> RemittanceTransfer {
        require_initialized(&env);
        get_transfer_or_panic(&env, transfer_id)
    }

    /// Returns the next transfer ID that will be assigned on the next create_transfer call.
    pub fn next_transfer_id(env: Env) -> u64 {
        load_next_id(&env)
    }

    pub fn list_transfers(env: Env, start_after: u64, limit: u32) -> Vec<RemittanceTransfer> {
        require_initialized(&env);

        let mut results = Vec::new(&env);
        let next_id = load_next_id(&env);
        let mut cursor = if start_after == 0 { 1 } else { start_after + 1 };
        let mut remaining = limit;

        while cursor < next_id && remaining > 0 {
            let key = DataKey::Transfer(cursor);
            if env.storage().persistent().has(&key) {
                let transfer: RemittanceTransfer = env
                    .storage()
                    .persistent()
                    .get(&key)
                    .unwrap_or_else(|| panic_with_error!(&env, ContractError::TransferNotFound));
                results.push_back(transfer);
                remaining -= 1;
            }
            cursor += 1;
        }

        results
    }
}

// ─── Private helpers ─────────────────────────────────────────────────────────

fn require_initialized(env: &Env) {
    if !env.storage().instance().has(&DataKey::Admin) {
        panic_with_error!(env, ContractError::NotInitialized);
    }
}

fn get_admin(env: &Env) -> Address {
    require_initialized(env);
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::NotInitialized))
}

fn require_admin(env: &Env, admin: &Address) {
    let stored_admin = get_admin(env);
    admin.require_auth();
    if *admin != stored_admin {
        panic_with_error!(env, ContractError::Unauthorized);
    }
}

/// Load the next-to-be-assigned transfer ID from instance storage.
/// Named distinctly from the public `InveStarRemitContract::next_transfer_id` method.
fn load_next_id(env: &Env) -> u64 {
    require_initialized(env);
    env.storage()
        .instance()
        .get(&DataKey::NextTransferId)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::NotInitialized))
}

fn bump_next_id(env: &Env, next_id: u64) {
    env.storage()
        .instance()
        .set(&DataKey::NextTransferId, &next_id);
}

fn get_transfer_or_panic(env: &Env, transfer_id: u64) -> RemittanceTransfer {
    env.storage()
        .persistent()
        .get(&DataKey::Transfer(transfer_id))
        .unwrap_or_else(|| panic_with_error!(env, ContractError::TransferNotFound))
}

fn update_status(env: &Env, transfer_id: u64, next_status: TransferStatus) {
    let mut transfer = get_transfer_or_panic(env, transfer_id);
    ensure_transition(env, &transfer.status, &next_status);
    transfer.status = next_status;
    env.storage()
        .persistent()
        .set(&DataKey::Transfer(transfer_id), &transfer);
    extend_transfer_ttl(env, transfer_id);
}

fn ensure_transition(env: &Env, current: &TransferStatus, next: &TransferStatus) {
    let valid = matches!(
        (current, next),
        (TransferStatus::PendingCompliance, TransferStatus::Approved)
            | (TransferStatus::PendingCompliance, TransferStatus::Cancelled)
            | (TransferStatus::Approved, TransferStatus::Funded)
            | (TransferStatus::Approved, TransferStatus::Cancelled)
            | (TransferStatus::Funded, TransferStatus::Settled)
    );

    if !valid {
        panic_with_error!(env, ContractError::InvalidStatusTransition);
    }
}

/// Extend the TTL of a persistent transfer entry so it does not expire.
fn extend_transfer_ttl(env: &Env, transfer_id: u64) {
    env.storage().persistent().extend_ttl(
        &DataKey::Transfer(transfer_id),
        TRANSFER_LIFETIME_THRESHOLD,
        TRANSFER_BUMP_AMOUNT,
    );
}

mod test;
