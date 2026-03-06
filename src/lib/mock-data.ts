import type {
  Bitmap,
  CollectionStats,
  ActivityEvent,
  PriceDataPoint,
  HolderBucket,
  AnalyticsData,
  HomeMarketRow,
  HomeRecentSale,
} from "./types";
import { getBitmapType, getBitmapRarity } from "./bitmap-type";

function makeBitmap(
  blockNumber: number,
  overrides: Partial<Bitmap> = {}
): Bitmap {
  return {
    id: `${blockNumber}.bitmap`,
    blockNumber,
    inscriptionId: `${blockNumber}a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t${blockNumber}i0`,
    owner: `bc1q${blockNumber.toString(36).padStart(6, "0")}xyzabc1234`,
    genesisHeight: blockNumber + 1,
    bitmapType: getBitmapType(blockNumber),
    rarity: getBitmapRarity(blockNumber),
    price: blockNumber < 10000 ? Math.floor(Math.random() * 500000) + 50000 : undefined,
    lastSalePrice: Math.floor(Math.random() * 300000) + 20000,
    listingStatus: blockNumber % 3 === 0 ? "listed" : blockNumber % 5 === 0 ? "has_offer" : "unlisted",
    mintedAt: new Date(Date.now() - blockNumber * 600_000).toISOString(),
    txid: `tx${blockNumber}abcdef1234567890abcdef1234567890`,
    sat: blockNumber * 100 + 42,
    ...overrides,
  };
}

export const MOCK_BITMAPS: Bitmap[] = [
  makeBitmap(420000, { price: 250000, listingStatus: "listed", rarity: "rare" }),
  makeBitmap(777777, { price: 1500000, listingStatus: "listed", rarity: "epic" }),
  makeBitmap(123456, { listingStatus: "has_offer", rarity: "uncommon" }),
  makeBitmap(500000, { price: 180000, listingStatus: "listed" }),
  makeBitmap(1, { price: 50000000, listingStatus: "listed", rarity: "legendary" }),
  makeBitmap(100000, { price: 750000, listingStatus: "listed", rarity: "rare" }),
  makeBitmap(210000, { listingStatus: "unlisted", rarity: "rare" }),
  makeBitmap(840000, { price: 95000, listingStatus: "listed" }),
  makeBitmap(12321, { price: 320000, listingStatus: "listed", rarity: "uncommon" }),
  makeBitmap(999, { price: 8000000, listingStatus: "listed", rarity: "legendary" }),
  makeBitmap(314159, { listingStatus: "has_offer" }),
  makeBitmap(700000, { price: 110000, listingStatus: "listed" }),
  makeBitmap(600000, { listingStatus: "unlisted" }),
  makeBitmap(88888, { price: 450000, listingStatus: "listed", rarity: "uncommon" }),
  makeBitmap(42000, { price: 220000, listingStatus: "listed" }),
  makeBitmap(7, { price: 25000000, listingStatus: "listed", rarity: "legendary" }),
];

