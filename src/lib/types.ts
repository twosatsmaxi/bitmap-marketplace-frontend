export type BitmapType = "city" | "grid" | "mondrian" | "punk" | "palindrome";
export type RarityTier = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type EventType = "sale" | "listing" | "transfer" | "offer";
export type ListingStatus = "listed" | "has_offer" | "unlisted";

export interface Bitmap {
  id: string; // e.g. "420000.bitmap"
  blockNumber: number;
  inscriptionId: string;
  owner: string;
  genesisHeight: number;
  bitmapType: BitmapType;
  rarity: RarityTier;
  price?: number; // in sats
  lastSalePrice?: number; // in sats
  listingStatus: ListingStatus;
  mintedAt: string; // ISO date
  txid: string;
  sat: number;
}

export interface CollectionStats {
  floorPrice: number; // sats
  totalVolume: number; // sats
  listedCount: number;
  totalSupply: number;
  holders: number;
  change24h: number; // percent
  avgPrice24h: number; // sats
}

export interface ActivityEvent {
  id: string;
  eventType: EventType;
  bitmap: Pick<Bitmap, "id" | "blockNumber" | "bitmapType" | "inscriptionId">;
  price?: number; // sats
  from: string;
  to?: string;
  timestamp: string; // ISO
  txid: string;
}

export interface PriceDataPoint {
  date: string; // YYYY-MM-DD
  price: number; // sats
  volume: number; // sats
}

export interface HolderBucket {
  label: string; // e.g. "1"
  count: number;
}

export interface BrowseFilters {
  search: string;
  status: ("listed" | "has_offer" | "unlisted")[];
  priceMin?: number;
  priceMax?: number;
  blockMin?: number;
  blockMax?: number;
  types: BitmapType[];
  rarities: RarityTier[];
}

export interface BrowseSort {
  field: "blockNumber" | "price" | "lastSale" | "recent";
  direction: "asc" | "desc";
}

export interface AnalyticsData {
  stats: CollectionStats;
  priceHistory: PriceDataPoint[];
  volumeHistory: PriceDataPoint[];
  holderDistribution: HolderBucket[];
  rarityBreakdown: { name: string; value: number; color: string }[];
}
