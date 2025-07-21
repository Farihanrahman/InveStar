import React, { useEffect, useState } from 'react';
import WalletCard from '../components/WalletCard';
import { Keypair } from '@stellar/stellar-sdk';
import Server from '@stellar/stellar-sdk';

const server = new Server('https://horizon-testnet.stellar.org');

export default function Home() {
  const [publicKey, setPublicKey] = useState('');
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    // Generate a new testnet keypair (for demo)
    const keypair = Keypair.random();
    setPublicKey(keypair.publicKey());

    // Fund the account using Friendbot (testnet only)
    fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
      .then(() => {
        // Fetch balances after funding
        server.loadAccount(keypair.publicKey()).then(account => {
          setBalances(account.balances);
        });
      });
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <WalletCard
        publicKey={publicKey}
        balances={balances}
        onCopyAddress={() => navigator.clipboard.writeText(publicKey)}
        onViewExplorer={() => window.open(`https://stellar.expert/explorer/testnet/account/${publicKey}`, '_blank')}
      />
    </div>
  );
}
