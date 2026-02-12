import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Training Platform',
  description: 'Repository for AI training materials with collaborative review',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
