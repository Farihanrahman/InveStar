'use client'

import React, { useEffect, useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

export default function Home() {
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function setupWallet() {
      try {
        setLoading(true);
        setError('');
        const keypair = StellarSdk.Keypair.random();
        setPublicKey(keypair.publicKey());

        const resp = await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);
        if (!resp.ok) throw new Error('Friendbot funding failed');
      } catch (e) {
        setError('Failed to create or fund testnet wallet.');
      } finally {
        setLoading(false);
      }
    }
    setupWallet();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ maxWidth: 600, margin: '3rem auto', textAlign: 'center' }}>
      <h1>InveStar Stellar Wallet Demo</h1>
      {loading && <p style={{color:'#39ff14',fontWeight:'bold'}}>Loading wallet...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && !error && publicKey && (
        <>
          <p style={{margin:'2rem 0 1rem'}}>Your Stellar Testnet Wallet Address:</p>
          <div style={{background:'#222',color:'#39ff14',padding:'1rem',borderRadius:8,wordBreak:'break-all',fontSize:'1.1rem'}}>{publicKey}</div>
          <button
            style={{marginTop:'1rem',padding:'0.5rem 1.5rem',background:'#39ff14',color:'#222',border:'none',borderRadius:6,fontWeight:'bold',cursor:'pointer'}}
            onClick={handleCopy}
            disabled={!publicKey}
          >
            {copied ? 'Copied!' : 'Copy Address'}
          </button>
          <div style={{marginTop:'1rem'}}>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{color:'#39ff14',textDecoration:'underline',fontWeight:'bold'}}
            >
              View on Stellar Expert
            </a>
          </div>
        </>
      )}
    </div>
  );
}