import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solana DEX Terminal | OPUS67 VIBE Showcase',
  description: 'Built in VIBE mode - one prompt, working app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-terminal-bg">
        {children}
      </body>
    </html>
  )
}
