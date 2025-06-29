
'use client';

import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showHeaderFooter = !['/login', '/signup'].includes(pathname);

  return (
    <html lang="en" className="h-full">
      <head>
        <title>Acoof Lookbook</title>
        <meta name="description" content="Discover the latest trends and get personalized style recommendations." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        {showHeaderFooter && <Header />}
        <main className="flex-grow">{children}</main>
        {showHeaderFooter && <Footer />}
        <Toaster />
      </body>
    </html>
  );
}
