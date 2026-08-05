import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/styles/globals.css'

import { appSettings } from '@/lib/app'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { CookieConsent } from '@/components/cookie-consent'
import { TRPCReactProvider } from '@/trpc/react'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(appSettings.url),
  applicationName: appSettings.shortName,
  title: {
    default: `${appSettings.name} — ${appSettings.tagline}`,
    template: `%s — ${appSettings.name}`,
  },
  description: appSettings.description,
  icons: {
    icon: [
      { url: appSettings.logo.iconLight, media: '(prefers-color-scheme: light)' },
      { url: appSettings.logo.iconDark, media: '(prefers-color-scheme: dark)' },
      { url: appSettings.logo.iconSvg, type: 'image/svg+xml' },
    ],
    apple: appSettings.logo.appleIcon,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eae8e3' },
    { media: '(prefers-color-scheme: dark)', color: '#131519' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
          <Toaster position="top-center" />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
