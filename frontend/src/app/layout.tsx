import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Navbar from '@/components/Navbar'

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
    <html lang="en" className={GeistSans.className}>
      <body>
        <Navbar />
        <main className="min-h-screen pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}
