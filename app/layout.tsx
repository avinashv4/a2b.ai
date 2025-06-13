import './globals.css';
import type { Metadata } from 'next';
import { Proza_Libre } from 'next/font/google';

const prozaLibre = Proza_Libre({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: 'a2b.ai - Collaborative Travel Planning',
  description: 'Trips made social, plans made easy. Plan your perfect journey with friends and family.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={prozaLibre.className}>{children}</body>
    </html>
  );
}
