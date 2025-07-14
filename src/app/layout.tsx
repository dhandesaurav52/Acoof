
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
import { Inter, Montserrat } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable} h-full`} suppressHydrationWarning>
      <head>
        <title>Acoof</title>
        <meta name="description" content="Acoof - Modern Menswear" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background overflow-x-hidden">
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProductsProvider>
              <WishlistProvider>
                  <CartProvider>
                    <Header />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                    <Toaster />
                  </CartProvider>
              </WishlistProvider>
            </ProductsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
