import HomePageClient from "@/components/home/HomePageClient";
import { HOME_RECENT_SALES, HOME_MARKET_ROWS } from "@/lib/mock-data";
import { HomeMarketRow } from "@/lib/types";

const TRAIT_DISPLAY_NAMES: Record<string, { name: string; kind: "standard" | "blocktribute" }> = {
  bitmap: { name: "Bitmap", kind: "standard" },
  patoshi: { name: "Patoshi", kind: "blocktribute" },
  billionaire: { name: "Billionaire", kind: "blocktribute" },
  pristine_punk: { name: "Bitmap Punk", kind: "blocktribute" },
  sub_100k: { name: "Sub 100k", kind: "blocktribute" },
  epic_sat: { name: "Epic Sat Block", kind: "blocktribute" },
  palindrome: { name: "Palindrome", kind: "blocktribute" },
  pizza: { name: "Pizza Block", kind: "blocktribute" },
  nakamoto: { name: "Nakamoto Era", kind: "blocktribute" },
};

async function getHomeMarketRows(): Promise<HomeMarketRow[]> {
  const BITMAP_INDEX_URL = process.env.BITMAP_INDEX_URL || "http://localhost:8080";
  
  try {
    const res = await fetch(`${BITMAP_INDEX_URL}/api/traits`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Failed to fetch traits");
    
    const data = await res.json();
    // Assuming data.traits is an array of { name: string, count: number }
    const traits = data.traits as { name: string; count: number }[];
    
    return traits
      .filter(t => TRAIT_DISPLAY_NAMES[t.name])
      .map(t => {
        const info = TRAIT_DISPLAY_NAMES[t.name];
        // Mock data for missing fields as per issue description
        return {
          id: t.name,
          name: info.name,
          kind: info.kind,
          floor: 0, // Placeholder
          volume: { "12h": 0, "1d": 0, "7d": 0, "30d": 0 }, // Placeholder
          sales: { "12h": 0, "1d": 0, "7d": 0, "30d": 0 }, // Placeholder
          listedPercent: t.count / 1000, // Just a placeholder derived from count
          trendPoints: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Placeholder
        };
      });
  } catch (error) {
    console.error("Error fetching traits for homepage:", error);
    return HOME_MARKET_ROWS; // Fallback to mock data
  }
}

export default async function HomePage() {
  const rows = await getHomeMarketRows();
  
  return (
    <HomePageClient rows={rows} recentSales={HOME_RECENT_SALES} />
  );
}
