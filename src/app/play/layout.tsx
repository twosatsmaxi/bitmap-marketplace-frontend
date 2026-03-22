import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play — Bitmap Marketplace",
  description: "Interactive Bitcoin block games and visualizations",
};

export default function MempoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-bg">
      {children}
    </div>
  );
}
