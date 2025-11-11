import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import { metadata } from './metadata'
import SplashScreen from '@/components/SplashScreen'
import '@/styles/index.css'
import '@/styles/App.css'
import '@/styles/SplashScreen.css'
import '@/styles/UniversalHeader.css'

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2e7d32" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Eat Neo" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.jpg" />
        <meta name="format-detection" content="telephone=no" />

      </head>
      <body>
        <SplashScreen />
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}