import './globals.css';
import type { Metadata } from 'next';
import { Proza_Libre } from 'next/font/google';
import Script from 'next/script';

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
      <body className={prozaLibre.className}>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}