export const MOCK_STATS: CollectionStats = {
  floorPrice: 95000,
  totalVolume: 12_450_000_000,
  listedCount: 4821,
  totalSupply: 878000,
  holders: 23410,
  change24h: 3.42,
  avgPrice24h: 187000,
};

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: "evt-001",
    eventType: "sale",
    bitmap: { id: "420000.bitmap", blockNumber: 420000, bitmapType: "mondrian", inscriptionId: "420000abc123" },
    price: 250000,
    from: "bc1qseller1234abcd",
    to: "bc1qbuyer5678efgh",
    timestamp: new Date(Date.now() - 3_600_000).toISOString(),
    txid: "txsale001",
  },
  {
    id: "evt-002",
    eventType: "listing",
    bitmap: { id: "777777.bitmap", blockNumber: 777777, bitmapType: "city", inscriptionId: "777777abc123" },
    price: 1500000,
    from: "bc1qlister9012ijkl",
    timestamp: new Date(Date.now() - 7_200_000).toISOString(),
    txid: "txlist002",
  },
  {
    id: "evt-003",
    eventType: "offer",
    bitmap: { id: "123456.bitmap", blockNumber: 123456, bitmapType: "grid", inscriptionId: "123456abc123" },
    price: 180000,
    from: "bc1qofferer3456mnop",
    timestamp: new Date(Date.now() - 14_400_000).toISOString(),
    txid: "txoffer003",
  },
  {
    id: "evt-004",
    eventType: "transfer",
    bitmap: { id: "100000.bitmap", blockNumber: 100000, bitmapType: "punk", inscriptionId: "100000abc123" },
    from: "bc1qtransfer7890qrst",
    to: "bc1qreceiver2345uvwx",
    timestamp: new Date(Date.now() - 28_800_000).toISOString(),
    txid: "txtransfer004",
  },
  {
    id: "evt-005",
    eventType: "sale",
    bitmap: { id: "999.bitmap", blockNumber: 999, bitmapType: "city", inscriptionId: "999abc123" },
    price: 8000000,
    from: "bc1qseller9999aaaa",
    to: "bc1qwhale1111bbbb",
    timestamp: new Date(Date.now() - 43_200_000).toISOString(),
    txid: "txsale005",
  },
  {
    id: "evt-006",
    eventType: "listing",
    bitmap: { id: "840000.bitmap", blockNumber: 840000, bitmapType: "grid", inscriptionId: "840000abc123" },
    price: 95000,
    from: "bc1qlister8400cccc",
    timestamp: new Date(Date.now() - 86_400_000).toISOString(),
    txid: "txlist006",
  },
  {
    id: "evt-007",
    eventType: "sale",
    bitmap: { id: "12321.bitmap", blockNumber: 12321, bitmapType: "palindrome", inscriptionId: "12321abc123" },
    price: 320000,
    from: "bc1qseller1232dddd",
    to: "bc1qbuyer9876eeee",
    timestamp: new Date(Date.now() - 172_800_000).toISOString(),
    txid: "txsale007",
  },
  {
    id: "evt-008",
    eventType: "offer",
    bitmap: { id: "500000.bitmap", blockNumber: 500000, bitmapType: "city", inscriptionId: "500000abc123" },
    price: 150000,
    from: "bc1qoffer5000ffff",
    timestamp: new Date(Date.now() - 259_200_000).toISOString(),
    txid: "txoffer008",
  },
];

function generatePriceHistory(): PriceDataPoint[] {
  const data: PriceDataPoint[] = [];
  let price = 80000;
  const now = Date.now();
  for (let i = 89; i >= 0; i--) {
    price = Math.max(50000, price + (Math.random() - 0.45) * 8000);
    const vol = Math.floor(Math.random() * 5_000_000) + 500_000;
    data.push({
      date: new Date(now - i * 86_400_000).toISOString().split("T")[0],
      price: Math.floor(price),
      volume: vol,
    });
  }
  return data;
}

export const MOCK_PRICE_HISTORY: PriceDataPoint[] = generatePriceHistory();

export const MOCK_HOLDER_DISTRIBUTION: HolderBucket[] = [
  { label: "1", count: 14200 },
  { label: "2-5", count: 6300 },
  { label: "6-10", count: 1800 },
  { label: "11-25", count: 750 },
  { label: "26-50", count: 240 },
  { label: "51-100", count: 90 },
  { label: "100+", count: 30 },
];

export const MOCK_RARITY_BREAKDOWN = [
  { name: "Common", value: 68, color: "#8A8A8A" },
  { name: "Uncommon", value: 18, color: "#60A5FA" },
  { name: "Rare", value: 9, color: "#A78BFA" },
  { name: "Epic", value: 4, color: "#F59E0B" },
  { name: "Legendary", value: 1, color: "#F7931A" },
];

export const MOCK_ANALYTICS: AnalyticsData = {
  stats: MOCK_STATS,
  priceHistory: MOCK_PRICE_HISTORY,
  volumeHistory: MOCK_PRICE_HISTORY,
  holderDistribution: MOCK_HOLDER_DISTRIBUTION,
  rarityBreakdown: MOCK_RARITY_BREAKDOWN,
};

