import React, { useState } from 'react'
import { Send, Loader } from 'lucide-react'

interface SendPaymentProps {
  onSend: (destination: string, amount: string) => Promise<void>
  isLoading: boolean
}

export default function SendPayment({ onSend, isLoading }: SendPaymentProps) {
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!destination.trim()) {
      setError('Please enter a destination address')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    try {
      await onSend(destination, amount)
      setDestination('')
      setAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Send className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold text-gray-800">Send Payment</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination Address
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="input-field"
            placeholder="Enter Stellar address"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (XLM)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
            placeholder="0.0000000"
            step="0.0000001"
            min="0"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Payment</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
} 