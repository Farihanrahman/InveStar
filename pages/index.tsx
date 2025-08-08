import { useState, useEffect } from 'react'
import { Wallet, Copy, ExternalLink, Send, RefreshCw, AlertCircle, Download, Upload, History, Eye, EyeOff, DollarSign } from 'lucide-react'
import * as StellarSdk from '@stellar/stellar-sdk'

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')

interface Balance {
  asset_type: string
  asset_code?: string
  balance: string
}

interface WalletData {
  publicKey: string
  secretKey: string
}

export default function Home() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [balances, setBalances] = useState<Balance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'wallet' | 'send' | 'import' | 'history'>('wallet')
  const [sendForm, setSendForm] = useState({ destination: '', amount: '' })
  const [importForm, setImportForm] = useState({ secretKey: '', mnemonic: '' })
  const [transactions, setTransactions] = useState<any[]>([])
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [copied, setCopied] = useState(false)

  // MoneyGram state
  const [mgLoading, setMgLoading] = useState(false)
  const [mgError, setMgError] = useState<string | null>(null)
  const [mgQuote, setMgQuote] = useState<any>(null)
  const [mgTransfer, setMgTransfer] = useState<any>(null)
  const [mgForm, setMgForm] = useState({
    sourceAmount: '',
    sourceCurrency: 'USD',
    destinationCurrency: 'BDT',
    destinationCountry: 'BD',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    pickupLocation: ''
  })
  const [mgCountries] = useState([
    { code: 'BD', name: 'Bangladesh' },
    { code: 'IN', name: 'India' },
    { code: 'PH', name: 'Philippines' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'MX', name: 'Mexico' }
  ])
  const [mgCurrencies] = useState([
    { code: 'USD', name: 'US Dollar' },
    { code: 'BDT', name: 'Bangladeshi Taka' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'PKR', name: 'Pakistani Rupee' },
    { code: 'MXN', name: 'Mexican Peso' }
  ])

  // Create new wallet
  const createWallet = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const keypair = StellarSdk.Keypair.random()
      const newWallet = {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      }

      setWallet(newWallet)

      // Fund testnet account
      await fetch(`https://friendbot.stellar.org?addr=${newWallet.publicKey}`)

      // Get balances
      await loadBalances(newWallet.publicKey)
      await loadTransactions(newWallet.publicKey)

    } catch (err) {
      setError('Failed to create wallet')
    } finally {
      setIsLoading(false)
    }
  }

  // Load balances
  const loadBalances = async (publicKey: string) => {
    try {
      const account = await server.loadAccount(publicKey)
      setBalances(account.balances)
    } catch (err) {
      console.error('Error loading balances:', err)
    }
  }

  // Import wallet from secret key
  const importWallet = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let keypair
      if (importForm.secretKey) {
        keypair = StellarSdk.Keypair.fromSecret(importForm.secretKey)
      } else {
        setError('Please enter a secret key')
        setIsLoading(false)
        return
      }

      const newWallet = {
        publicKey: keypair.publicKey(),
        secretKey: keypair.secret()
      }

      setWallet(newWallet)
      await loadBalances(newWallet.publicKey)
      await loadTransactions(newWallet.publicKey)
      setImportForm({ secretKey: '', mnemonic: '' })

    } catch (err) {
      setError('Invalid secret key')
    } finally {
      setIsLoading(false)
    }
  }

  // Export wallet
  const exportWallet = () => {
    if (!wallet) return
    const data = {
      publicKey: wallet.publicKey,
      secretKey: wallet.secretKey,
      exported: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stellar-wallet-${wallet.publicKey.slice(0, 8)}.json`
    a.click()
  }

  // Load transaction history
  const loadTransactions = async (publicKey: string) => {
    try {
      const payments = await server.payments()
        .forAccount(publicKey)
        .order('desc')
        .limit(20)
        .call()
      setTransactions(payments.records)
    } catch (err) {
      console.error('Error loading transactions:', err)
    }
  }

  // Send payment
  const sendPayment = async () => {
    if (!wallet || !sendForm.destination || !sendForm.amount) return

    try {
      setIsLoading(true)
      setError(null)

      const sourceKeypair = StellarSdk.Keypair.fromSecret(wallet.secretKey)
      const account = await server.loadAccount(sourceKeypair.publicKey())

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: (await server.fetchBaseFee()).toString(),
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(StellarSdk.Operation.payment({
          destination: sendForm.destination,
          asset: StellarSdk.Asset.native(),
          amount: sendForm.amount,
        }))
        .setTimeout(30)
        .build()

      transaction.sign(sourceKeypair)
      await server.submitTransaction(transaction)

      setSendForm({ destination: '', amount: '' })
      await loadBalances(wallet.publicKey)
      await loadTransactions(wallet.publicKey)

    } catch (err) {
      setError('Payment failed. Please check the destination address and amount.')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy address
  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.publicKey)
      setCopied(true)
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }

  // MoneyGram functions
  const getMgQuote = async () => {
    if (!mgForm.sourceAmount || !mgForm.sourceCurrency || !mgForm.destinationCurrency) return

    try {
      setMgLoading(true)
      setMgError(null)

      // Simulate MoneyGram API quote
      const mockRate = mgForm.destinationCurrency === 'BDT' ? 110.5 :
                      mgForm.destinationCurrency === 'INR' ? 83.2 :
                      mgForm.destinationCurrency === 'PHP' ? 56.8 : 1

      const sourceAmt = parseFloat(mgForm.sourceAmount)
      const fees = sourceAmt * 0.05 // 5% fee
      const destinationAmt = (sourceAmt - fees) * mockRate

      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API delay

      const quote = {
        quoteId: 'MG' + Date.now(),
        sourceAmount: mgForm.sourceAmount,
        sourceCurrency: mgForm.sourceCurrency,
        destinationAmount: destinationAmt.toFixed(2),
        destinationCurrency: mgForm.destinationCurrency,
        exchangeRate: mockRate.toFixed(2),
        fees: fees.toFixed(2),
        totalAmount: (sourceAmt + fees).toFixed(2),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }

      setMgQuote(quote)
    } catch (err) {
      setMgError('Failed to get quote')
    } finally {
      setMgLoading(false)
    }
  }

  const createMgTransfer = async () => {
    if (!mgQuote || !mgForm.recipientName || !mgForm.recipientPhone) return

    try {
      setMgLoading(true)
      setMgError(null)

      await new Promise(resolve => setTimeout(resolve, 2000))

      const transfer = {
        transactionId: 'TX' + Date.now(),
        status: 'pending',
        recipientName: mgForm.recipientName,
        recipientPhone: mgForm.recipientPhone,
        pickupCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
        ...mgQuote
      }

      setMgTransfer(transfer)
    } catch (err) {
      setMgError('Failed to create transfer')
    } finally {
      setMgLoading(false)
    }
  }

  const commitMgTransfer = async () => {
    if (!mgTransfer) return

    try {
      setMgLoading(true)
      setMgError(null)

      await new Promise(resolve => setTimeout(resolve, 2000))

      setMgTransfer({...mgTransfer, status: 'completed'})
    } catch (err) {
      setMgError('Failed to commit transfer')
    } finally {
      setMgLoading(false)
    }
  }
  const refreshBalances = () => {
    if (wallet) {
      loadBalances(wallet.publicKey)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <header style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>
            InveStar Wallet
          </h1>
          <p style={{ margin: '10px 0 0', opacity: 0.9 }}>
            Stellar Blockchain Digital Wallet
          </p>
        </header>

        {/* Content */}
        <main style={{ padding: '40px' }}>
          {!wallet ? (
            // Welcome Screen
            <div style={{ textAlign: 'center' }}>
              <Wallet size={80} style={{ color: '#667eea', margin: '0 auto 30px' }} />
              <h2 style={{ marginBottom: '20px', color: '#333' }}>
                Welcome to InveStar Wallet
              </h2>
              <p style={{ color: '#666', marginBottom: '40px', fontSize: '18px' }}>
                Create your Stellar wallet to get started with blockchain payments
              </p>
              <button
                onClick={createWallet}
                disabled={isLoading}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 40px',
                  borderRadius: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
              </button>
            </div>
          ) : (
            // Wallet Interface
            <>
              {/* Tabs */}
              <nav style={{
                display: 'flex',
                borderBottom: '2px solid #f0f0f0',
                marginBottom: '30px'
              }}>
                {[
                  { key: 'wallet', label: 'Wallet', icon: Wallet },
                  { key: 'send', label: 'Send Money', icon: Send },
                  { key: 'import', label: 'Import', icon: Upload },
                  { key: 'history', label: 'History', icon: History }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    style={{
                      flex: 1,
                      padding: '15px',
                      border: 'none',
                      background: 'none',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: activeTab === key ? '#667eea' : '#999',
                      borderBottom: activeTab === key ? '3px solid #667eea' : '3px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    aria-label={`Switch to ${label} tab`}
                  >
                    <Icon size={20} />
                    {label}
                  </button>
                ))}
              </nav>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: '#fee',
                  border: '1px solid #fcc',
                  color: '#c33',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              {/* MoneyGram Error */}
              {mgError && (
                <div style={{
                  background: '#fee',
                  border: '1px solid #fcc',
                  color: '#c33',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertCircle size={20} />
                  {mgError}
                </div>
              )}

              {/* Wallet Tab */}
              {activeTab === 'wallet' && (
                <section>
                  {/* Address Section */}
                  <div style={{
                    background: '#f8f9ff',
                    border: '1px solid #e1e8ff',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '30px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{ margin: 0, color: '#333' }}>Wallet Address</h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={copyAddress}
                          style={{
                            background: copied ? '#4ade80' : '#667eea',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '14px'
                          }}
                          aria-label="Copy wallet address"
                        >
                          <Copy size={16} />
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`, '_blank')}
                          style={{
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '14px'
                          }}
                          aria-label="View on Stellar Explorer"
                        >
                          <ExternalLink size={16} />
                          Explorer
                        </button>
                      </div>
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      wordBreak: 'break-all',
                      color: '#333'
                    }}>
                      {wallet.publicKey}
                    </div>
                  </div>

                  {/* Balance Section */}
                  <div style={{
                    background: '#f8f9ff',
                    border: '1px solid #e1e8ff',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{ margin: 0, color: '#333' }}>Balances</h3>
                      <button
                        onClick={refreshBalances}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px'
                        }}
                        aria-label="Refresh balances"
                      >
                        <RefreshCw size={16} />
                        Refresh
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {balances.map((balance, index) => (
                        <div key={index} style={{
                          background: 'white',
                          padding: '20px',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: '#333' }}>
                              {balance.asset_type === 'native' ? 'XLM' : balance.asset_code}
                            </div>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              {balance.asset_type === 'native' ? 'Stellar Lumens' : 'Custom Asset'}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#667eea'
                          }}>
                            {parseFloat(balance.balance).toFixed(7)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Backup & Export Section */}
                  <div style={{
                    background: '#f8f9ff',
                    border: '1px solid #e1e8ff',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, color: '#333' }}>Backup & Export</h3>
                      <button
                        onClick={exportWallet}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '14px'
                        }}
                        aria-label="Export wallet"
                      >
                        <Download size={16} />
                        Export Wallet
                      </button>
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong style={{ color: '#f59e0b' }}>Secret Key (Keep Private!)</strong>
                        <button
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#667eea',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          aria-label={showSecretKey ? "Hide secret key" : "Show secret key"}
                        >
                          {showSecretKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          {showSecretKey ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        wordBreak: 'break-all',
                        color: '#333'
                      }}>
                        {showSecretKey ? wallet.secretKey : '•'.repeat(56)}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Send Tab - Merged Crypto & MoneyGram */}
              {activeTab === 'send' && (
                <section>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h3 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>Choose Transfer Method</h3>
                    <p style={{ margin: '10px 0 0', color: '#666' }}>Send crypto or cash worldwide</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {/* Crypto Transfer Card */}
                    <div style={{
                      background: '#f8f9ff',
                      border: '1px solid #e1e8ff',
                      borderRadius: '12px',
                      padding: '30px',
                      transition: 'all 0.3s ease',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '15px'
                        }}>
                          <Send size={24} color="white" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>Crypto Transfer</h4>
                          <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>Instant • Low fees</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <label htmlFor="destinationAddress" style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            Destination Address
                          </label>
                          <input
                            id="destinationAddress"
                            type="text"
                            value={sendForm.destination}
                            onChange={(e) => setSendForm({...sendForm, destination: e.target.value})}
                            placeholder="Enter Stellar address (G...)"
                            style={{
                              width: '100%',
                              padding: '15px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '16px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <div>
                          <label htmlFor="xlmAmount" style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            color: '#333'
                          }}>
                            Amount (XLM)
                          </label>
                          <input
                            id="xlmAmount"
                            type="number"
                            value={sendForm.amount}
                            onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
                            placeholder="0.0000000"
                            step="0.0000001"
                            min="0"
                            style={{
                              width: '100%',
                              padding: '15px',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              fontSize: '16px',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        <button
                          onClick={sendPayment}
                          disabled={isLoading || !sendForm.destination || !sendForm.amount}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '15px 30px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: (!isLoading && sendForm.destination && sendForm.amount) ? 'pointer' : 'not-allowed',
                            opacity: (!isLoading && sendForm.destination && sendForm.amount) ? 1 : 0.6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Send size={20} />
                          {isLoading ? 'Sending...' : 'Send XLM'}
                        </button>
                      </div>
                    </div>

                    {/* MoneyGram Transfer Card */}
                    <div style={{
                      background: '#fff9e6',
                      border: '1px solid #fbbf24',
                      borderRadius: '12px',
                      padding: '30px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '15px'
                        }}>
                          <DollarSign size={24} color="white" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>Cash Pickup</h4>
                          <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>200+ countries • 350K+ locations</p>
                        </div>
                      </div>

                      {!mgQuote && !mgTransfer && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div>
                            <label htmlFor="sendAmount" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                              Send Amount
                            </label>
                            <input
                              id="sendAmount"
                              type="number"
                              value={mgForm.sourceAmount}
                              onChange={(e) => setMgForm({...mgForm, sourceAmount: e.target.value})}
                              placeholder="100.00"
                              style={{
                                width: '100%',
                                padding: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <select
                              value={mgForm.sourceCurrency}
                              onChange={(e) => setMgForm({...mgForm, sourceCurrency: e.target.value})}
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}
                              aria-label="Source Currency"
                            >
                              {mgCurrencies.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                              ))}
                            </select>
                            <select
                              value={mgForm.destinationCurrency}
                              onChange={(e) => setMgForm({...mgForm, destinationCurrency: e.target.value})}
                              style={{
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '14px'
                              }}
                              aria-label="Destination Currency"
                            >
                              {mgCurrencies.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={getMgQuote}
                            disabled={mgLoading || !mgForm.sourceAmount}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '15px',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              cursor: (!mgLoading && mgForm.sourceAmount) ? 'pointer' : 'not-allowed',
                              opacity: (!mgLoading && mgForm.sourceAmount) ? 1 : 0.6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px'
                            }}
                          >
                            <DollarSign size={20} />
                            {mgLoading ? 'Getting Quote...' : 'Get Quote'}
                          </button>
                        </div>
                      )}

                      {mgQuote && !mgTransfer && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{
                            background: '#fff',
                            border: '1px solid #f59e0b',
                            borderRadius: '6px',
                            padding: '15px',
                            fontSize: '14px'
                          }}>
                            <div><strong>You Send:</strong> {mgQuote.sourceAmount} {mgQuote.sourceCurrency}</div>
                            <div><strong>They Get:</strong> {mgQuote.destinationAmount} {mgQuote.destinationCurrency}</div>
                            <div><strong>Fee:</strong> {mgQuote.fees} {mgQuote.sourceCurrency}</div>
                          </div>

                          <input
                            type="text"
                            value={mgForm.recipientName}
                            onChange={(e) => setMgForm({...mgForm, recipientName: e.target.value})}
                            placeholder="Recipient name"
                            style={{
                              padding: '12px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                            aria-label="Recipient Name"
                          />
                          <input
                            type="tel"
                            value={mgForm.recipientPhone}
                            onChange={(e) => setMgForm({...mgForm, recipientPhone: e.target.value})}
                            placeholder="Recipient phone"
                            style={{
                              padding: '12px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                            aria-label="Recipient Phone"
                          />

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => setMgQuote(null)}
                              style={{
                                flex: 1,
                                background: '#6b7280',
                                color: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer'
                              }}
                            >
                              Back
                            </button>
                            <button
                              onClick={createMgTransfer}
                              disabled={mgLoading || !mgForm.recipientName || !mgForm.recipientPhone}
                              style={{
                                flex: 2,
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: (!mgLoading && mgForm.recipientName && mgForm.recipientPhone) ? 'pointer' : 'not-allowed',
                                opacity: (!mgLoading && mgForm.recipientName && mgForm.recipientPhone) ? 1 : 0.6
                              }}
                            >
                              {mgLoading ? 'Creating...' : 'Create Transfer'}
                            </button>
                          </div>
                        </div>
                      )}

                      {mgTransfer && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                          <div style={{
                            background: mgTransfer.status === 'completed' ? '#dcfce7' : '#fff3cd',
                            border: `1px solid ${mgTransfer.status === 'completed' ? '#10b981' : '#f59e0b'}`,
                            borderRadius: '6px',
                            padding: '15px',
                            fontSize: '14px'
                          }}>
                            <div><strong>Status:</strong> <span style={{textTransform: 'capitalize'}}>{mgTransfer.status}</span></div>
                            <div><strong>Pickup Code:</strong> <code style={{background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px'}}>{mgTransfer.pickupCode}</code></div>
                            <div><strong>Amount:</strong> {mgTransfer.destinationAmount} {mgTransfer.destinationCurrency}</div>
                          </div>

                          {mgTransfer.status === 'pending' && (
                            <button
                              onClick={commitMgTransfer}
                              disabled={mgLoading}
                              style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: !mgLoading ? 'pointer' : 'not-allowed',
                                opacity: !mgLoading ? 1 : 0.6
                              }}
                            >
                              {mgLoading ? 'Processing...' : 'Complete Transfer'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setMgQuote(null)
                              setMgTransfer(null)
                              setMgForm({
                                sourceAmount: '',
                                sourceCurrency: 'USD',
                                destinationCurrency: 'BDT',
                                destinationCountry: 'BD',
                                recipientName: '',
                                recipientPhone: '',
                                recipientEmail: '',
                                pickupLocation: ''
                              })
                            }}
                            style={{
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              padding: '12px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              cursor: 'pointer'
                            }}
                          >
                            New Transfer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}


              {/* Import Tab */}
              {activeTab === 'import' && (
                <section style={{
                  background: '#f8f9ff',
                  border: '1px solid #e1e8ff',
                  borderRadius: '12px',
                  padding: '30px'
                }}>
                  <h3 style={{ margin: '0 0 30px', color: '#333' }}>Import Existing Wallet</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label htmlFor="secretKeyInput" style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        Secret Key (starts with S)
                      </label>
                      <input
                        id="secretKeyInput"
                        type="password"
                        value={importForm.secretKey}
                        onChange={(e) => setImportForm({...importForm, secretKey: e.target.value})}
                        placeholder="Enter your secret key"
                        style={{
                          width: '100%',
                          padding: '15px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    <button
                      onClick={importWallet}
                      disabled={isLoading || !importForm.secretKey}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: (!isLoading && importForm.secretKey) ? 'pointer' : 'not-allowed',
                        opacity: (!isLoading && importForm.secretKey) ? 1 : 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                      }}
                    >
                      <Upload size={20} />
                      {isLoading ? 'Importing...' : 'Import Wallet'}
                    </button>
                  </div>
                </section>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <section style={{
                  background: '#f8f9ff',
                  border: '1px solid #e1e8ff',
                  borderRadius: '12px',
                  padding: '30px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: 0, color: '#333' }}>Transaction History</h3>
                    <button
                      onClick={() => wallet && loadTransactions(wallet.publicKey)}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '14px'
                      }}
                      aria-label="Refresh transaction history"
                    >
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {transactions.length === 0 ? (
                      <div style={{
                        background: 'white',
                        padding: '40px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        color: '#666'
                      }}>
                        No transactions found
                      </div>
                    ) : (
                      transactions.map((tx: any, index: number) => (
                        <div key={index} style={{
                          background: 'white',
                          padding: '20px',
                          borderRadius: '8px',
                          border: '1px solid #e1e8ff'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '10px'
                          }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                                {tx.type_i === 1 ? 'Payment' : 'Transaction'}
                              </div>
                              <div style={{ fontSize: '14px', color: '#666' }}>
                                {new Date(tx.created_at).toLocaleString()}
                              </div>
                            </div>
                            <div style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              background: tx.transaction_successful ? '#dcfce7' : '#fee2e2',
                              color: tx.transaction_successful ? '#166534' : '#dc2626'
                            }}>
                              {tx.transaction_successful ? 'Success' : 'Failed'}
                            </div>
                          </div>

                          {tx.amount && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span style={{ color: '#666' }}>Amount:</span>
                              <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                                {parseFloat(tx.amount).toFixed(7)} XLM
                              </span>
                            </div>
                          )}

                          <div style={{ marginTop: '10px' }}>
                            <button
                              onClick={() => window.open(`https://stellar.expert/explorer/testnet/tx/${tx.transaction_hash}`, '_blank')}
                              style={{
                                background: 'none',
                                border: '1px solid #667eea',
                                color: '#667eea',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                              aria-label="View transaction details on Stellar Explorer"
                            >
                              <ExternalLink size={14} />
                              View Details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
