"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MempoolTransaction, MempoolStats } from "../types/mempool";

// Generate a random transaction
function generateTransaction(): MempoolTransaction {
  // Fee rate follows log-normal distribution (most txs are low fee, few are high)
  const logNormal = Math.exp(Math.random() * 4 - 2); // ~0.13 to ~50 sats/vbyte
  const feeRate = Math.max(1, Math.min(1000, logNormal * 10));

  return {
    id: Math.random().toString(36).substring(2, 15),
    feeRate,
    size: 150 + Math.floor(Math.random() * 1000), // 150-1150 bytes
    timeEntered: Date.now(),
    value: Math.random() * 10, // 0-10 BTC
  };
}

// Generate initial mempool state
function generateInitialMempool(count: number): MempoolTransaction[] {
  return Array.from({ length: count }, () => ({
    ...generateTransaction(),
    timeEntered: Date.now() - Math.random() * 3600000, // Up to 1 hour old
  }));
}

interface UseMockMempoolDataReturn {
  transactions: MempoolTransaction[];
  stats: MempoolStats;
  newTransactions: MempoolTransaction[];
  clearNewTransactions: () => void;
}

export function useMockMempoolData(): UseMockMempoolDataReturn {
  const [transactions, setTransactions] = useState<MempoolTransaction[]>([]);
  const [newTransactions, setNewTransactions] = useState<MempoolTransaction[]>([]);
  const statsRef = useRef<MempoolStats>({
    txCount: 0,
    txPerSecond: 0,
    avgFeeRate: 0,
    totalSize: 0,
  });

  // Initialize with some transactions
  useEffect(() => {
    const initial = generateInitialMempool(800);
    setTransactions(initial);
  }, []);

  // Generate new transactions at variable rate
  useEffect(() => {
    const interval = setInterval(() => {
      // Variable rate: 1-8 new transactions per interval
      const count = Math.floor(Math.random() * 8) + 1;
      const newTxs: MempoolTransaction[] = [];

      for (let i = 0; i < count; i++) {
        newTxs.push(generateTransaction());
      }

      setNewTransactions((prev) => [...prev, ...newTxs]);
      setTransactions((prev) => {
        // Keep mempool size realistic (500-3000)
        const combined = [...prev, ...newTxs];
        if (combined.length > 3000) {
          return combined.slice(combined.length - 3000);
        }
        return combined;
      });
    }, 200 + Math.random() * 800); // Every 200-1000ms

    return () => clearInterval(interval);
  }, []);

  // Clear new transactions (called after they're processed by particle system)
  const clearNewTransactions = useCallback(() => {
    setNewTransactions([]);
  }, []);

  // Calculate stats
  useEffect(() => {
    const updateStats = setInterval(() => {
      const now = Date.now();
      const recentTxs = transactions.filter((tx) => now - tx.timeEntered < 10000);

      statsRef.current = {
        txCount: transactions.length,
        txPerSecond: recentTxs.length / 10,
        avgFeeRate:
          transactions.length > 0
            ? transactions.reduce((sum, tx) => sum + tx.feeRate, 0) /
              transactions.length
            : 0,
        totalSize: transactions.reduce((sum, tx) => sum + tx.size, 0),
      };
    }, 1000);

    return () => clearInterval(updateStats);
  }, [transactions]);

  return {
    transactions,
    stats: statsRef.current,
    newTransactions,
    clearNewTransactions,
  };
}
