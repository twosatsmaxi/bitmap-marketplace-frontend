export interface BlockMeta {
  id: string;
  height: number;
  timestamp: number;
  size: number;
  tx_count: number;
}

export interface WorkerSquare {
  x: number;
  y: number;
  r: number;
  index: number;
}

export interface WorkerResult {
  txCount: number;
  squares: WorkerSquare[];
  layoutWidth: number;
  usedHeight: number;
}

export type RenderStatus = "idle" | "loading" | "done" | "error";

export type AnimationStyle = "bitfeed";

/** Quality tiers — ordered from highest to lowest */
export type QualityTier = "full" | "reduced" | "canvas2d" | "static";

export interface QualityFeatures {
  repulsion: boolean;
  flicker: boolean;
  animated: boolean;
}

export interface InterestingBlock {
  label: string;
  height: number;
}

export type FilterCategory = {
  id: string;
  label: string;
};

export interface BlockRendered {
  height: number;
  status: RenderStatus;
  meta?: BlockMeta;
  listingStatus?: "listed" | "has_offer" | "unlisted";
  price?: number;
}
