import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import StatsBar from "@/components/layout/StatsBar";
import { getCollectionStats } from "@/lib/api";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bitmap Marketplace — Bitcoin Ordinals Real Estate",
  description:
    "Discover, buy, and sell Bitcoin Bitmap Ordinals. The leading marketplace for on-chain digital real estate.",
  keywords: ["Bitcoin", "Ordinals", "Bitmap", "NFT", "Marketplace", "BRC-20"],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getCollectionStats();

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-bg text-text-primary min-h-screen">
        <Navbar />
        <StatsBar stats={stats} />
        <main className="pt-[92px]">{children}</main>
      </body>
    </html>
  );
}
