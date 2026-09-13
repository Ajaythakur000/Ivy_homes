import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Ivy Homes Property Platform',
  description: 'Clean, editorial property platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.className} ${GeistSans.variable}`}>
      <body className="selection:bg-accent/30 selection:text-white">
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-24">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </Providers>
      </body>
    </html>
  )
}
