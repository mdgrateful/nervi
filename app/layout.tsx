import type { ReactNode } from "react";
import { Providers } from "./components/Providers";
import "./globals.css";

export const metadata = {
  title: "Nervi",
  description: "Nervi – a trauma-aware, nervous-system-focused AI guide.",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/nervi-logo.svg', type: 'image/svg+xml', sizes: '120x120' },
    ],
    apple: [
      { url: '/nervi-logo.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Nervi',
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
