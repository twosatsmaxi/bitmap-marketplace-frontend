import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bitmap Visualizer — Bitmap Marketplace",
  description: "3D visualization of Bitcoin blocks as bitmaps",
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
