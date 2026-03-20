export interface MempoolTransaction {
  id: string;
  feeRate: number;
  size: number;
  timeEntered: number;
  value: number;
}

export interface MempoolStats {
  txCount: number;
  txPerSecond: number;
  avgFeeRate: number;
  totalSize: number; // bytes
}

export interface ParticleData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  feeRate: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export type QualityLevel = "high" | "medium" | "low";
