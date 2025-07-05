
'use client';

import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from '@/components/theme-provider';
import { ProductsProvider } from '@/hooks/use-products';
import { WishlistProvider } from '@/hooks/use-wishlist';
import { CartProvider } from '@/hooks/use-cart';
import { useEffect } from 'react';
import { InstallPromptProvider } from '@/hooks/use-install-prompt';
import { IosInstallBanner } from '@/components/IosInstallBanner';
import { Inter, Montserrat } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['800', '900'],
  display: 'swap',
  variable: '--font-montserrat',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }
  }, []);

  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} h-full`} suppressHydrationWarning>
      <head>
        <title>White Wolf</title>
        <meta name="description" content="A new app built in Firebase Studio." />
        <meta name="theme-color" content="#F44336" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="https://placehold.co/192x192.png"></link>
        <link rel="icon" type="image/png" sizes="192x192" href="https://placehold.co/192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="https://placehold.co/512x512.png" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background overflow-x-hidden">
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProductsProvider>
              <WishlistProvider>
                <InstallPromptProvider>
                  <CartProvider>
                    <Header />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                    <Toaster />
                    <IosInstallBanner />
                  </CartProvider>
                </InstallPromptProvider>
              </WishlistProvider>
            </ProductsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
