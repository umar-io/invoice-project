import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Nunito_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap"
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Approveet | Finance workflows without the chaos",
  description:
    "AI-powered accounts payable, accounts receivable, and expense management for Nigerian SMBs."
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${playfair.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
