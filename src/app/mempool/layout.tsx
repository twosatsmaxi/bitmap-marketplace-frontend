import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mempool Visualization | Bitmap Marketplace",
  description: "Immersive 3D visualization of live Bitcoin mempool activity",
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
