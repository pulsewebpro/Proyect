import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '@amable/ui/globals.css';
import { Providers } from './providers';
import { TooltipProvider } from '@amable/ui';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Amable Studio',
  description: 'Plataforma de desarrollo asistida por IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-bg font-sans`}>
        <TooltipProvider delayDuration={200}>
          <Providers>{children}</Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
