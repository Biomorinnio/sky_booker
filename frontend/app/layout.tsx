import type { Metadata } from "next";
import "./globals.css";
import "../styles/glass.css";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "../providers/ThemeProvider";

import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SkyBooker - Онлайн-бронирование авиабилетов",
  description:
    "Веб-платформа для поиска, сравнения и онлайн-бронирования авиабилетов. Удобный поиск рейсов, выбор тарифов и быстрое оформление билетов.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
