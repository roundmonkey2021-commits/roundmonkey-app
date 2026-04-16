import { useTheme } from "../hooks/useTheme";
import { useTrades, Trade } from "../hooks/useTrades";
import { useSettings } from "../hooks/useSettings";
import { Card, CardContent } from "./ui/card";
import { useState, useMemo, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TrendingUp, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { calculatePnL } from "../utils/tradeCalculations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { RiskDisciplineTrends } from "./discipline-trends/RiskDisciplineTrends";
import { ExecutionDisciplineTrends } from "./discipline-trends/ExecutionDisciplineTrends";
import { BehavioralDiscipline } from "./discipline-trends/BehavioralDiscipline";

export function DisciplineOverview() {
  const { theme } = useTheme();
  const { trades } = useTrades();
  const { settings } = useSettings();
  const isDark = theme === 'dark';
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);
  const phaseDropdownRef = useRef<HTMLDivElement>(null);
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [range, setRange] = useState<string>('All Time');
  const [timeRange, setTimeRange] = useState<'allTime' | 'trend'>('allTime');
  const [showSLDetails, setShowSLDetails] = useState(false);
  const [showPositionSizingDetails, setShowPositionSizingDetails] = useState(false);
  const [showStrikeDisciplineDetails, setShowStrikeDisciplineDetails] = useState(false);
  const [showTradePlanningDetails, setShowTradePlanningDetails] = useState(false);

  // Close phase dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phaseDropdownRef.current && !phaseDropdownRef.current.contains(event.target as Node)) {
        setShowPhaseDropdown(false);
      }
    };

    if (showPhaseDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPhaseDropdown]);

  // Initialize selected phases with all phases
  useMemo(() => {
    if (settings.tradingPhases && selectedPhases.length === 0) {
      setSelectedPhases(settings.tradingPhases.map(p => p.id));
    }
  }, [settings.tradingPhases]);

  const togglePhase = (phaseId: string) => {
    setSelectedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(p => p !== phaseId)
        : [...prev, phaseId]
    );
  };

  const selectAllPhases = () => {
    if (settings.tradingPhases) {
      setSelectedPhases(settings.tradingPhases.map(p => p.id));
    }
  };

  const clearAllPhases = () => {
    setSelectedPhases([]);
  };

  // Helper: Format numbers in Indian style (lakhs)
  const formatIndianCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(Math.round(amount)); // Remove decimals
    const numStr = absAmount.toString();

    if (numStr.length <= 3) {
      return `${isNegative ? '-' : ''}₹${numStr}`;
    }

    // Indian formatting: last 3 digits, then groups of 2
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;

    return `${isNegative ? '-' : ''}₹${formatted}`;
  };

  // Filter only closed NIFTY trades
  const closedTrades = trades.filter(t =>
    t.exitPremium !== undefined &&
    t.exitPremium !== null &&
    (t.symbol?.toUpperCase() === 'NIFTY')
  );

  // Get range options based on granularity and actual trade data
  const getRangeOptions = () => {
    if (closedTrades.length === 0) {
      // No trades, return default options
      switch (granularity) {
        case 'daily':
          return ['All Time'];
        case 'weekly':
          return ['All Weeks'];
        case 'monthly':
          return ['All Months'];
        default:
          return ['All Time'];
      }
    }

    // Get date range from trades
    const tradeDates = closedTrades.map(t => new Date(t.timestamp).getTime());
    const minDate = new Date(Math.min(...tradeDates));
    const maxDate = new Date(Math.max(...tradeDates));
    const daysDiff = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (granularity) {
      case 'daily': {
        const options: string[] = [];
        if (daysDiff >= 7) options.push('Last 7');
        if (daysDiff >= 14) options.push('Last 14');
        if (daysDiff >= 28) options.push('Last 28');
        options.push('All Time');
        return options;
      }
      case 'weekly': {
        const weeksDiff = Math.ceil(daysDiff / 7);
        const options: string[] = [];
        if (weeksDiff >= 2) options.push('Last 2');
        if (weeksDiff >= 3) options.push('Last 3');
        if (weeksDiff >= 4) options.push('Last 4');
        options.push('All Weeks');
        return options;
      }
      case 'monthly': {
        const monthsDiff = Math.ceil(daysDiff / 30);
        const options: string[] = [];
        if (monthsDiff >= 2) options.push('Last 2');
        if (monthsDiff >= 3) options.push('Last 3');
        if (monthsDiff >= 6) options.push('Last 6');
        options.push('All Months');
        return options;
      }
      default:
        return ['All Time'];
    }
  };

  // Update range when granularity changes
  useMemo(() => {
    const options = getRangeOptions();
    if (!options.includes(range)) {
      setRange(options[0]);
    }
  }, [granularity, closedTrades.length]);

  // Helper: Calculate moneyness for a trade
  const calculateMoneyness = (trade: Trade): string => {
    if (!trade.symbolPrice) return "N/A";
    
    const spotPrice = trade.symbolPrice;
    const strikePrice = trade.strikePrice;
    const interval = 50; // NIFTY strike interval
    const diff = strikePrice - spotPrice;
    
    // Check if ATM (within half interval)
    if (Math.abs(diff) < interval / 2) {
      return "ATM";
    }
    
    // For Call options
    if (trade.optionType === "call") {
      if (diff > 0) {
        return "OTM";
      } else {
        return "ITM";
      }
    } else { // For Put options
      if (diff < 0) {
        return "OTM";
      } else {
        return "ITM";
      }
    }
  };

  // Helper: Check if trade has complete plan
  const hasCompletePlan = (trade: Trade): boolean => {
    return !!trade.isPlanned;
  };

  // Helper: Calculate Risk-Reward ratio
  const calculateRiskReward = (trade: Trade): number | null => {
    if (!trade.planEntryPrice || !trade.planStopLoss || !trade.planExitPrice) {
      return null;
    }
    const risk = Math.abs(trade.planEntryPrice - trade.planStopLoss);
    const reward = Math.abs(trade.planExitPrice - trade.planEntryPrice);
    if (risk === 0) return null;
    return reward / risk;
  };

  // ========== DISCIPLINE METRICS CALCULATIONS ==========

  // 1. Stop Loss Adherence
  const plannedTrades = closedTrades.filter(t => hasCompletePlan(t));
  const slAdherentTrades = plannedTrades.filter(t => !t.slModified); // slModified is boolean
  const stopLossAdherence = plannedTrades.length > 0
    ? (slAdherentTrades.length / plannedTrades.length) * 100
    : 0;

  // SL Modified trades breakdown
  const slModifiedTrades = plannedTrades.filter(t => t.slModified === true);
  const slModifiedByReason = slModifiedTrades.reduce((acc, trade) => {
    const reason = trade.slModificationReason || trade.modifiedSLReason || 'No reason specified';
    if (!acc[reason]) {
      acc[reason] = {
        count: 0,
        trades: [],
        totalPnL: 0,
      };
    }
    acc[reason].count++;
    acc[reason].trades.push(trade);
    const pnl = calculatePnL(trade);
    if (pnl !== undefined) {
      acc[reason].totalPnL += pnl;
    }
    return acc;
  }, {} as { [key: string]: { count: number; trades: Trade[]; totalPnL: number } });

  const slModifiedReasonStats = Object.entries(slModifiedByReason).map(([reason, data]) => ({
    reason,
    count: data.count,
    percentage: (data.count / slModifiedTrades.length) * 100,
    totalPnL: data.totalPnL,
  })).sort((a, b) => b.count - a.count);

  // 2. Position Sizing Discipline
  const positionSizingAdherentTrades = plannedTrades.filter(t => {
    if (!t.lotSize || !t.allowedLotSize) return false;
    return t.lotSize <= t.allowedLotSize;
  });
  const positionSizingDiscipline = plannedTrades.length > 0
    ? (positionSizingAdherentTrades.length / plannedTrades.length) * 100
    : 0;

  // Position Sizing breakdown by phase
  const positionSizingByPhase = plannedTrades.reduce((acc, trade) => {
    const phase = trade.phase || 'No Phase';
    if (!acc[phase]) {
      acc[phase] = {
        maxAllowedLotSize: 0,
        totalActualLots: 0,
        tradeCount: 0,
      };
    }

    // Track max allowed lot size for this phase
    if (trade.allowedLotSize && trade.allowedLotSize > acc[phase].maxAllowedLotSize) {
      acc[phase].maxAllowedLotSize = trade.allowedLotSize;
    }

    // Sum actual lots traded
    if (trade.lotSize) {
      acc[phase].totalActualLots += trade.lotSize;
      acc[phase].tradeCount++;
    }

    return acc;
  }, {} as { [key: string]: { maxAllowedLotSize: number; totalActualLots: number; tradeCount: number } });

  const positionSizingPhaseStats = Object.entries(positionSizingByPhase).map(([phase, data]) => {
    const avgActualLots = data.tradeCount > 0 ? data.totalActualLots / data.tradeCount : 0;
    const avgUtilization = data.maxAllowedLotSize > 0
      ? (avgActualLots / data.maxAllowedLotSize) * 100
      : 0;

    return {
      phase,
      maxAllowedLotSize: data.maxAllowedLotSize,
      avgActualLots,
      avgUtilization,
      tradeCount: data.tradeCount,
    };
  }).sort((a, b) => a.phase.localeCompare(b.phase));

  // 3. Risk-Reward Adherence (R:R >= 1:3)
  const rrAdherentTrades = plannedTrades.filter(t => {
    const rr = calculateRiskReward(t);
    return rr !== null && rr >= 3;
  });
  const riskRewardAdherence = plannedTrades.length > 0 
    ? (rrAdherentTrades.length / plannedTrades.length) * 100 
    : 0;

  // 4. Strike Discipline (ITM or ATM only)
  const strikeAdherentTrades = closedTrades.filter(t => {
    const moneyness = calculateMoneyness(t);
    return moneyness === "ITM" || moneyness === "ATM";
  });
  const strikeDiscipline = closedTrades.length > 0
    ? (strikeAdherentTrades.length / closedTrades.length) * 100
    : 0;

  // Strike Discipline - Moneyness distribution
  const moneynessDistribution = closedTrades.reduce((acc, trade) => {
    const moneyness = calculateMoneyness(trade);
    if (!acc[moneyness]) {
      acc[moneyness] = {
        count: 0,
        trades: [],
      };
    }
    acc[moneyness].count++;
    acc[moneyness].trades.push(trade);
    return acc;
  }, {} as { [key: string]: { count: number; trades: Trade[] } });

  const moneynessStats = Object.entries(moneynessDistribution).map(([moneyness, data]) => ({
    moneyness,
    count: data.count,
    percentage: (data.count / closedTrades.length) * 100,
  })).sort((a, b) => {
    // Sort order: ITM, ATM, OTM, N/A
    const order: { [key: string]: number } = { 'ITM': 0, 'ATM': 1, 'OTM': 2, 'N/A': 3 };
    return (order[a.moneyness] || 99) - (order[b.moneyness] || 99);
  });

  // 5. Target Achievement Consistency
  // Step 1: Identify Planned Profitable Trades
  // A trade must be planned AND profitable:
  // - Must have isPlanned = 1 (or truthy)
  // - For action = "buy": profitable if exitPremium > entryPremium
  // - For action = "sell": profitable if exitPremium < entryPremium
  const plannedProfitableTrades = closedTrades.filter(t => {
    // Must be a planned trade
    if (!hasCompletePlan(t)) return false;

    if (!t.entryPremium || !t.exitPremium || !t.action) return false;

    if (t.action === 'buy') {
      return t.exitPremium > t.entryPremium;
    } else if (t.action === 'sell') {
      return t.exitPremium < t.entryPremium;
    }
    return false;
  });

  // Step 2: Among planned profitable trades, check if target was achieved:
  // - For action = "buy": exitPremium >= planExitPrice
  // - For action = "sell": exitPremium <= planExitPrice
  const tradesAchievingTarget = plannedProfitableTrades.filter(t => {
    if (!t.planExitPrice) return false;

    if (t.action === 'buy') {
      return t.exitPremium >= t.planExitPrice;
    } else if (t.action === 'sell') {
      return t.exitPremium <= t.planExitPrice;
    }
    return false;
  });

  const targetAchievementConsistency = plannedProfitableTrades.length > 0
    ? (tradesAchievingTarget.length / plannedProfitableTrades.length) * 100
    : 0;

  // 6. Trade Planning Discipline
  const tradesWithCompletePlan = closedTrades.filter(t => hasCompletePlan(t));
  const tradePlanningDiscipline = closedTrades.length > 0 
    ? (tradesWithCompletePlan.length / closedTrades.length) * 100 
    : 0;

  // 7. Overtrading Discipline
  // Group trades by date
  const tradesByDate: { [key: string]: Trade[] } = {};
  closedTrades.forEach(trade => {
    const date = new Date(trade.timestamp).toISOString().split('T')[0];
    if (!tradesByDate[date]) {
      tradesByDate[date] = [];
    }
    tradesByDate[date].push(trade);
  });

  // Simple rule: Max 3 trades per day (you can adjust)
  const maxTradesPerDay = 3;

  // Count days that stayed within limit vs days that exceeded
  const totalTradingDays = Object.keys(tradesByDate).length;
  const daysWithinLimit = Object.values(tradesByDate).filter(
    dayTrades => dayTrades.length <= maxTradesPerDay
  ).length;
  const daysExceedingLimit = totalTradingDays - daysWithinLimit;

  const overtradingDiscipline = totalTradingDays > 0
    ? (daysWithinLimit / totalTradingDays) * 100
    : 0;

  // 8. Daily Loss Discipline
  // Calculate net PnL per day and check if it exceeds maxDailyLoss for the phase
  const dailyPnLByDate: { [key: string]: { pnl: number; phase: string | undefined } } = {};

  closedTrades.forEach(trade => {
    const date = new Date(trade.timestamp).toISOString().split('T')[0];
    const pnl = calculatePnL(trade);

    if (pnl !== undefined && pnl !== null) {
      if (!dailyPnLByDate[date]) {
        dailyPnLByDate[date] = { pnl: 0, phase: trade.phase };
      }
      dailyPnLByDate[date].pnl += pnl;
    }
  });

  // Check which days breached the max daily loss limit
  const daysBreachingMaxLoss = Object.entries(dailyPnLByDate).filter(([date, data]) => {
    // Find the phase's max daily loss
    const phase = settings.tradingPhases?.find(p => p.id === data.phase);
    const maxDailyLoss = phase?.maxDailyLoss || 0;

    // A breach occurs when net loss exceeds the limit (negative PnL more than maxDailyLoss)
    return data.pnl < 0 && Math.abs(data.pnl) > maxDailyLoss;
  }).length;

  const totalDaysWithTrades = Object.keys(dailyPnLByDate).length;
  const daysWithinDailyLossLimit = totalDaysWithTrades - daysBreachingMaxLoss;

  const dailyLossDiscipline = totalDaysWithTrades > 0
    ? (daysWithinDailyLossLimit / totalDaysWithTrades) * 100
    : 0;

  // ========== UNPLANNED TRADE INSIGHTS ==========
  // Filter unplanned trades
  const unplannedTrades = closedTrades.filter(t => !hasCompletePlan(t));

  // Section 1: Entry Emotion Analysis for unplanned trades
  const unplannedEntryEmotions = unplannedTrades
    .filter(t => t.entryEmotions)
    .reduce((acc, t) => {
      const emotion = t.entryEmotions!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  const unplannedEntryEmotionStats = Object.entries(unplannedEntryEmotions)
    .map(([emotion, count]) => ({
      emotion,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const topUnplannedEntryEmotion = unplannedEntryEmotionStats[0]?.emotion || 'N/A';

  // Section 2: Previous Trade Influence
  // Sort all trades by timestamp to establish sequence
  const sortedTrades = [...closedTrades].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // For each unplanned trade, find the previous trade on the same day
  interface PreviousTradeInfluence {
    exitEmotion?: string;
    postExitEmotion?: string;
    outcome: 'Profit' | 'Loss' | 'N/A';
  }

  const previousTradeInfluences: PreviousTradeInfluence[] = [];

  unplannedTrades.forEach(unplannedTrade => {
    const unplannedDate = new Date(unplannedTrade.timestamp).toISOString().split('T')[0];
    const unplannedIndex = sortedTrades.findIndex(t => t === unplannedTrade);

    // Find previous trade on the same day
    let previousTrade: Trade | undefined;
    for (let i = unplannedIndex - 1; i >= 0; i--) {
      const tradeDate = new Date(sortedTrades[i].timestamp).toISOString().split('T')[0];
      if (tradeDate === unplannedDate) {
        previousTrade = sortedTrades[i];
        break;
      }
      // Stop if we've moved to a different day
      if (tradeDate !== unplannedDate) break;
    }

    if (previousTrade) {
      // Calculate PnL for previous trade
      const pnl = calculatePnL(previousTrade);
      let outcome: 'Profit' | 'Loss' | 'N/A' = 'N/A';
      if (pnl !== undefined && pnl !== null) {
        outcome = pnl > 0 ? 'Profit' : 'Loss';
      }

      previousTradeInfluences.push({
        exitEmotion: previousTrade.exitEmotions,
        postExitEmotion: previousTrade.postExitEmotions,
        outcome,
      });
    }
  });

  // Subsection A: Exit Emotions
  const previousExitEmotionCounts = previousTradeInfluences
    .filter(p => p.exitEmotion)
    .reduce((acc, p) => {
      const emotion = p.exitEmotion!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  const previousExitEmotionStats = Object.entries(previousExitEmotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);

  // Subsection B: Post-Exit Emotions
  const previousPostExitEmotionCounts = previousTradeInfluences
    .filter(p => p.postExitEmotion)
    .reduce((acc, p) => {
      const emotion = p.postExitEmotion!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  const previousPostExitEmotionStats = Object.entries(previousPostExitEmotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);

  // Subsection C: Previous Trade Outcome
  const outcomeAfterProfit = previousTradeInfluences.filter(p => p.outcome === 'Profit').length;
  const outcomeAfterLoss = previousTradeInfluences.filter(p => p.outcome === 'Loss').length;
  const totalWithPreviousTrade = outcomeAfterProfit + outcomeAfterLoss;

  const outcomeStats = [
    { name: 'After Profit', value: outcomeAfterProfit, color: '#10b981' },
    { name: 'After Loss', value: outcomeAfterLoss, color: '#ef4444' },
  ];

  const percentAfterLoss = totalWithPreviousTrade > 0
    ? ((outcomeAfterLoss / totalWithPreviousTrade) * 100).toFixed(0)
    : '0';

  // Section 3: Behavioral Pattern Detection
  // Combine current entry emotion + previous post-exit emotion + previous outcome
  interface BehavioralPattern {
    entryEmotion: string;
    postExitEmotion: string;
    outcome: string;
    count: number;
  }

  const behavioralPatternMap: { [key: string]: BehavioralPattern } = {};

  unplannedTrades.forEach(unplannedTrade => {
    if (!unplannedTrade.entryEmotions) return;

    const unplannedDate = new Date(unplannedTrade.timestamp).toISOString().split('T')[0];
    const unplannedIndex = sortedTrades.findIndex(t => t === unplannedTrade);

    // Find previous trade on the same day
    let previousTrade: Trade | undefined;
    for (let i = unplannedIndex - 1; i >= 0; i--) {
      const tradeDate = new Date(sortedTrades[i].timestamp).toISOString().split('T')[0];
      if (tradeDate === unplannedDate) {
        previousTrade = sortedTrades[i];
        break;
      }
      if (tradeDate !== unplannedDate) break;
    }

    if (previousTrade && previousTrade.postExitEmotions) {
      const pnl = calculatePnL(previousTrade);
      let outcome = 'N/A';
      if (pnl !== undefined && pnl !== null) {
        outcome = pnl > 0 ? 'Profit' : 'Loss';
      }

      const key = `${unplannedTrade.entryEmotions}|${previousTrade.postExitEmotions}|${outcome}`;

      if (!behavioralPatternMap[key]) {
        behavioralPatternMap[key] = {
          entryEmotion: unplannedTrade.entryEmotions,
          postExitEmotion: previousTrade.postExitEmotions,
          outcome,
          count: 0,
        };
      }
      behavioralPatternMap[key].count++;
    }
  });

  const behavioralPatterns = Object.values(behavioralPatternMap).sort((a, b) => b.count - a.count);
  const topBehavioralPattern = behavioralPatterns[0];

  // ========== RULE VIOLATIONS ==========
  const earlyExitViolations = closedTrades.filter(t => hasCompletePlan(t) && t.earlyExit === true).length;
  const slModifiedViolations = closedTrades.filter(t => hasCompletePlan(t) && t.slModified === true).length; // slModified is boolean
  const otmTradesViolations = closedTrades.filter(t => {
    const moneyness = calculateMoneyness(t);
    return moneyness === "OTM";
  }).length;

  // ========== EMOTIONAL INFLUENCE ==========
  const earlyExitEmotions = closedTrades
    .filter(t => hasCompletePlan(t) && t.earlyExit === true && t.exitEmotions)
    .reduce((acc, t) => {
      const emotion = t.exitEmotions!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  const overtradingEmotions = closedTrades
    .filter(t => t.postExitEmotions)
    .reduce((acc, t) => {
      const emotion = t.postExitEmotions!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  const positionSizingViolationEmotions = closedTrades
    .filter(t => {
      if (!t.lotSize || !t.allowedLotSize) return false;
      return t.lotSize > t.allowedLotSize && t.entryEmotions;
    })
    .reduce((acc, t) => {
      const emotion = t.entryEmotions!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  const slModificationEmotions = closedTrades
    .filter(t => hasCompletePlan(t) && t.slModified === true && t.inTradeEmotions) // slModified is boolean
    .reduce((acc, t) => {
      const emotion = t.inTradeEmotions!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  // ========== BEST & WORST AREAS ==========
  const disciplineMetrics = [
    { name: 'Stop Loss Adherence', value: stopLossAdherence },
    { name: 'Position Sizing Discipline', value: positionSizingDiscipline },
    { name: 'Risk-Reward Adherence', value: riskRewardAdherence },
    { name: 'Strike Discipline', value: strikeDiscipline },
    { name: 'Target Achievement', value: targetAchievementConsistency },
    { name: 'Trade Planning', value: tradePlanningDiscipline },
    { name: 'Overtrading Discipline', value: overtradingDiscipline },
    { name: 'Daily Loss Discipline', value: dailyLossDiscipline },
  ];

  const bestArea = [...disciplineMetrics].sort((a, b) => b.value - a.value)[0];
  const worstArea = [...disciplineMetrics].sort((a, b) => a.value - b.value)[0];

  // ========== RENDER HELPERS ==========
  const getIndicator = (percentage: number) => {
    if (percentage >= 85) return <CheckCircle2 className="size-5 text-emerald-600" />;
    if (percentage < 65) return <AlertTriangle className="size-5 text-orange-600" />;
    return null;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 85) return 'text-emerald-600';
    if (percentage < 65) return 'text-orange-600';
    return 'text-neutral-700';
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-neutral-50'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-neutral-200 bg-white'}`}>
        <div className="px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Discipline Overview
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                Execution quality and rule adherence across all trades
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-end gap-3 flex-wrap justify-end">
              {/* Filter by Phase (visible in Trend mode) */}
              {timeRange === 'trend' && settings.tradingPhases && settings.tradingPhases.length > 0 && (
                <div className="relative" ref={phaseDropdownRef}>
                  <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Filter by Phase
                  </label>
                  <button
                    onClick={() => setShowPhaseDropdown(!showPhaseDropdown)}
                    className={`min-w-[140px] px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between gap-2 ${
                      isDark
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750'
                        : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                    } border transition-colors`}
                  >
                    <span className="truncate">
                      {selectedPhases.length === 0
                        ? 'No phases'
                        : selectedPhases.length === settings.tradingPhases.length
                        ? 'All Phases'
                        : `${selectedPhases.length} selected`}
                    </span>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </button>

                  {/* Phase Dropdown */}
                  {showPhaseDropdown && (
                    <div
                      className={`absolute right-0 mt-1 w-56 rounded-md shadow-lg z-50 border ${
                        isDark
                          ? 'bg-zinc-800 border-zinc-700'
                          : 'bg-white border-neutral-200'
                      }`}
                    >
                      <div className="p-2">
                        {/* Select All / Clear buttons */}
                        <div className={`flex gap-2 mb-2 pb-2 border-b ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
                          <button
                            onClick={selectAllPhases}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
                              isDark
                                ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                          >
                            Select All
                          </button>
                          <button
                            onClick={clearAllPhases}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
                              isDark
                                ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                          >
                            Clear
                          </button>
                        </div>

                        {/* Phase checkboxes */}
                        {settings.tradingPhases.map((phase) => (
                          <label
                            key={phase.id}
                            className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded hover:bg-opacity-10 ${
                              isDark ? 'hover:bg-white' : 'hover:bg-black'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPhases.includes(phase.id)}
                              onChange={() => togglePhase(phase.id)}
                              className={`w-4 h-4 rounded ${isDark ? 'border-zinc-600' : 'border-neutral-400'}`}
                            />
                            <span className={`text-sm ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                              {phase.id}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Granularity (visible in Trend mode) */}
              {timeRange === 'trend' && (
                <div className="flex flex-col gap-2">
                  <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Granularity
                  </label>
                  <div className={`flex rounded-md overflow-hidden border ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
                    {(['daily', 'weekly', 'monthly'] as const).map((gran) => (
                      <button
                        key={gran}
                        onClick={() => setGranularity(gran)}
                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                          granularity === gran
                            ? isDark
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : isDark
                            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {gran}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Range (visible in Trend mode) */}
              {timeRange === 'trend' && (
                <div className="flex flex-col gap-2">
                  <label className={`text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Range
                  </label>
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isDark
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                        : 'bg-white text-neutral-900 border-neutral-300'
                    } border`}
                  >
                    {getRangeOptions().map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Range (always visible) */}
              <div className="flex flex-col gap-2">
                <label className={`text-xs font-medium mb-1.5 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as 'allTime' | 'trend')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isDark
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      : 'bg-white text-neutral-900 border-neutral-300'
                  } border`}
                >
                  <option value="allTime">All Time</option>
                  <option value="trend">Trend</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-6 space-y-6">
        {/* Conditional Rendering based on timeRange */}
        {timeRange === 'trend' ? (
          /* Trend View */
          <div className="space-y-6">
            {closedTrades.length === 0 ? (
              <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <TrendingUp className={`size-16 mx-auto mb-4 ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`} />
                    <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                      No Trade Data Available
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      Start logging trades to see discipline trends
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Section 1: Risk Discipline Trends */}
                <RiskDisciplineTrends
                  trades={closedTrades}
                  granularity={granularity}
                  range={range}
                  selectedPhases={selectedPhases}
                  isDark={isDark}
                />

                {/* Section 2: Execution Discipline Trends */}
                <ExecutionDisciplineTrends
                  trades={closedTrades}
                  granularity={granularity}
                  range={range}
                  selectedPhases={selectedPhases}
                  isDark={isDark}
                />

                {/* Section 3: Behavioral Discipline */}
                <BehavioralDiscipline
                  trades={closedTrades}
                  granularity={granularity}
                  range={range}
                  selectedPhases={selectedPhases}
                  isDark={isDark}
                  maxTradesPerDay={3}
                  maxDailyLoss={settings.tradingPhases?.[0]?.maxDailyLoss || 0}
                />
              </>
            )}
          </div>
        ) : (
          /* All Time View - Aggregated Metrics */
          <>
            {/* Info Card - Planned Trade Definition */}
            <Card className={`${isDark ? 'bg-blue-950/30 border-blue-900' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className={`p-1.5 rounded ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <CheckCircle2 className="size-4 text-blue-600" />
              </div>
              <div>
                <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                  Planned Trade Definition
                </h4>
                <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  A trade is considered "planned" if the <strong>Planned</strong> field is marked as "Yes" in the trade entry form.
                  Currently: <strong>{plannedTrades.length} of {closedTrades.length}</strong> trades are planned ({tradePlanningDiscipline.toFixed(0)}%).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-3 gap-6">
          {/* Discipline Score */}
          <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : ''} ${
            7.4 >= 7 ? (isDark ? 'border-l-4 border-l-emerald-600/50 bg-emerald-950/10' : 'border-l-4 border-l-emerald-500 bg-emerald-50/50') :
            7.4 < 6 ? (isDark ? 'border-l-4 border-l-red-600/50 bg-red-950/10' : 'border-l-4 border-l-red-500 bg-red-50/50') :
            ''
          }`}>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-5">
                <div>
                  <h3 className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Discipline Score (Preview)
                  </h3>
                </div>
                
                {/* Main Score with Change Indicator */}
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                        7.4
                      </span>
                      <span className={`text-xl ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>/ 10</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="size-5 text-emerald-600" />
                        <span className="text-xl font-semibold text-emerald-600">+0.6</span>
                      </div>
                      <span className={`text-xs mt-0.5 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                        vs previous period
                      </span>
                    </div>
                  </div>
                  
                  {/* Interpretation */}
                  <p className={`text-xs italic ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                    Good discipline — needs improvement in behavior
                  </p>
                </div>
                
                {/* Breakdown - De-emphasized */}
                <div className="space-y-1.5 pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-neutral-200'}">
                  <div className="flex justify-between">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>Risk</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>8.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>Execution</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>7.1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>Behavior</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>6.3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Discipline Area */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <h3 className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Best Discipline Area
                  </h3>
                </div>
                <div>
                  <div className={`text-lg font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    {bestArea.name}
                  </div>
                  <div className="text-3xl font-semibold text-emerald-600 mt-2">
                    {bestArea.value.toFixed(0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Worst Discipline Area */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-orange-600" />
                  <h3 className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Worst Discipline Area
                  </h3>
                </div>
                <div>
                  <div className={`text-lg font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    {worstArea.name}
                  </div>
                  <div className="text-3xl font-semibold text-orange-600 mt-2">
                    {worstArea.value.toFixed(0)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Discipline Metrics Section */}
        <div className="grid grid-cols-2 gap-6">
          {/* Risk Discipline */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
            <CardContent className="pt-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Risk Discipline
              </h3>
              <div className="space-y-4">
                {/* Stop Loss Adherence */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {getIndicator(stopLossAdherence)}
                        <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          Stop Loss Adherence
                        </span>
                        {slModifiedTrades.length > 0 && (
                          <button
                            onClick={() => setShowSLDetails(!showSLDetails)}
                            className={`ml-auto p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                            title="View SL modification details"
                          >
                            {showSLDetails ? (
                              <ChevronUp className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            ) : (
                              <ChevronDown className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 ml-8">
                        {slAdherentTrades.length} of {plannedTrades.length} planned trades (SL not modified)
                      </div>
                    </div>
                    <span className={`text-lg font-semibold ${getPercentageColor(stopLossAdherence)}`}>
                      {stopLossAdherence.toFixed(0)}%
                    </span>
                  </div>

                  {/* Expandable SL Modification Details */}
                  {showSLDetails && slModifiedTrades.length > 0 && (
                    <div className={`mt-2 p-4 rounded border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-orange-50/50 border-orange-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          <AlertTriangle className="size-4 text-orange-600" />
                          SL Modification Breakdown ({slModifiedTrades.length} trades)
                        </h4>
                        <button
                          onClick={() => setShowSLDetails(false)}
                          className={`p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                        >
                          <ChevronUp className="size-4" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-orange-200'}`}>
                              <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Reason
                              </th>
                              <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Count
                              </th>
                              <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                %
                              </th>
                              <th className={`text-right py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Total P&L
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {slModifiedReasonStats.map((stat, index) => (
                              <tr
                                key={index}
                                className={`border-b ${isDark ? 'border-zinc-700/50' : 'border-orange-100'}`}
                              >
                                <td className={`py-2 px-2 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                                  {stat.reason}
                                </td>
                                <td className={`py-2 px-2 text-center font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                  {stat.count}
                                </td>
                                <td className={`py-2 px-2 text-center ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                  {stat.percentage.toFixed(1)}%
                                </td>
                                <td className={`py-2 px-2 text-right font-semibold ${
                                  stat.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatIndianCurrency(stat.totalPnL)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className={`border-t-2 ${isDark ? 'border-zinc-600' : 'border-orange-300'}`}>
                              <td className={`py-2 px-2 font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                Total
                              </td>
                              <td className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                {slModifiedTrades.length}
                              </td>
                              <td className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                100%
                              </td>
                              <td className={`py-2 px-2 text-right font-bold ${
                                slModifiedReasonStats.reduce((sum, s) => sum + s.totalPnL, 0) >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}>
                                {formatIndianCurrency(slModifiedReasonStats.reduce((sum, s) => sum + s.totalPnL, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Position Sizing Discipline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {getIndicator(positionSizingDiscipline)}
                        <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          Position Sizing Discipline
                        </span>
                        {positionSizingPhaseStats.length > 0 && (
                          <button
                            onClick={() => setShowPositionSizingDetails(!showPositionSizingDetails)}
                            className={`ml-auto p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                            title="View position sizing by phase"
                          >
                            {showPositionSizingDetails ? (
                              <ChevronUp className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            ) : (
                              <ChevronDown className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 ml-8">
                        {positionSizingAdherentTrades.length} of {plannedTrades.length} planned trades (within limit)
                      </div>
                    </div>
                    <span className={`text-lg font-semibold ${getPercentageColor(positionSizingDiscipline)}`}>
                      {positionSizingDiscipline.toFixed(0)}%
                    </span>
                  </div>

                  {/* Expandable Position Sizing Details */}
                  {showPositionSizingDetails && positionSizingPhaseStats.length > 0 && (
                    <div className={`mt-2 p-4 rounded border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-emerald-50/50 border-emerald-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          <CheckCircle2 className="size-4 text-emerald-600" />
                          Position Sizing by Phase ({plannedTrades.length} trades)
                        </h4>
                        <button
                          onClick={() => setShowPositionSizingDetails(false)}
                          className={`p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                        >
                          <ChevronUp className="size-4" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-emerald-200'}`}>
                              <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Phase
                              </th>
                              <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Max Allowed Lot Size
                              </th>
                              <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Avg Actual Lots
                              </th>
                              <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Avg Utilization
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {positionSizingPhaseStats.map((stat, index) => (
                              <tr
                                key={index}
                                className={`border-b ${isDark ? 'border-zinc-700/50' : 'border-emerald-100'}`}
                              >
                                <td className={`py-2 px-2 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                                  {stat.phase}
                                </td>
                                <td className={`py-2 px-2 text-center font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                  {stat.maxAllowedLotSize}
                                </td>
                                <td className={`py-2 px-2 text-center ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                  {stat.avgActualLots.toFixed(1)}
                                </td>
                                <td className={`py-2 px-2 text-center font-semibold ${
                                  stat.avgUtilization >= 80 ? 'text-emerald-600' : stat.avgUtilization >= 60 ? 'text-amber-600' : 'text-orange-600'
                                }`}>
                                  {stat.avgUtilization.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Risk-Reward Adherence */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getIndicator(riskRewardAdherence)}
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                        Risk-Reward Adherence (≥1:3)
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 ml-8">
                      {rrAdherentTrades.length} of {plannedTrades.length} planned trades (R:R ≥ 1:3)
                    </div>
                  </div>
                  <span className={`text-lg font-semibold ${getPercentageColor(riskRewardAdherence)}`}>
                    {riskRewardAdherence.toFixed(0)}%
                  </span>
                </div>

                {/* Strike Discipline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {getIndicator(strikeDiscipline)}
                        <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          Strike Discipline (ITM/ATM)
                        </span>
                        {moneynessStats.length > 0 && (
                          <button
                            onClick={() => setShowStrikeDisciplineDetails(!showStrikeDisciplineDetails)}
                            className={`ml-auto p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                            title="View moneyness distribution"
                          >
                            {showStrikeDisciplineDetails ? (
                              <ChevronUp className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            ) : (
                              <ChevronDown className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 ml-8">
                        {strikeAdherentTrades.length} of {closedTrades.length} trades (ITM or ATM only)
                      </div>
                    </div>
                    <span className={`text-lg font-semibold ${getPercentageColor(strikeDiscipline)}`}>
                      {strikeDiscipline.toFixed(0)}%
                    </span>
                  </div>

                  {/* Expandable Moneyness Distribution */}
                  {showStrikeDisciplineDetails && moneynessStats.length > 0 && (
                    <div className={`mt-2 p-4 rounded border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-blue-50/50 border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          <AlertTriangle className="size-4 text-blue-600" />
                          Moneyness Distribution ({closedTrades.length} trades)
                        </h4>
                        <button
                          onClick={() => setShowStrikeDisciplineDetails(false)}
                          className={`p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                        >
                          <ChevronUp className="size-4" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`border-b ${isDark ? 'border-zinc-700' : 'border-blue-200'}`}>
                              <th className={`text-left py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Moneyness
                              </th>
                              <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Count
                              </th>
                              <th className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                %
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {moneynessStats.map((stat, index) => (
                              <tr
                                key={index}
                                className={`border-b ${isDark ? 'border-zinc-700/50' : 'border-blue-100'} ${
                                  stat.moneyness === 'OTM' ? (isDark ? 'bg-orange-950/30' : 'bg-orange-50/70') : ''
                                }`}
                              >
                                <td className={`py-2 px-2 font-medium ${
                                  stat.moneyness === 'OTM' ? 'text-orange-600' : (isDark ? 'text-zinc-300' : 'text-neutral-700')
                                }`}>
                                  {stat.moneyness}
                                  {stat.moneyness === 'OTM' && (
                                    <span className="ml-2 text-xs font-normal">(Out-of-the-Money)</span>
                                  )}
                                </td>
                                <td className={`py-2 px-2 text-center font-medium ${
                                  stat.moneyness === 'OTM' ? 'text-orange-600' : (isDark ? 'text-zinc-200' : 'text-neutral-900')
                                }`}>
                                  {stat.count}
                                </td>
                                <td className={`py-2 px-2 text-center font-semibold ${
                                  stat.moneyness === 'OTM' ? 'text-orange-600' : (isDark ? 'text-zinc-400' : 'text-neutral-600')
                                }`}>
                                  {stat.percentage.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className={`border-t-2 ${isDark ? 'border-zinc-600' : 'border-blue-300'}`}>
                              <td className={`py-2 px-2 font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                Total
                              </td>
                              <td className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                {closedTrades.length}
                              </td>
                              <td className={`py-2 px-2 text-center font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                100%
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Execution & Behavioral Discipline */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
            <CardContent className="pt-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Execution Discipline
              </h3>
              <div className="space-y-4 mb-6">
                {/* Target Achievement Consistency */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getIndicator(targetAchievementConsistency)}
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                        Target Achievement Consistency
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 ml-8">
                      {tradesAchievingTarget.length} of {plannedProfitableTrades.length} planned profitable trades hit target
                    </div>
                  </div>
                  <span className={`text-lg font-semibold ${getPercentageColor(targetAchievementConsistency)}`}>
                    {targetAchievementConsistency.toFixed(0)}%
                  </span>
                </div>

                {/* Trade Planning Discipline */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {getIndicator(tradePlanningDiscipline)}
                        <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          Trade Planning Discipline
                        </span>
                        {unplannedTrades.length > 0 && (
                          <button
                            onClick={() => setShowTradePlanningDetails(!showTradePlanningDetails)}
                            className={`ml-auto p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                            title="View unplanned trade insights"
                          >
                            {showTradePlanningDetails ? (
                              <ChevronUp className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            ) : (
                              <ChevronDown className={`size-4 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`} />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 ml-8">
                        {tradesWithCompletePlan.length} of {closedTrades.length} trades (complete plan)
                      </div>
                    </div>
                    <span className={`text-lg font-semibold ${getPercentageColor(tradePlanningDiscipline)}`}>
                      {tradePlanningDiscipline.toFixed(0)}%
                    </span>
                  </div>

                  {/* Expandable Unplanned Trade Insights */}
                  {showTradePlanningDetails && unplannedTrades.length > 0 && (
                    <div className={`mt-2 p-4 rounded border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-orange-50/50 border-orange-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          <AlertTriangle className="size-4 text-orange-600" />
                          Unplanned Trade Insights ({unplannedTrades.length} trades)
                        </h4>
                        <button
                          onClick={() => setShowTradePlanningDetails(false)}
                          className={`p-1 rounded hover:bg-neutral-200 transition-colors ${isDark ? 'hover:bg-zinc-700' : ''}`}
                        >
                          <ChevronUp className="size-4" />
                        </button>
                      </div>

                      {/* Section 1: Entry Emotion Analysis */}
                      {unplannedEntryEmotionStats.length > 0 && (
                        <div className="mb-6">
                          <h5 className={`text-xs font-semibold mb-3 ${isDark ? 'text-zinc-300' : 'text-neutral-800'}`}>
                            Entry Emotion Analysis
                          </h5>
                          <div className="h-48 mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={unplannedEntryEmotionStats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
                                <XAxis type="number" tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }} />
                                <YAxis
                                  dataKey="emotion"
                                  type="category"
                                  width={120}
                                  tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 10 }}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: isDark ? '#27272a' : '#fff',
                                    border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                  }}
                                />
                                <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          <p className={`text-xs italic ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                            Most frequent entry emotion in unplanned trades: <strong className="text-orange-600">{topUnplannedEntryEmotion}</strong>
                          </p>
                        </div>
                      )}

                      {/* Divider */}
                      <div className={`border-t my-6 ${isDark ? 'border-zinc-700' : 'border-orange-200'}`} />

                      {/* Section 2: Previous Trade Influence */}
                      {previousTradeInfluences.length > 0 && (
                        <div className="mb-6">
                          <h5 className={`text-xs font-semibold mb-3 ${isDark ? 'text-zinc-300' : 'text-neutral-800'}`}>
                            Previous Trade Influence (Same Day)
                          </h5>

                          {/* Subsection A: Exit Emotions */}
                          {previousExitEmotionStats.length > 0 && (
                            <div className="mb-6">
                              <h6 className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-700'}`}>
                                Exit Emotions Before Unplanned Trades
                              </h6>
                              <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={previousExitEmotionStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
                                    <XAxis type="number" tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }} />
                                    <YAxis
                                      dataKey="emotion"
                                      type="category"
                                      width={120}
                                      tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 10 }}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: isDark ? '#27272a' : '#fff',
                                        border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                      }}
                                    />
                                    <Bar dataKey="count" fill="#ea580c" radius={[0, 4, 4, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {/* Subsection B: Post-Exit Emotions */}
                          {previousPostExitEmotionStats.length > 0 && (
                            <div className="mb-6">
                              <h6 className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-700'}`}>
                                Post-Exit Emotions Leading to Unplanned Trades
                              </h6>
                              <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={previousPostExitEmotionStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
                                    <XAxis type="number" tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }} />
                                    <YAxis
                                      dataKey="emotion"
                                      type="category"
                                      width={120}
                                      tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 10 }}
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: isDark ? '#27272a' : '#fff',
                                        border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                      }}
                                    />
                                    <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}

                          {/* Subsection C: Previous Trade Outcome */}
                          {totalWithPreviousTrade > 0 && (
                            <div className="mb-4">
                              <h6 className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-700'}`}>
                                Previous Trade Outcome
                              </h6>
                              <div className="flex items-center gap-6">
                                <div className="h-40 w-40">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={outcomeStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={30}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                      >
                                        {outcomeStats.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: isDark ? '#27272a' : '#fff',
                                          border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                                          borderRadius: '6px',
                                          fontSize: '12px'
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="flex-1">
                                  <div className="space-y-2">
                                    {outcomeStats.map((stat) => (
                                      <div key={stat.name} className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: stat.color }}
                                        />
                                        <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                                          {stat.name}: {stat.value}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className={`text-xs italic mt-3 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                    <strong className="text-red-600">{percentAfterLoss}%</strong> of unplanned trades occurred after losses
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Divider */}
                      {topBehavioralPattern && (
                        <>
                          <div className={`border-t my-6 ${isDark ? 'border-zinc-700' : 'border-orange-200'}`} />

                          {/* Section 3: Behavioral Pattern Detection */}
                          <div>
                            <h5 className={`text-xs font-semibold mb-3 ${isDark ? 'text-zinc-300' : 'text-neutral-800'}`}>
                              Behavioral Pattern Detection
                            </h5>
                            <div className={`p-3 rounded ${isDark ? 'bg-zinc-900/50' : 'bg-orange-100/50'}`}>
                              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Most common pattern ({topBehavioralPattern.count} occurrences):
                              </p>
                              <p className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                <span className="text-orange-600 capitalize">{topBehavioralPattern.entryEmotion}</span>
                                {' after '}
                                <span className="text-red-600 capitalize">{topBehavioralPattern.postExitEmotion}</span>
                                {' following a '}
                                <span className={topBehavioralPattern.outcome === 'Loss' ? 'text-red-600' : 'text-green-600'}>
                                  {topBehavioralPattern.outcome}
                                </span>
                                {' trade'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <h3 className={`text-lg font-semibold mb-4 mt-6 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Behavioral Discipline
              </h3>
              <div className="space-y-4">
                {/* Overtrading Discipline */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getIndicator(overtradingDiscipline)}
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                        Overtrading Discipline
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 ml-8">
                      {daysWithinLimit} of {totalTradingDays} trading days (≤{maxTradesPerDay} trades/day)
                    </div>
                  </div>
                  <span className={`text-lg font-semibold ${getPercentageColor(overtradingDiscipline)}`}>
                    {overtradingDiscipline.toFixed(0)}%
                  </span>
                </div>

                {/* Daily Loss Discipline */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border border-neutral-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {getIndicator(dailyLossDiscipline)}
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                        Daily Loss Discipline
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500 ml-8">
                      {daysWithinDailyLossLimit} of {totalDaysWithTrades} trading days (within max daily loss)
                    </div>
                  </div>
                  <span className={`text-lg font-semibold ${getPercentageColor(dailyLossDiscipline)}`}>
                    {dailyLossDiscipline.toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rule Violations & Emotional Influence */}
        <div className="grid grid-cols-2 gap-6">
          {/* Rule Violations */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
            <CardContent className="pt-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Rule Violations
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>Early Exit</span>
                  <Badge variant={earlyExitViolations > 5 ? 'destructive' : 'secondary'}>
                    {earlyExitViolations} trades
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>Overtrading</span>
                  <Badge variant={daysExceedingLimit > 3 ? 'destructive' : 'secondary'}>
                    {daysExceedingLimit} days
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>Max Daily Loss Breach</span>
                  <Badge variant={daysBreachingMaxLoss > 3 ? 'destructive' : 'secondary'}>
                    {daysBreachingMaxLoss} days
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>SL Modified</span>
                  <Badge variant={slModifiedViolations > 5 ? 'destructive' : 'secondary'}>
                    {slModifiedViolations} trades
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>OTM Trades</span>
                  <Badge variant={otmTradesViolations > 10 ? 'destructive' : 'secondary'}>
                    {otmTradesViolations} trades
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emotional Influence */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
            <CardContent className="pt-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Emotional Influence on Violations
              </h3>
              <div className="space-y-4">
                {/* Early Exit Emotions */}
                {Object.keys(earlyExitEmotions).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-neutral-500 mb-2">Early Exit Emotions</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(earlyExitEmotions)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([emotion, count]) => (
                          <Badge key={emotion} variant="outline" className="capitalize">
                            {emotion} ({count})
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* SL Modification Emotions */}
                {Object.keys(slModificationEmotions).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-neutral-500 mb-2">SL Modification Emotions</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(slModificationEmotions)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([emotion, count]) => (
                          <Badge key={emotion} variant="outline" className="capitalize">
                            {emotion} ({count})
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {/* Position Sizing Violation Emotions */}
                {Object.keys(positionSizingViolationEmotions).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-neutral-500 mb-2">Position Sizing Violations</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(positionSizingViolationEmotions)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([emotion, count]) => (
                          <Badge key={emotion} variant="outline" className="capitalize">
                            {emotion} ({count})
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}

                {Object.keys(earlyExitEmotions).length === 0 && 
                 Object.keys(slModificationEmotions).length === 0 && 
                 Object.keys(positionSizingViolationEmotions).length === 0 && (
                  <div className="text-sm text-neutral-400 italic">
                    No emotional data linked to violations
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </main>
    </div>
  );
}