export const HOME_MARKET_ROWS: HomeMarketRow[] = [
  {
    id: "bitmap",
    name: "Bitmap",
    kind: "standard",
    floor: 95_000,
    volume: { "24h": 12_450_000_000, "7d": 43_800_000_000 },
    sales: { "24h": 754, "7d": 4120 },
    listedPercent: 3.9,
    trendPoints: [42, 43, 42, 44, 43, 45, 44, 43, 44, 46],
  },
  {
    id: "patoshi",
    name: "Patoshi",
    kind: "blocktribute",
    floor: 830_000,
    volume: { "24h": 2_120_000_000, "7d": 8_450_000_000 },
    sales: { "24h": 19, "7d": 86 },
    listedPercent: 1.4,
    trendPoints: [38, 37, 39, 41, 42, 41, 43, 44, 43, 45],
  },
  {
    id: "billionaire",
    name: "Billionaire",
    kind: "blocktribute",
    floor: 1_620_000,
    volume: { "24h": 1_880_000_000, "7d": 6_940_000_000 },
    sales: { "24h": 11, "7d": 49 },
    listedPercent: 0.8,
    trendPoints: [46, 45, 44, 46, 47, 46, 48, 49, 48, 50],
  },
  {
    id: "bitmap-punk",
    name: "Bitmap Punk",
    kind: "blocktribute",
    floor: 520_000,
    volume: { "24h": 1_260_000_000, "7d": 4_110_000_000 },
    sales: { "24h": 27, "7d": 137 },
    listedPercent: 2.1,
    trendPoints: [31, 32, 31, 34, 35, 34, 36, 35, 37, 36],
  },
  {
    id: "sub-100k",
    name: "Sub 100k",
    kind: "blocktribute",
    floor: 450_000,
    volume: { "24h": 970_000_000, "7d": 3_200_000_000 },
    sales: { "24h": 23, "7d": 124 },
    listedPercent: 2.6,
    trendPoints: [27, 28, 29, 28, 30, 31, 32, 31, 33, 34],
  },
  {
    id: "epic-sat-block",
    name: "Epic Sat Block",
    kind: "blocktribute",
    floor: 390_000,
    volume: { "24h": 640_000_000, "7d": 2_430_000_000 },
    sales: { "24h": 14, "7d": 66 },
    listedPercent: 1.7,
    trendPoints: [24, 24, 25, 26, 25, 27, 28, 27, 29, 30],
  },
  {
    id: "palindrome",
    name: "Palindrome",
    kind: "blocktribute",
    floor: 320_000,
    volume: { "24h": 510_000_000, "7d": 1_940_000_000 },
    sales: { "24h": 16, "7d": 79 },
    listedPercent: 2.2,
    trendPoints: [22, 23, 22, 24, 24, 25, 26, 25, 27, 27],
  },
  {
    id: "pizza-block",
    name: "Pizza Block",
    kind: "blocktribute",
    floor: 280_000,
    volume: { "24h": 420_000_000, "7d": 1_560_000_000 },
    sales: { "24h": 9, "7d": 52 },
    listedPercent: 1.1,
    trendPoints: [18, 19, 19, 20, 21, 20, 21, 22, 22, 23],
  },
  {
    id: "nakamoto-era",
    name: "Nakamoto Era",
    kind: "blocktribute",
    floor: 610_000,
    volume: { "24h": 760_000_000, "7d": 2_980_000_000 },
    sales: { "24h": 12, "7d": 58 },
    listedPercent: 1.3,
    trendPoints: [29, 30, 29, 31, 32, 31, 33, 34, 34, 35],
  },
];

export const HOME_RECENT_SALES: HomeRecentSale[] = [
  {
    id: "sale-1",
    bitmapId: "Bitmap #840000",
    traitName: "Bitmap Punk",
    price: 195_000,
    soldAt: new Date(Date.now() - 4 * 60_000).toISOString(),
  },
  {
    id: "sale-2",
    bitmapId: "Bitmap #700000",
    traitName: "Patoshi",
    price: 1_120_000,
    soldAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: "sale-3",
    bitmapId: "Bitmap #500000",
    traitName: "Bitmap",
    price: 180_000,
    soldAt: new Date(Date.now() - 26 * 60_000).toISOString(),
  },
  {
    id: "sale-4",
    bitmapId: "Bitmap #210000",
    traitName: "Billionaire",
    price: 1_740_000,
    soldAt: new Date(Date.now() - 41 * 60_000).toISOString(),
  },
];
