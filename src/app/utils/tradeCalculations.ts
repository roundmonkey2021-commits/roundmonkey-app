import { Trade } from "../hooks/useTrades";

/**
 * Calculate PnL from raw trade data only (no stored calculations)
 * Returns undefined if trade is not closed (no exitPremium)
 */
export const calculatePnL = (trade: Trade): number | undefined => {
  if (!trade.exitPremium) return undefined;
  
  const entryPremium = trade.entryPremium;
  const exitPremium = trade.exitPremium;
  const lotSize = trade.lotSize || 1; // Number of lots
  const lotUnitSize = trade.lotUnitSize || 1; // Units per lot (e.g., 50 for NIFTY)
  
  // Calculate points per lot based on action
  const pointsPerLot = trade.action === 'buy'
    ? exitPremium - entryPremium
    : entryPremium - exitPremium;
  
  // PnL = points per lot × number of lots × lot unit size
  return pointsPerLot * lotSize * lotUnitSize;
};

/**
 * Calculate points captured (premium difference regardless of action)
 */
export const calculatePointsCaptured = (trade: Trade): number | null => {
  if (!trade.exitPremium) return null;
  
  const pointsPerLot = trade.action === 'buy'
    ? trade.exitPremium - trade.entryPremium
    : trade.entryPremium - trade.exitPremium;
  
  return pointsPerLot;
};
