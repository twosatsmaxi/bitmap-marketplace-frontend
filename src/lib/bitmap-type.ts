import type { BitmapType, RarityTier } from "./types";

const TYPES: BitmapType[] = ["city", "grid", "mondrian", "punk"];

export function getBitmapType(blockNumber: number): BitmapType {
  const str = String(blockNumber);
  if (str === str.split("").reverse().join("")) return "palindrome";
  return TYPES[blockNumber % 4];
}

export function getBitmapRarity(blockNumber: number): RarityTier {
  // Early blocks are rarer
  if (blockNumber < 1000) return "legendary";
  if (blockNumber < 10_000) return "epic";
  if (blockNumber < 100_000) return "rare";
  // Palindromes are uncommon
  const str = String(blockNumber);
  if (str === str.split("").reverse().join("")) return "uncommon";
  // Round numbers
  if (blockNumber % 10_000 === 0) return "rare";
  if (blockNumber % 1000 === 0) return "uncommon";
  return "common";
}
