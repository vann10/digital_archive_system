import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "../lib/utils";
import { Toaster } from "../components/ui/toaster";

// Menggunakan font Inter (standar modern yang bersih)
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistem Arsip Digital - Dinas Sosial",
  description: "Aplikasi Internal Pengelolaan Arsip Dinas Sosial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}