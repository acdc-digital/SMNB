// ROOT LAYOUT
// /Users/matthewsimon/Projects/SMNB/smnb/app/layout.tsx

import type { Metadata } from "next";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TokenCountingProvider } from "@/components/providers/TokenCountingProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMNB - Story Threading System",
  description: "Intelligent content curation with story threading",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <TokenCountingProvider>
              {children}
            </TokenCountingProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
