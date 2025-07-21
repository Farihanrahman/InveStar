import React from 'react'
import { Wallet, Copy, ExternalLink } from 'lucide-react'
import { Balance } from '../utils/stellar'

interface WalletCardProps {
  publicKey: string
  balances: Balance[]
  onCopyAddress: () => void
  onViewExplorer: () => void
}

export default function WalletCard({ 
  publicKey, 
  balances, 
  onCopyAddress, 
  onViewExplorer 
}: WalletCardProps) {
  const xlmBalance = balances.find(b => b.asset_type === 'native')
  const otherBalances = balances.filter(b => b.asset_type !== 'native')

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wallet className="w-6 h-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">Wallet</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCopyAddress}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Copy address"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onViewExplorer}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="View on explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <div className="bg-gray-50 p-3 rounded-md">
            <code className="text-sm text-gray-800 break-all">
              {publicKey}
            </code>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Balances
          </label>
          <div className="space-y-2">
            {xlmBalance && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                <span className="font-medium text-blue-800">XLM</span>
                <span className="text-blue-800">
                  {parseFloat(xlmBalance.balance).toFixed(7)}
                </span>
              </div>
            )}
            
            {otherBalances.map((balance, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <span className="font-medium text-gray-800">
                  {balance.asset_code || 'Custom Asset'}
                </span>
                <span className="text-gray-800">
                  {parseFloat(balance.balance).toFixed(7)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 