import HomePageClient from "@/components/home/HomePageClient";
import { HOME_MARKET_ROWS, HOME_RECENT_SALES } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <HomePageClient rows={HOME_MARKET_ROWS} recentSales={HOME_RECENT_SALES} />
  );
}
