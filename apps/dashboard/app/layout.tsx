import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "./ClientLayout";

export const metadata: Metadata = {
  title: "gICM Empire Dashboard",
  description: "Autonomous AI development platform control center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gicm-dark text-white">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
