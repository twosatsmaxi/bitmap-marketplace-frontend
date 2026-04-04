import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import StatsBar from "@/components/layout/StatsBar";
import ViewTransitionProvider from "@/components/layout/ViewTransitionProvider";
import { ToastContainer } from "@/components/ui/Toast";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bitmap.trade"),
  title: "Bitmap Marketplace — Bitcoin Ordinals Real Estate",
  icons: {
    icon: "/favicon.svg",
  },
  description:
    "Discover, buy, and sell Bitcoin Bitmap Ordinals. The leading marketplace for on-chain digital real estate.",
  keywords: ["Bitcoin", "Ordinals", "Bitmap", "NFT", "Marketplace", "BRC-20"],
  openGraph: {
    title: "Bitmap Marketplace — Bitcoin Ordinals Real Estate",
    description:
      "Discover, buy, and sell Bitcoin Bitmap Ordinals. The leading marketplace for on-chain digital real estate.",
    siteName: "Bitmap Marketplace",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bitmap Marketplace",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitmap Marketplace — Bitcoin Ordinals Real Estate",
    description:
      "Discover, buy, and sell Bitcoin Bitmap Ordinals. The leading marketplace for on-chain digital real estate.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-bg text-text-primary min-h-screen safe-area-inset-left safe-area-inset-right">
        <Navbar />
        <StatsBar />
        <main className="pt-[var(--header-total)]">
          <ViewTransitionProvider>{children}</ViewTransitionProvider>
        </main>
        <ToastContainer />
      </body>
    </html>
  );
}
