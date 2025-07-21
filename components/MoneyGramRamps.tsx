import React, { useState, useEffect } from 'react'
import { MoneyGramService, MoneyGramConfig, MoneyGramQuote, MoneyGramTransaction } from '../services/moneygram'
import { MONEYGRAM_CONFIG } from '../config/moneygram'

interface MoneyGramRampsProps {
  walletAddress: string
  onTransactionComplete?: (transaction: MoneyGramTransaction) => void
}

export default function MoneyGramRamps({ walletAddress, onTransactionComplete }: MoneyGramRampsProps) {
  const [moneyGramService, setMoneyGramService] = useState<MoneyGramService | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<MoneyGramQuote | null>(null)
  const [transaction, setTransaction] = useState<MoneyGramTransaction | null>(null)
  const [countries, setCountries] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])
  const [formData, setFormData] = useState({
    sourceAmount: '',
    sourceCurrency: 'USD',
    destinationCurrency: 'EUR',
    destinationCountry: 'DE',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    pickupLocation: ''
  })

  // Initialize MoneyGram service
  useEffect(() => {
    const config: MoneyGramConfig = {
      apiKey: MONEYGRAM_CONFIG.API_KEY,
      apiSecret: MONEYGRAM_CONFIG.API_SECRET,
      environment: MONEYGRAM_CONFIG.ENVIRONMENT,
      walletDomain: MONEYGRAM_CONFIG.WALLET_DOMAIN,
      authenticationAddress: walletAddress,
      sourceAddress: walletAddress,
      depositAddress: walletAddress
    }

    if (config.apiKey && config.apiSecret && config.apiKey !== 'your_moneygram_api_key_here') {
      setMoneyGramService(new MoneyGramService(config))
    }
  }, [walletAddress])

  // Load countries and currencies
  useEffect(() => {
    if (moneyGramService) {
      loadCountriesAndCurrencies()
    }
  }, [moneyGramService])

  const loadCountriesAndCurrencies = async () => {
    try {
      setIsLoading(true)
      const [countriesData, currenciesData] = await Promise.all([
        moneyGramService!.getCountries(),
        moneyGramService!.getCurrencies()
      ])
      setCountries(countriesData)
      setCurrencies(currenciesData)
    } catch (error) {
      setError('Failed to load countries and currencies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuote = async () => {
    if (!moneyGramService || !formData.sourceAmount) return

    try {
      setIsLoading(true)
      setError(null)
      
      const quoteData = await moneyGramService.quoteTransaction(
        formData.sourceAmount,
        formData.sourceCurrency,
        formData.destinationCurrency,
        formData.destinationCountry
      )
      
      setQuote(quoteData)
    } catch (error) {
      setError('Failed to get quote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTransfer = async () => {
    if (!moneyGramService || !quote || !formData.recipientName || !formData.recipientPhone) return

    try {
      setIsLoading(true)
      setError(null)
      
      const transactionData = await moneyGramService.createTransfer(
        quote.quoteId,
        formData.recipientName,
        formData.recipientPhone,
        formData.recipientEmail,
        formData.pickupLocation
      )
      
      setTransaction(transactionData)
      onTransactionComplete?.(transactionData)
    } catch (error) {
      setError('Failed to create transfer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommitTransfer = async () => {
    if (!moneyGramService || !transaction) return

    try {
      setIsLoading(true)
      setError(null)
      
      const committedTransaction = await moneyGramService.commitTransfer(transaction.transactionId)
      setTransaction(committedTransaction)
      onTransactionComplete?.(committedTransaction)
    } catch (error) {
      setError('Failed to commit transfer')
    } finally {
      setIsLoading(false)
    }
  }

  if (!moneyGramService) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">MoneyGram Ramps</h3>
        <p className="text-yellow-700">
          MoneyGram API credentials not configured. Please set up your MoneyGram API keys.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">MoneyGram Ramps</h3>
          <p className="text-gray-600">Send money worldwide with instant fiat access</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!quote && !transaction && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={formData.sourceAmount}
                onChange={(e) => setFormData({ ...formData, sourceAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="100.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Currency
              </label>
              <select
                value={formData.sourceCurrency}
                onChange={(e) => setFormData({ ...formData, sourceCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Currency
              </label>
              <select
                value={formData.destinationCurrency}
                onChange={(e) => setFormData({ ...formData, destinationCurrency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Country
              </label>
              <select
                value={formData.destinationCountry}
                onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleQuote}
            disabled={isLoading || !formData.sourceAmount}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Getting Quote...' : 'Get Quote'}
          </button>
        </div>
      )}

      {quote && !transaction && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Quote Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Source Amount:</span>
                <span className="ml-2 font-medium">{quote.sourceAmount} {quote.sourceCurrency}</span>
              </div>
              <div>
                <span className="text-blue-700">Destination Amount:</span>
                <span className="ml-2 font-medium">{quote.destinationAmount} {quote.destinationCurrency}</span>
              </div>
              <div>
                <span className="text-blue-700">Exchange Rate:</span>
                <span className="ml-2 font-medium">{quote.exchangeRate}</span>
              </div>
              <div>
                <span className="text-blue-700">Fees:</span>
                <span className="ml-2 font-medium">{quote.fees}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Amount:</span>
                <span className="ml-2 font-medium">{quote.totalAmount}</span>
              </div>
              <div>
                <span className="text-blue-700">Expires:</span>
                <span className="ml-2 font-medium">{new Date(quote.expiresAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Phone
              </label>
              <input
                type="tel"
                value={formData.recipientPhone}
                onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email (Optional)
              </label>
              <input
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location (Optional)
              </label>
              <input
                type="text"
                value={formData.pickupLocation}
                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MoneyGram Location"
              />
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setQuote(null)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Back
            </button>
            <button
              onClick={handleCreateTransfer}
              disabled={isLoading || !formData.recipientName || !formData.recipientPhone}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Transfer...' : 'Create Transfer'}
            </button>
          </div>
        </div>
      )}

      {transaction && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Transfer Created</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Transaction ID:</span>
                <span className="ml-2 font-medium">{transaction.transactionId}</span>
              </div>
              <div>
                <span className="text-green-700">Status:</span>
                <span className="ml-2 font-medium capitalize">{transaction.status}</span>
              </div>
              <div>
                <span className="text-green-700">Recipient:</span>
                <span className="ml-2 font-medium">{transaction.recipientName}</span>
              </div>
              <div>
                <span className="text-green-700">Phone:</span>
                <span className="ml-2 font-medium">{transaction.recipientPhone}</span>
              </div>
              {transaction.pickupCode && (
                <div className="col-span-2">
                  <span className="text-green-700">Pickup Code:</span>
                  <span className="ml-2 font-medium">{transaction.pickupCode}</span>
                </div>
              )}
            </div>
          </div>

          {transaction.status === 'pending' && (
            <button
              onClick={handleCommitTransfer}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Committing Transfer...' : 'Commit Transfer'}
            </button>
          )}

          <button
            onClick={() => {
              setQuote(null)
              setTransaction(null)
            }}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Start New Transfer
          </button>
        </div>
      )}
    </div>
  )
} 