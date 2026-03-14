import type { Metadata } from 'next';
import './globals.css';
import { RootLayout } from '@/components/RootLayout';

export const metadata: Metadata = {
  title: 'Devholic Blog',
  description: 'A personal blog built with Next.js',
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  );
}
