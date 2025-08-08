import React from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'InveStar Stellar Wallet',
  description: 'InveStar Digital Wallet - Stellar Testnet Integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}