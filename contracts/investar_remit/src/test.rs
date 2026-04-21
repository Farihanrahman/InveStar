#![cfg(test)]

extern crate std;

use super::{InveStarRemitContract, InveStarRemitContractClient, TransferStatus};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, BytesN, Env, String};

// ─── Helpers ─────────────────────────────────────────────────────────────────

fn bytes32(env: &Env, value: u8) -> BytesN<32> {
    BytesN::from_array(env, &[value; 32])
}

/// Returns (env, contract_id, admin, sender) — each test creates its own
/// client from env + contract_id to avoid returning a self-referential borrow.
fn setup() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(InveStarRemitContract, ());
    let client = InveStarRemitContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let sender = Address::generate(&env);
    client.initialize(&admin);
    (env, contract_id, admin, sender)
}

fn make_transfer(env: &Env, client: &InveStarRemitContractClient, sender: &Address, seed: u8) -> u64 {
    client.create_transfer(
        sender,
        &bytes32(env, seed),
        &String::from_str(env, "bkash"),
        &String::from_str(env, "US-BD"),
        &String::from_str(env, "USDC"),
        &100_0000000_i128,
        &bytes32(env, seed.wrapping_add(100)),
    )
}

// ─── Happy-path tests ─────────────────────────────────────────────────────────

#[test]
fn transfer_lifecycle_moves_through_expected_statuses() {
    let (env, contract_id, admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let transfer_id = client.create_transfer(
        &sender,
        &bytes32(&env, 7),
        &String::from_str(&env, "bkash"),
        &String::from_str(&env, "US-BD"),
        &String::from_str(&env, "USDC"),
        &250_0000000_i128,
        &bytes32(&env, 1),
    );

    let created = client.get_transfer(&transfer_id);
    assert_eq!(created.id, 1);
    assert_eq!(created.status, TransferStatus::PendingCompliance);

    client.approve_transfer(&admin, &transfer_id);
    assert_eq!(
        client.get_transfer(&transfer_id).status,
        TransferStatus::Approved
    );

    client.mark_funded(&admin, &transfer_id);
    assert_eq!(
        client.get_transfer(&transfer_id).status,
        TransferStatus::Funded
    );

    client.settle_transfer(&admin, &transfer_id, &bytes32(&env, 9));
    let settled = client.get_transfer(&transfer_id);
    assert_eq!(settled.status, TransferStatus::Settled);
    assert_eq!(settled.settlement_ref, Some(bytes32(&env, 9)));
}

#[test]
fn admin_can_cancel_after_approval() {
    let (env, contract_id, admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let transfer_id = client.create_transfer(
        &sender,
        &bytes32(&env, 4),
        &String::from_str(&env, "bank"),
        &String::from_str(&env, "UK-BD"),
        &String::from_str(&env, "USDC"),
        &50_0000000_i128,
        &bytes32(&env, 2),
    );

    client.approve_transfer(&admin, &transfer_id);
    client.cancel_transfer(&admin, &transfer_id);

    assert_eq!(
        client.get_transfer(&transfer_id).status,
        TransferStatus::Cancelled
    );
}

#[test]
fn sender_can_cancel_their_own_pending_transfer() {
    let (env, contract_id, _admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let transfer_id = make_transfer(&env, &client, &sender, 3);
    client.cancel_transfer(&sender, &transfer_id);

    assert_eq!(
        client.get_transfer(&transfer_id).status,
        TransferStatus::Cancelled
    );
}

// ─── Pagination test ──────────────────────────────────────────────────────────

#[test]
fn list_transfers_returns_paginated_results() {
    let (env, contract_id, _admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    for seed in 1u8..=3 {
        make_transfer(&env, &client, &sender, seed);
    }

    // First page — 2 results from the start
    let page1 = client.list_transfers(&0, &2);
    assert_eq!(page1.len(), 2);
    assert_eq!(page1.get(0).unwrap().id, 1);
    assert_eq!(page1.get(1).unwrap().id, 2);

    // Second page — 1 result after id=2
    let page2 = client.list_transfers(&2, &2);
    assert_eq!(page2.len(), 1);
    assert_eq!(page2.get(0).unwrap().id, 3);

    // Empty page — nothing after id=3
    let page3 = client.list_transfers(&3, &10);
    assert_eq!(page3.len(), 0);
}

// ─── Guard / error tests ──────────────────────────────────────────────────────

#[test]
fn double_initialize_is_rejected() {
    let (env, contract_id, admin, _sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);
    // Contract is already initialized by setup(); a second call must fail.
    let result = client.try_initialize(&admin);
    assert!(result.is_err());
}

#[test]
fn create_transfer_rejects_zero_amount() {
    let (env, contract_id, _admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let result = client.try_create_transfer(
        &sender,
        &bytes32(&env, 1),
        &String::from_str(&env, "bkash"),
        &String::from_str(&env, "US-BD"),
        &String::from_str(&env, "USDC"),
        &0_i128,
        &bytes32(&env, 2),
    );
    assert!(result.is_err());
}

#[test]
fn create_transfer_rejects_negative_amount() {
    let (env, contract_id, _admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let result = client.try_create_transfer(
        &sender,
        &bytes32(&env, 1),
        &String::from_str(&env, "bkash"),
        &String::from_str(&env, "US-BD"),
        &String::from_str(&env, "USDC"),
        &-500_i128,
        &bytes32(&env, 2),
    );
    assert!(result.is_err());
}

#[test]
fn non_admin_cannot_approve_transfer() {
    let (env, contract_id, _admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);
    let impostor = Address::generate(&env);

    let transfer_id = make_transfer(&env, &client, &sender, 5);

    // impostor is not the stored admin
    let result = client.try_approve_transfer(&impostor, &transfer_id);
    assert!(result.is_err());
}

#[test]
fn invalid_status_transition_is_rejected() {
    let (env, contract_id, admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let transfer_id = make_transfer(&env, &client, &sender, 6);

    // PendingCompliance → Funded skips Approved — must be rejected
    let result = client.try_mark_funded(&admin, &transfer_id);
    assert!(result.is_err());
}

#[test]
fn settled_transfer_cannot_be_cancelled() {
    let (env, contract_id, admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let transfer_id = make_transfer(&env, &client, &sender, 7);
    client.approve_transfer(&admin, &transfer_id);
    client.mark_funded(&admin, &transfer_id);
    client.settle_transfer(&admin, &transfer_id, &bytes32(&env, 99));

    // Settled → Cancelled is not a valid transition
    let result = client.try_cancel_transfer(&admin, &transfer_id);
    assert!(result.is_err());
}

#[test]
fn third_party_cannot_cancel_another_senders_transfer() {
    let (env, contract_id, _admin, sender) = setup();
    let client = InveStarRemitContractClient::new(&env, &contract_id);
    let stranger = Address::generate(&env);

    let transfer_id = make_transfer(&env, &client, &sender, 8);

    // stranger is neither sender nor admin
    let result = client.try_cancel_transfer(&stranger, &transfer_id);
    assert!(result.is_err());
}
