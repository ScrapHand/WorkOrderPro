import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AxonVantage Systems | Industrial CMMS Intelligence",
  description: "Next-generation facility maintenance and asset management powered by operational intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
