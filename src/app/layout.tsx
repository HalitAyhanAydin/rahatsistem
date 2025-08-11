import React from 'react'
import './globals.css'

export const metadata = {
  title: 'Test API Veri Dökümantasyonu',
  description: 'API verilerinin hierarchical görüntülenmesi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
