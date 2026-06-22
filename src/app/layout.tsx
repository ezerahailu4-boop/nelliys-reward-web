import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    default: "Nelliy's Rewards — Ethiopia's Premier Coffee Loyalty Platform",
    template: "%s | Nelliy's Rewards",
  },
  description: "Scan QR codes, earn points, and redeem free coffee at Nelliy's Coffee in Addis Ababa. Join 2000+ members earning rewards on every sip.",
  keywords: 'coffee, rewards, loyalty, Ethiopia, Addis Ababa, QR code, points, Nelliy, Gazebo, free coffee, loyalty program',
  authors: [{ name: 'Nelliy\'s Coffee' }],
  creator: 'Ezera Hailu',
  publisher: 'Nelliy\'s Coffee',
  icons: {
    icon: [
      { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/icons/icon-96.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Nelliy's Rewards",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Nelliy's Rewards — Ethiopia's Premier Coffee Loyalty",
    description: "Earn points on every coffee. Redeem for free drinks. Join 2000+ members.",
    type: 'website',
    url: 'https://nelliyrewards.com',
    siteName: "Nelliy's Rewards",
    images: [{
      url: '/Nelliys Logo Coffee-01.png',
      width: 1200,
      height: 630,
      alt: "Nelliy's Coffee Rewards",
    }],
    locale: 'en_ET',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Nelliy's Rewards",
    description: 'Earn points on every coffee. Redeem for free drinks.',
    images: ['/Nelliys Logo Coffee-01.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f59e0b' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1917' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ReactQueryProvider>
              {children}
              <Toaster
                richColors
                position="top-center"
                toastOptions={{
                  style: { fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' },
                }}
              />
            </ReactQueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
