import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/dashboard-animations.css";
import { StackBuilderWidget } from "@/components/StackBuilderWidget";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { KeyboardShortcuts } from "@/components/ui/keyboard-shortcuts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "gICM://SEND - The AI Marketplace for Web3 Builders",
  description: "91 specialized agents • 96 progressive skills • 93 commands • 82 MCP integrations • 48 production settings. Build your custom AI dev stack with 88-92% token savings.",
  openGraph: {
    title: "gICM://SEND - The AI Marketplace for Web3 Builders",
    description: "Build your custom AI dev stack with 91 agents, 96 skills, 93 commands, and 82 MCP integrations. Progressive Disclosure saves 88-92% tokens.",
    type: "website",
    url: "https://gicm.io",
    siteName: "gICM",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "gICM Marketplace - 91 Agents, 96 Skills, Progressive Disclosure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "gICM://SEND - The AI Marketplace for Web3 Builders",
    description: "91 agents • 96 skills • 93 commands • 82 MCPs • 88-92% token savings",
    images: ["/og-image.png"],
    creator: "@icm_motion",
  },
  metadataBase: new URL("https://gicm.io"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Cache-busting key to force fresh CSS load
  const cacheKey = Date.now();

  return (
    <html lang="en" suppressHydrationWarning key={cacheKey}>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <StackBuilderWidget />
            <KeyboardShortcuts />
            <Toaster position="bottom-right" richColors closeButton />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
