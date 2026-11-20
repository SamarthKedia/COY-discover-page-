import { Fraunces, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});
const body = Space_Grotesk({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'Coy — Discover',
  description: 'Swipe-based Discover tab. Likes stay sealed until they are mutual.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1C1A33',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
