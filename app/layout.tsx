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
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Eat Neo" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <style dangerouslySetInnerHTML={{
          __html: `
            .splash-screen {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 9999;
            }
          `
        }} />
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