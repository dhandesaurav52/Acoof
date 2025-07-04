
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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <title>Acoof</title>
        <meta name="description" content="A new app built in Firebase Studio." />
        <meta name="theme-color" content="#F44336" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="https://placehold.co/192x192.png"></link>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
