import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import ThreeScene from '@/components/ThreeScene';
import SmoothScroll from '@/components/SmoothScroll';
import { Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'Echo - AI Learning Platform',
  description: 'A futuristic college-exclusive AI learning platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`} suppressHydrationWarning>
        <SmoothScroll>
          <Suspense fallback={null}>
            <ThreeScene />
          </Suspense>
          <AuthProvider>
            <main className="relative z-10">
              {children}
            </main>
          </AuthProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
