import type { Metadata } from "next";
import PublicProfileClient from "./PublicProfileClient";

export const revalidate = 60;

const BITMAP_INDEX_API =
  process.env.BITMAP_INDEX_API_BASE ?? "http://localhost:3002";

interface PageProps {
  params: Promise<{ profile_id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { profile_id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bitmap.trade";

  let description = "A bitmap collector's portfolio on bitmap.trade";

  try {
    const res = await fetch(
      `${BITMAP_INDEX_API}/api/portfolio/profile/${profile_id}?limit=1&page=0`,
      { signal: AbortSignal.timeout(3000), next: { revalidate: 300 } }
    );

    if (res.ok) {
      const data = await res.json();
      const total: number = data.total ?? 0;
      const walletCount: number = data.addresses?.length ?? 0;

      if (total > 0 || walletCount > 0) {
        const parts: string[] = [];
        if (total > 0) parts.push(`${total} bitmap${total !== 1 ? "s" : ""}`);
        if (walletCount > 0) parts.push(`${walletCount} wallet${walletCount !== 1 ? "s" : ""}`);
        description = `${parts.join(" across ")} on bitmap.trade`;
      }
    }
  } catch {
    // Fall back to generic description
  }

  const profileUrl = `${baseUrl}/profile/${profile_id}`;

  return {
    title: "Profile — bitmap.trade",
    description,
    openGraph: {
      title: "Profile — bitmap.trade",
      description,
      type: "profile",
      url: profileUrl,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "bitmap.trade Profile",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Profile — bitmap.trade",
      description,
      images: ["/og-image.png"],
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { profile_id } = await params;
  return <PublicProfileClient profileId={profile_id} />;
}
