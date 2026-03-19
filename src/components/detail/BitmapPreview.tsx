"use client";

import dynamic from "next/dynamic";

const BitmapRenderer = dynamic(() => import("@/components/explore/BitmapRenderer"), { ssr: false });

interface BitmapPreviewProps {
  height: number;
}

export default function BitmapPreview({ height }: BitmapPreviewProps) {
  return <BitmapRenderer height={height} canvasSize={300} onStatus={() => {}} />;
}
