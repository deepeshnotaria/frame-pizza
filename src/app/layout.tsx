import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FRAME - The Architecture of Pizza',
  description: 'Pre-order your limited batch vegan Detroit-style pizza. Precision crafted in Chicago, IL.',
  keywords: ['vegan pizza', 'Detroit style', 'Chicago', 'pre-order', 'limited batch'],
  openGraph: {
    title: 'FRAME - The Architecture of Pizza',
    description: 'Pre-order your limited batch vegan Detroit-style pizza.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Outfit:wght@200;300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
