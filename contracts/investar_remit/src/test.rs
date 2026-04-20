#![cfg(test)]

extern crate std;

use super::{InveStarRemitContract, InveStarRemitContractClient, TransferStatus};
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, BytesN, Env, String};

fn bytes32(env: &Env, value: u8) -> BytesN<32> {
    BytesN::from_array(env, &[value; 32])
}

#[test]
fn transfer_lifecycle_moves_through_expected_statuses() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(InveStarRemitContract, ());
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);

    client.initialize(&admin);

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
    assert_eq!(client.get_transfer(&transfer_id).status, TransferStatus::Approved);

    client.mark_funded(&admin, &transfer_id);
    assert_eq!(client.get_transfer(&transfer_id).status, TransferStatus::Funded);

    client.settle_transfer(&admin, &transfer_id, &bytes32(&env, 9));
    let settled = client.get_transfer(&transfer_id);
    assert_eq!(settled.status, TransferStatus::Settled);
    assert_eq!(settled.settlement_ref, Some(bytes32(&env, 9)));
}

#[test]
fn admin_can_cancel_after_approval() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(InveStarRemitContract, ());
    let client = InveStarRemitContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let sender = Address::generate(&env);

    client.initialize(&admin);

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

    assert_eq!(client.get_transfer(&transfer_id).status, TransferStatus::Cancelled);
}
