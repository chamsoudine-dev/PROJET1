import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Santé Numérique Niger',
  description: 'Plateforme nationale de santé numérique pour le Niger',
  keywords: ['santé', 'niger', 'CSI', 'patients', 'consultations', 'vaccination', 'épidémiologie'],
  authors: [{ name: 'Ministère de la Santé Publique du Niger' }],
  creator: 'Ministère de la Santé Publique du Niger',
  publisher: 'Ministère de la Santé Publique du Niger',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Santé Numérique Niger',
    description: 'Plateforme nationale de santé numérique pour le Niger',
    type: 'website',
    locale: 'fr_NE',
    siteName: 'Santé Numérique Niger',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Santé Numérique Niger',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans min-h-screen bg-background`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}