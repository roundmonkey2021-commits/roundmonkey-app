import { useState, useEffect } from "react";

export interface Trade {
  id: string;
  timestamp: string;
  symbol: string;
  optionType: "call" | "put";
  strikePrice: number;
  expiryDate: string;
  action: "buy" | "sell";
  quantity: number;
  entryPremium: number;
  exitPremium?: number;
  totalInvested?: number;
  planEntryPrice?: number;
  planExitPrice?: number;
  planStopLoss?: number;
  planLotSize?: number; // Planned lot size (what trader intended to trade)
  planQuantity?: number; // Planned quantity (what trader intended to trade)
  planAction?: "buy" | "sell"; // Planned action
  planLotUnitSize?: number; // Units per lot (e.g., 65 for NIFTY)
  assetClass?: string;
  instrument?: string;
  day?: string;
  entryTime?: string;
  exitTime?: string;
  exitDate?: string;
  notes?: string;
  isPlanned?: boolean;
  setup?: string;
  entryOrderType?: "limit" | "market";
  exitOrderType?: "limit" | "market";
  lotSize?: number; // Actual lot size executed
  lotUnitSize?: number; // Units per lot for actual entry (e.g., 65 for NIFTY)
  allowedLotSize?: number; // Maximum lot size allowed for the current trading phase
  phase?: string; // Trading phase/campaign (e.g., "Phase 1", "Phase 2", "Phase 3")
  exitReason?: string;
  earlyExit?: boolean;
  slModified?: boolean; // FIXED: "Was SL Modified?" radio button value
  modifiedSL?: string; // FIXED: New SL value (text input) - changed from boolean to string
  slModificationReason?: string; // FIXED: Reason for SL modification
  modifiedSLReason?: string; // LEGACY: Keep for backward compatibility
  isTrailingSL?: boolean; // FIXED: "Trailing SL" radio button value
  symbolPrice?: number;
  entryEmotions?: string;
  entryEmotionNotes?: string;
  inTradeEmotions?: string;
  inTradeEmotionNotes?: string;
  exitEmotions?: string;
  exitEmotionNotes?: string;
  postExitEmotions?: string;
  postExitEmotionNotes?: string;
  symbolChart?: string;
  callChart?: string;
  putChart?: string;
  userId?: string;
}

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load trades from localStorage on mount
  useEffect(() => {
    // Try to load from localStorage first
    const savedTrades = localStorage.getItem('nifty-trades');

    if (savedTrades) {
      console.log('Loading trades from localStorage...');
      const parsedTrades = JSON.parse(savedTrades);
      setTrades(parsedTrades);
      console.log(`Loaded ${parsedTrades.length} trades from storage`);
    } else {
      console.log('No trades found in localStorage. Starting with empty trade journal.');
      // Start with empty array - user will import trades
      setTrades([]);
    }

    setIsLoading(false);
  }, []);

  // Save to localStorage whenever trades change
  useEffect(() => {
    if (trades.length > 0) {
      localStorage.setItem('nifty-trades', JSON.stringify(trades));
    }
  }, [trades]);

  // Add trade locally (no backend calls)
  const addTrade = (trade: Trade) => {
    const newTrade = {
      ...trade,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setTrades((prev) => [newTrade, ...prev]);
  };

  // Update trade locally (no backend calls)
  const updateTrade = (id: string, updates: Partial<Trade>) => {
    setTrades((prev) =>
      prev.map((trade) => (trade.id === id ? { ...trade, ...updates } : trade))
    );
  };

  // Delete trade locally (no backend calls)
  const deleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((trade) => trade.id !== id));
  };

  return { trades, addTrade, updateTrade, deleteTrade, isLoading };
}