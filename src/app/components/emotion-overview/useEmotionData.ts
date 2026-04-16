import { useMemo } from 'react';
import { calculatePnL, calculatePointsCaptured } from '../../utils/tradeCalculations';
import { getEmotionById } from '../../utils/emotionLookup';

export interface EmotionData {
  id: string;
  emotion: string;
  count: number;
  avgPnL: number;
  winRate: number;
  totalPnL: number;
  wins: number;
  losses: number;
  avgPointsCaptured: number;
}

interface Trade {
  pnl?: number;
  entryPremium: number;
  exitPremium?: number;
  action: string;
  quantity: number;
  lotSize?: number;
  lotUnitSize?: number;
  entryEmotions?: string;
  inTradeEmotions?: string;
  exitEmotions?: string;
  postExitEmotions?: string;
}

type EmotionType = 'entry' | 'inTrade' | 'exit' | 'postExit';

// Convert emotion ID to display name by looking up in Psychology Settings
const getEmotionDisplayName = (emotionId: string | undefined, type: EmotionType): string | undefined => {
  if (!emotionId || emotionId.trim() === '') return undefined;

  // Map emotion type to phase for lookup
  const phaseMap: Record<EmotionType, 'entry' | 'inTrade' | 'exit' | 'postExit'> = {
    entry: 'entry',
    inTrade: 'inTrade',
    exit: 'exit',
    postExit: 'postExit'
  };

  const phase = phaseMap[type];
  const emotionData = getEmotionById(emotionId, phase);

  // Return the type (display name) if found, otherwise return the ID as fallback
  return emotionData ? emotionData.type : emotionId;
};

const getEmotionField = (trade: Trade, type: EmotionType): string | undefined => {
  const emotionId = (() => {
    switch (type) {
      case 'entry': return trade.entryEmotions;
      case 'inTrade': return trade.inTradeEmotions;
      case 'exit': return trade.exitEmotions;
      case 'postExit': return trade.postExitEmotions;
    }
  })();

  // Convert ID to display name
  return getEmotionDisplayName(emotionId, type);
};

export function useEmotionData(trades: Trade[], emotionType: EmotionType): EmotionData[] {
  return useMemo(() => {
    const emotionCount = trades.reduce((acc, trade) => {
      const emotion = getEmotionField(trade, emotionType);
      
      if (emotion && emotion.trim() !== '') {
        if (!acc[emotion]) {
          acc[emotion] = { count: 0, totalPnL: 0, wins: 0, losses: 0, totalPointsCaptured: 0 };
        }
        acc[emotion].count += 1;
        
        // Use calculatePnL utility for correct calculation
        const pnl = calculatePnL(trade as any);
        if (pnl !== undefined) {
          acc[emotion].totalPnL += pnl;
          if (pnl > 0) acc[emotion].wins += 1;
          else if (pnl < 0) acc[emotion].losses += 1;
        }
        
        // Calculate points captured using utility
        const pointsCaptured = calculatePointsCaptured(trade as any);
        if (pointsCaptured !== null) {
          acc[emotion].totalPointsCaptured += pointsCaptured;
        }
      }
      return acc;
    }, {} as Record<string, { count: number; totalPnL: number; wins: number; losses: number; totalPointsCaptured: number }>);

    return Object.entries(emotionCount).map(([emotion, data], idx) => ({
      id: `${emotionType}-${emotion}-${idx}`,
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      count: data.count,
      avgPnL: data.count > 0 ? data.totalPnL / data.count : 0,
      winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
      totalPnL: data.totalPnL,
      wins: data.wins,
      losses: data.losses,
      avgPointsCaptured: data.count > 0 ? data.totalPointsCaptured / data.count : 0
    })).sort((a, b) => b.count - a.count);
  }, [trades, emotionType]);
}

export function getEmotionFieldFromTrade(trade: Trade, type: EmotionType): string | undefined {
  return getEmotionField(trade, type);
}