'use client'

import { useState } from 'react'
import { SwapCard } from '@/components/SwapCard'
import { PriceDisplay } from '@/components/PriceDisplay'
import { TradeHistory } from '@/components/TradeHistory'
import { WalletButton } from '@/components/WalletButton'
import { Settings, Activity, TrendingUp } from 'lucide-react'

export default function TradingTerminal() {
  const [connected, setConnected] = useState(false)
  const [slippage, setSlippage] = useState(0.5)

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <header className="border-b border-terminal-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-terminal-green to-terminal-blue flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Solana DEX</h1>
              <p className="text-xs text-terminal-muted">Powered by Jupiter</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Slippage Settings */}
            <div className="flex items-center gap-2 bg-terminal-card px-3 py-2 rounded-lg border border-terminal-border">
              <Settings className="w-4 h-4 text-terminal-muted" />
              <span className="text-sm text-terminal-muted">Slippage:</span>
              <select
                value={slippage}
                onChange={(e) => setSlippage(Number(e.target.value))}
                className="bg-transparent text-terminal-text text-sm focus:outline-none cursor-pointer"
              >
                <option value={0.1}>0.1%</option>
                <option value={0.5}>0.5%</option>
                <option value={1}>1%</option>
                <option value={3}>3%</option>
              </select>
            </div>

            <WalletButton connected={connected} onConnect={() => setConnected(!connected)} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Swap Card - Main Focus */}
          <div className="lg:col-span-2">
            <SwapCard slippage={slippage} connected={connected} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Display */}
            <PriceDisplay />

            {/* Trade History */}
            <TradeHistory />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '24h Volume', value: '$847.2M', change: '+12.4%' },
            { label: 'Total Trades', value: '1.2M', change: '+8.7%' },
            { label: 'TVL', value: '$2.1B', change: '+3.2%' },
            { label: 'Active Users', value: '45.2K', change: '+15.1%' },
          ].map((stat) => (
            <div key={stat.label} className="bg-terminal-card border border-terminal-border rounded-lg p-4">
              <p className="text-terminal-muted text-sm">{stat.label}</p>
              <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
              <p className="text-terminal-green text-sm mt-1">{stat.change}</p>
            </div>
          ))}
        </div>
      </main>

      {/* OPUS67 Badge */}
      <div className="fixed bottom-4 right-4 bg-terminal-card border border-terminal-border rounded-lg px-4 py-2 flex items-center gap-2">
        <Activity className="w-4 h-4 text-terminal-green animate-pulse" />
        <span className="text-xs text-terminal-muted">Built with</span>
        <span className="text-xs font-bold text-terminal-green">OPUS67 VIBE</span>
      </div>
    </div>
  )
}
