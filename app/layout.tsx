import type { ReactNode } from "react";
import { Providers } from "./components/Providers";
import "./globals.css";

export const metadata = {
  title: "Nervi",
  description: "Nervi – a trauma-aware, nervous-system-focused AI guide.",
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
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
