import { useTheme } from "../hooks/useTheme";
import { useTrades } from "../hooks/useTrades";
import { useSettings } from "../hooks/useSettings";
import { Card, CardContent } from "./ui/card";
import { useEmotionData, getEmotionFieldFromTrade } from "./emotion-overview/useEmotionData";
import { useState, useMemo, useEffect, useRef } from "react";
import { EmotionPhaseTable } from "./emotion-overview/EmotionPhaseTable";
import { EmotionImpactPerformance } from "./emotion-overview/EmotionImpactPerformance";
import { EmotionPathExplorer } from "./emotion-overview/EmotionPathExplorer";
import { EmotionalCarryoverAnalysis } from "./emotion-overview/EmotionalCarryoverAnalysis";
import { WeeklyEmotionView } from "./emotion-overview/WeeklyEmotionView";
import { WeekPicker } from "./emotion-overview/WeekPicker";
import { BehavioralInsightsFromNotes } from "./emotion-overview/BehavioralInsightsFromNotes";
import { EntryEmotionActivity } from "./emotion-overview/EntryEmotionActivity";
import { InTradeEmotionActivity } from "./emotion-overview/InTradeEmotionActivity";
import { ExitEmotionActivity } from "./emotion-overview/ExitEmotionActivity";
import { PostExitEmotionActivity } from "./emotion-overview/PostExitEmotionActivity";
import { Calendar, ChevronDown } from "lucide-react";
import { calculatePnL } from "../utils/tradeCalculations";

// Clean version - removed Sankey diagram component
export function EmotionOverview() {
  const { theme } = useTheme();
  const { trades } = useTrades();
  const { settings } = useSettings();
  const isDark = theme === 'dark';
  const [timeRange, setTimeRange] = useState<'allTime' | 'trend'>('allTime');
  const [showWeekPicker, setShowWeekPicker] = useState(false);

  // Trend mode controls
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [range, setRange] = useState<string>('All Time');
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [showPhaseDropdown, setShowPhaseDropdown] = useState(false);
  const phaseDropdownRef = useRef<HTMLDivElement>(null);

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

  // Get range options based on granularity
  const getRangeOptions = () => {
    switch (granularity) {
      case 'daily':
        return ['Last 7', 'Last 14', 'Last 28', 'All Time'];
      case 'weekly':
        return ['Last 2', 'Last 3', 'Last 4', 'All Weeks'];
      case 'monthly':
        return ['Last 2', 'Last 3', 'Last 6', 'All Months'];
      default:
        return ['Last 7'];
    }
  };

  // Update range when granularity changes
  useMemo(() => {
    const options = getRangeOptions();
    if (!options.includes(range)) {
      setRange(options[0]);
    }
  }, [granularity]);

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
  
  // Helper function to get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  
  // Default to a week 2 weeks ago (more likely to have data than current week)
  const getInitialWeek = () => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return getWeekStart(twoWeeksAgo);
  };
  
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => getInitialWeek());

  // Update selected week when trades load if current selection has no data
  useMemo(() => {
    if (trades.length > 0) {
      // Get the most recent trade date
      const sortedTrades = [...trades].sort((a, b) => 
        new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
      );
      
      if (sortedTrades.length > 0) {
        const mostRecentWeek = getWeekStart(new Date(sortedTrades[0].entryDate));
        // Only update if we're still at the initial week
        if (selectedWeekStart.getTime() === getInitialWeek().getTime()) {
          setSelectedWeekStart(mostRecentWeek);
        }
      }
    }
  }, [trades]);

  const handleWeekSelect = (weekStart: Date) => {
    setSelectedWeekStart(weekStart);
  };

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  // Filter only closed trades with exit data
  const closedTrades = trades.filter(t =>
    t.exitPremium !== undefined &&
    t.exitPremium !== null &&
    (t.exitTime || t.exitDate)
  );

  // Format Indian currency
  const formatIndianCurrency = (num: number): string => {
    const absNum = Math.abs(Math.round(num));
    const numStr = absNum.toString();
    const len = numStr.length;
    
    if (len <= 3) return (num < 0 ? '-' : '') + numStr;
    
    let result = numStr.slice(-3);
    let remaining = numStr.slice(0, -3);
    
    while (remaining.length > 2) {
      result = remaining.slice(-2) + ',' + result;
      remaining = remaining.slice(0, -2);
    }
    
    if (remaining.length > 0) {
      result = remaining + ',' + result;
    }
    
    return (num < 0 ? '-₹' : '₹') + result;
  };

  // Get emotion data for all types
  const entryEmotionsData = useEmotionData(closedTrades, 'entry');
  const inTradeEmotionsData = useEmotionData(closedTrades, 'inTrade');
  const exitEmotionsData = useEmotionData(closedTrades, 'exit');
  const postExitEmotionsData = useEmotionData(closedTrades, 'postExit');

  // Get most frequent emotions (no min trades filter for this)
  const mostFrequentEntry = entryEmotionsData[0] || null;
  const mostFrequentInTrade = inTradeEmotionsData[0] || null;
  const mostFrequentExit = exitEmotionsData[0] || null;
  const mostFrequentPostExit = postExitEmotionsData[0] || null;

  // Prepare data for Emotion Overview expandable cards
  const getEmotionOverviewData = () => {
    // Calculate overall emotion performance with points
    const emotionPerformance: Record<string, { 
      totalPnL: number; 
      tradeCount: number; 
      totalPoints: number;
    }> = {};

    closedTrades.forEach(trade => {
      const emotions = [
        getEmotionFieldFromTrade(trade, 'entry'),
        getEmotionFieldFromTrade(trade, 'inTrade'),
        getEmotionFieldFromTrade(trade, 'exit'),
        getEmotionFieldFromTrade(trade, 'postExit')
      ];

      // Calculate points captured (only count once per trade)
      const entryPrice = trade.entryPremium || 0;
      const exitPrice = trade.exitPremium || 0;
      let pointsCaptured = 0;
      
      if (trade.action === 'buy') {
        // Long positions: profit when premium increases
        pointsCaptured = exitPrice - entryPrice;
      } else if (trade.action === 'sell') {
        // Short positions: profit when premium decreases
        pointsCaptured = entryPrice - exitPrice;
      }

      // Get unique emotions in this trade to avoid counting same trade multiple times
      const uniqueEmotions = Array.from(new Set(emotions.filter(e => e && e.trim())));

      uniqueEmotions.forEach(emotion => {
        if (!emotionPerformance[emotion]) {
          emotionPerformance[emotion] = { totalPnL: 0, tradeCount: 0, totalPoints: 0 };
        }
        emotionPerformance[emotion].totalPnL += trade.pnl || 0;
        emotionPerformance[emotion].tradeCount += 1;
        emotionPerformance[emotion].totalPoints += pointsCaptured;
      });
    });

    // Stage-level breakdown for best and worst emotions
    const getStageBreakdown = (type: 'best' | 'worst') => {
      const stages = [
        { key: 'entry', data: entryEmotionsData, label: 'Entry' },
        { key: 'inTrade', data: inTradeEmotionsData, label: 'In-Trade' },
        { key: 'exit', data: exitEmotionsData, label: 'Exit' },
        { key: 'postExit', data: postExitEmotionsData, label: 'Post-Exit' }
      ];

      return stages.map(stage => {
        if (stage.data.length === 0) {
          return { stage: stage.label, emotion: null };
        }

        // Calculate points for each emotion at this stage
        const stageEmotionsWithPoints = stage.data.map(emotionData => ({
          ...emotionData,
          avgPoints: emotionData.avgPointsCaptured
        }));

        // Sort with tie-breaker logic
        const sorted = [...stageEmotionsWithPoints].sort((a, b) => {
          // Primary: Avg PnL
          if (type === 'best') {
            if (b.avgPnL !== a.avgPnL) return b.avgPnL - a.avgPnL;
          } else {
            if (a.avgPnL !== b.avgPnL) return a.avgPnL - b.avgPnL;
          }
          
          // Tie-breaker 1: Trade count (prefer higher)
          if (b.count !== a.count) return b.count - a.count;
          
          // Tie-breaker 2: Win rate (prefer higher)
          return b.winRate - a.winRate;
        });

        return {
          stage: stage.label,
          emotion: sorted[0] || null
        };
      });
    };

    // Get best and worst breakdowns
    const bestStageBreakdown = getStageBreakdown('best');
    const worstStageBreakdown = getStageBreakdown('worst');
    
    // Ensure Best ≠ Worst: if they're equal, pick next ranked for worst
    const ensureDifferentWorst = worstStageBreakdown.map((worstStage, idx) => {
      const bestStage = bestStageBreakdown[idx];
      
      if (!worstStage.emotion || !bestStage.emotion) return worstStage;
      
      // Check if best and worst are the same emotion
      if (worstStage.emotion.emotion === bestStage.emotion.emotion) {
        // Get the corresponding stage data
        const stageData = [entryEmotionsData, inTradeEmotionsData, exitEmotionsData, postExitEmotionsData][idx];
        
        if (stageData.length > 1) {
          // Sort to find the next worst
          const sorted = [...stageData].sort((a, b) => {
            if (a.avgPnL !== b.avgPnL) return a.avgPnL - b.avgPnL;
            if (b.count !== a.count) return b.count - a.count;
            return b.winRate - a.winRate;
          });
          
          // Pick the second one (skip the first which equals best)
          return {
            stage: worstStage.stage,
            emotion: sorted[1] || null
          };
        }
      }
      
      return worstStage;
    });

    return {
      bestStageBreakdown,
      worstStageBreakdown: ensureDifferentWorst,
      mostFrequentByStage: [
        { stage: 'Entry', emotion: mostFrequentEntry },
        { stage: 'In-Trade', emotion: mostFrequentInTrade },
        { stage: 'Exit', emotion: mostFrequentExit },
        { stage: 'Post-Exit', emotion: mostFrequentPostExit }
      ]
    };
  };

  const {
    bestStageBreakdown,
    worstStageBreakdown,
    mostFrequentByStage
  } = getEmotionOverviewData();

  // Prepare data for Emotion Distribution charts
  const getEmotionDistributionData = () => {
    // Get all unique emotions across all stages
    const allUniqueEmotions = new Set<string>();
    
    closedTrades.forEach(trade => {
      const entryEmotion = getEmotionFieldFromTrade(trade, 'entry');
      const inTradeEmotion = getEmotionFieldFromTrade(trade, 'inTrade');
      const exitEmotion = getEmotionFieldFromTrade(trade, 'exit');
      const postExitEmotion = getEmotionFieldFromTrade(trade, 'postExit');
      
      if (entryEmotion && entryEmotion.trim()) allUniqueEmotions.add(entryEmotion);
      if (inTradeEmotion && inTradeEmotion.trim()) allUniqueEmotions.add(inTradeEmotion);
      if (exitEmotion && exitEmotion.trim()) allUniqueEmotions.add(exitEmotion);
      if (postExitEmotion && postExitEmotion.trim()) allUniqueEmotions.add(postExitEmotion);
    });

    const emotions = Array.from(allUniqueEmotions).sort();

    // Count emotions per stage
    const distributionData = [
      { stage: 'Entry', ...Object.fromEntries(emotions.map(e => [e, 0])) },
      { stage: 'In-Trade', ...Object.fromEntries(emotions.map(e => [e, 0])) },
      { stage: 'Exit', ...Object.fromEntries(emotions.map(e => [e, 0])) },
      { stage: 'Post-Exit', ...Object.fromEntries(emotions.map(e => [e, 0])) }
    ];

    closedTrades.forEach(trade => {
      const entryEmotion = getEmotionFieldFromTrade(trade, 'entry');
      const inTradeEmotion = getEmotionFieldFromTrade(trade, 'inTrade');
      const exitEmotion = getEmotionFieldFromTrade(trade, 'exit');
      const postExitEmotion = getEmotionFieldFromTrade(trade, 'postExit');

      if (entryEmotion && entryEmotion.trim()) {
        distributionData[0][entryEmotion] = (distributionData[0][entryEmotion] || 0) + 1;
      }
      if (inTradeEmotion && inTradeEmotion.trim()) {
        distributionData[1][inTradeEmotion] = (distributionData[1][inTradeEmotion] || 0) + 1;
      }
      if (exitEmotion && exitEmotion.trim()) {
        distributionData[2][exitEmotion] = (distributionData[2][exitEmotion] || 0) + 1;
      }
      if (postExitEmotion && postExitEmotion.trim()) {
        distributionData[3][postExitEmotion] = (distributionData[3][postExitEmotion] || 0) + 1;
      }
    });

    // Filter out emotions that have zero count across all stages
    const emotionsWithData = emotions.filter(emotion => {
      const totalCount = distributionData.reduce((sum, stage) => sum + (stage[emotion] || 0), 0);
      return totalCount > 0;
    });

    // Convert to percentage data for 100% stacked bar chart
    const percentageData = distributionData.map(stageData => {
      const total = emotionsWithData.reduce((sum, emotion) => sum + (stageData[emotion] || 0), 0);
      const percentages: any = { stage: stageData.stage };
      
      emotionsWithData.forEach(emotion => {
        percentages[emotion] = total > 0 ? ((stageData[emotion] || 0) / total) * 100 : 0;
      });
      
      return percentages;
    });

    return { emotions: emotionsWithData, distributionData, percentageData };
  };

  // Prepare heatmap data
  const getHeatmapData = () => {
    const { emotions, distributionData } = getEmotionDistributionData();
    
    const heatmapData = emotions.map(emotion => {
      const entryCount = distributionData[0][emotion] || 0;
      const inTradeCount = distributionData[1][emotion] || 0;
      const exitCount = distributionData[2][emotion] || 0;
      const postExitCount = distributionData[3][emotion] || 0;
      const total = entryCount + inTradeCount + exitCount + postExitCount;

      return {
        emotion,
        Entry: entryCount,
        'In-Trade': inTradeCount,
        Exit: exitCount,
        'Post-Exit': postExitCount,
        Total: total,
        // Calculate row percentages
        EntryPct: total > 0 ? (entryCount / total) * 100 : 0,
        InTradePct: total > 0 ? (inTradeCount / total) * 100 : 0,
        ExitPct: total > 0 ? (exitCount / total) * 100 : 0,
        PostExitPct: total > 0 ? (postExitCount / total) * 100 : 0,
      };
    });

    // Sort by total occurrences descending
    heatmapData.sort((a, b) => b.Total - a.Total);

    // Calculate max count for color scaling
    const maxCount = Math.max(
      ...heatmapData.flatMap(row => [row.Entry, row['In-Trade'], row.Exit, row['Post-Exit']])
    );

    return { heatmapData, maxCount };
  };

  const { emotions, distributionData, percentageData } = getEmotionDistributionData();
  const { heatmapData, maxCount } = getHeatmapData();

  // Emotion color mapping (consistent colors)
  const EMOTION_COLORS: Record<string, string> = {
    'Calm': '#10b981',
    'Confident': '#3b82f6',
    'Fear': '#ef4444',
    'Anxiety': '#f59e0b',
    'Greed': '#8b5cf6',
    'FOMO': '#ec4899',
    'Relief': '#06b6d4',
    'Regret': '#f97316',
    'Excitement': '#84cc16',
    'Frustration': '#6366f1',
    'Satisfaction': '#14b8a6',
    'Doubt': '#a855f7'
  };

  // Check if there's any emotion data at all
  const hasAnyEmotionData = closedTrades.some(trade => 
    getEmotionFieldFromTrade(trade, 'entry') ||
    getEmotionFieldFromTrade(trade, 'inTrade') ||
    getEmotionFieldFromTrade(trade, 'exit') ||
    getEmotionFieldFromTrade(trade, 'postExit')
  );

  // Get color for emotion with fallback
  const getEmotionColor = (emotion: string, index: number) => {
    return EMOTION_COLORS[emotion] || ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6'][index % 10];
  };

  // Get heatmap cell color based on intensity
  const getHeatmapColor = (value: number) => {
    if (value === 0) return isDark ? '#18181b' : '#fafafa';
    const intensity = value / maxCount;
    const baseColor = isDark ? [59, 130, 246] : [37, 99, 235]; // blue-500 / blue-600
    return `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${0.2 + intensity * 0.8})`;
  };

  // Get text color based on background intensity for better readability
  const getHeatmapTextColor = (value: number) => {
    if (value === 0) return isDark ? '#71717a' : '#a1a1aa'; // muted text for zero values
    const intensity = value / maxCount;
    // Use white text for high intensity cells, dark text for low intensity cells
    if (isDark) {
      return intensity > 0.5 ? '#ffffff' : '#e4e4e7';
    } else {
      return intensity > 0.5 ? '#ffffff' : '#09090b';
    }
  };

  // Prepare data for Emotion Behaviour During Trades
  const getEmotionBehaviourData = () => {
    // 1. Emotion Transition Flow Data
    type FlowKey = string;
    const flowMap: Record<FlowKey, number> = {};
    
    closedTrades.forEach(trade => {
      const entry = getEmotionFieldFromTrade(trade, 'entry') || 'Unknown';
      const inTrade = getEmotionFieldFromTrade(trade, 'inTrade') || 'Unknown';
      const exit = getEmotionFieldFromTrade(trade, 'exit') || 'Unknown';
      const postExit = getEmotionFieldFromTrade(trade, 'postExit') || 'Unknown';
      
      const flowKey = `${entry}→${inTrade}→${exit}→${postExit}`;
      flowMap[flowKey] = (flowMap[flowKey] || 0) + 1;
    });

    const emotionFlows = Object.entries(flowMap)
      .map(([flow, count]) => {
        const [entry, inTrade, exit, postExit] = flow.split('→');
        return { entry, inTrade, exit, postExit, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 flows

    // 2. Early Exit Rate by Emotion
    const emotionExitMetrics: Record<string, { total: number; earlyExit: number }> = {};
    
    closedTrades.forEach(trade => {
      const emotions = [
        getEmotionFieldFromTrade(trade, 'entry'),
        getEmotionFieldFromTrade(trade, 'inTrade'),
        getEmotionFieldFromTrade(trade, 'exit'),
        getEmotionFieldFromTrade(trade, 'postExit')
      ];

      const isEarlyExit = trade.exitReason?.toLowerCase().includes('early') || 
                          trade.exitReason?.toLowerCase().includes('stop') ||
                          trade.exitReason?.toLowerCase().includes('panic');

      emotions.forEach(emotion => {
        if (emotion && emotion.trim()) {
          if (!emotionExitMetrics[emotion]) {
            emotionExitMetrics[emotion] = { total: 0, earlyExit: 0 };
          }
          emotionExitMetrics[emotion].total += 1;
          if (isEarlyExit) {
            emotionExitMetrics[emotion].earlyExit += 1;
          }
        }
      });
    });

    const earlyExitData = Object.entries(emotionExitMetrics)
      .map(([emotion, metrics]) => ({
        emotion,
        earlyExitRate: (metrics.earlyExit / metrics.total) * 100,
        trades: metrics.total
      }))
      .sort((a, b) => b.earlyExitRate - a.earlyExitRate);

    // 3. Average Trade Duration by Emotion
    const emotionDurationMetrics: Record<string, { totalMinutes: number; count: number }> = {};
    
    closedTrades.forEach(trade => {
      // Calculate duration in minutes
      let durationMinutes = 0;
      
      if (trade.entryDate && trade.exitDate && trade.entryTime && trade.exitTime) {
        const entryDateTime = new Date(`${trade.entryDate}T${trade.entryTime}`);
        const exitDateTime = new Date(`${trade.exitDate}T${trade.exitTime}`);
        durationMinutes = (exitDateTime.getTime() - entryDateTime.getTime()) / (1000 * 60);
      }

      const emotions = [
        getEmotionFieldFromTrade(trade, 'entry'),
        getEmotionFieldFromTrade(trade, 'inTrade'),
        getEmotionFieldFromTrade(trade, 'exit'),
        getEmotionFieldFromTrade(trade, 'postExit')
      ];

      emotions.forEach(emotion => {
        if (emotion && emotion.trim() && durationMinutes > 0) {
          if (!emotionDurationMetrics[emotion]) {
            emotionDurationMetrics[emotion] = { totalMinutes: 0, count: 0 };
          }
          emotionDurationMetrics[emotion].totalMinutes += durationMinutes;
          emotionDurationMetrics[emotion].count += 1;
        }
      });
    });

    const avgDurationData = Object.entries(emotionDurationMetrics)
      .map(([emotion, metrics]) => ({
        emotion,
        avgDuration: metrics.totalMinutes / metrics.count,
        trades: metrics.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);

    // 4. Emotional Discipline Score
    const disciplinedEmotions = ['Calm', 'Neutral', 'Focused', 'Patient', 'Confident'];
    const emotionDrivenStates = ['Fear', 'Greed', 'Revenge', 'FOMO', 'Anxiety', 'Panic'];

    let disciplinedCount = 0;
    let emotionDrivenCount = 0;

    closedTrades.forEach(trade => {
      const emotions = [
        getEmotionFieldFromTrade(trade, 'entry'),
        getEmotionFieldFromTrade(trade, 'inTrade'),
        getEmotionFieldFromTrade(trade, 'exit'),
        getEmotionFieldFromTrade(trade, 'postExit')
      ];

      // Check if any emotion is disciplined
      const hasDisciplined = emotions.some(e => e && disciplinedEmotions.includes(e));
      const hasEmotionDriven = emotions.some(e => e && emotionDrivenStates.includes(e));

      if (hasDisciplined && !hasEmotionDriven) {
        disciplinedCount += 1;
      } else if (hasEmotionDriven) {
        emotionDrivenCount += 1;
      }
    });

    const totalCategorized = disciplinedCount + emotionDrivenCount;
    const disciplineScore = totalCategorized > 0 
      ? (disciplinedCount / totalCategorized) * 100 
      : 0;

    const disciplineData = [
      { name: 'Disciplined', value: disciplinedCount, percentage: disciplineScore },
      { name: 'Emotion-Driven', value: emotionDrivenCount, percentage: 100 - disciplineScore }
    ];

    return { 
      emotionFlows, 
      earlyExitData, 
      avgDurationData, 
      disciplineData,
      disciplineScore 
    };
  };

  const { 
    emotionFlows, 
    earlyExitData, 
    avgDurationData, 
    disciplineData,
    disciplineScore 
  } = getEmotionBehaviourData();

  // Format duration in minutes to readable format
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Prepare phase table data
  const getPhaseTableData = (phaseData: any[], phaseName: 'entry' | 'inTrade' | 'exit' | 'postExit') => {
    const totalTradesInPhase = closedTrades.filter(t => getEmotionFieldFromTrade(t, phaseName)).length;
    
    return phaseData.map(emotionData => {
      // Get all trades for this emotion at this phase
      const tradesWithEmotion = closedTrades.filter(t => {
        const emotion = getEmotionFieldFromTrade(t, phaseName);
        return emotion && emotion.toLowerCase() === emotionData.emotion.toLowerCase();
      });
      
      // Calculate PnL for wins and losses
      const winTrades = tradesWithEmotion.filter(t => {
        const pnl = calculatePnL(t);
        return pnl && pnl > 0;
      });
      
      const lossTrades = tradesWithEmotion.filter(t => {
        const pnl = calculatePnL(t);
        return pnl && pnl < 0;
      });
      
      const avgWin = winTrades.length > 0 
        ? winTrades.reduce((sum, t) => sum + (calculatePnL(t) || 0), 0) / winTrades.length 
        : 0;
      
      const avgLoss = lossTrades.length > 0 
        ? lossTrades.reduce((sum, t) => sum + (calculatePnL(t) || 0), 0) / lossTrades.length 
        : 0;
      
      // Calculate points (price difference, not multiplied by quantity)
      const getPoints = (trade: any) => {
        const entryPrice = trade.entryPremium || 0;
        const exitPrice = trade.exitPremium || 0;
        
        if (trade.action === 'buy') {
          // Long positions: profit when premium increases
          return exitPrice - entryPrice;
        } else if (trade.action === 'sell') {
          // Short positions: profit when premium decreases
          return entryPrice - exitPrice;
        }
        return 0;
      };
      
      // Calculate average points for winning trades
      const avgPointsWin = winTrades.length > 0
        ? winTrades.reduce((sum, t) => sum + getPoints(t), 0) / winTrades.length
        : 0;
      
      // Calculate average points for losing trades
      const avgPointsLoss = lossTrades.length > 0
        ? lossTrades.reduce((sum, t) => sum + getPoints(t), 0) / lossTrades.length
        : 0;
      
      return {
        emotion: emotionData.emotion,
        trades: emotionData.count,
        percentage: totalTradesInPhase > 0 ? (emotionData.count / totalTradesInPhase) * 100 : 0,
        winRate: emotionData.winRate,
        avgPoints: emotionData.avgPointsCaptured,
        avgPointsWin,
        avgPointsLoss,
        avgWin,
        avgLoss,
        avgPnL: emotionData.avgPnL
      };
    });
  };

  // Generate insight line for each phase
  const getPhaseInsight = (phaseData: any[]) => {
    if (phaseData.length === 0) return "No data available";
    
    const mostFrequent = phaseData[0];
    const best = [...phaseData].sort((a, b) => b.avgPnL - a.avgPnL)[0];
    const worst = [...phaseData].sort((a, b) => a.avgPnL - b.avgPnL)[0];
    
    let insight = `${mostFrequent.emotion} dominates`;
    
    if (best && best.emotion !== mostFrequent.emotion) {
      insight += `; ${best.emotion} performs best`;
    } else if (best) {
      insight += ` and performs best`;
    }
    
    if (worst && worst.emotion !== best.emotion && worst.emotion !== mostFrequent.emotion) {
      insight += `; ${worst.emotion} underperforms`;
    } else if (worst && worst.emotion !== best.emotion) {
      insight += `; ${worst.emotion} underperforms`;
    }
    
    return insight;
  };

  const entryTableData = getPhaseTableData(entryEmotionsData, 'entry');
  const inTradeTableData = getPhaseTableData(inTradeEmotionsData, 'inTrade');
  const exitTableData = getPhaseTableData(exitEmotionsData, 'exit');
  const postExitTableData = getPhaseTableData(postExitEmotionsData, 'postExit');

  const entryInsight = getPhaseInsight(entryEmotionsData);
  const inTradeInsight = getPhaseInsight(inTradeEmotionsData);
  const exitInsight = getPhaseInsight(exitEmotionsData);
  const postExitInsight = getPhaseInsight(postExitEmotionsData);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with Time Filter */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Emotion Overview
            </h1>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
              Quick summary of your emotional behavior and its impact on performance
            </p>
          </div>

          {/* Controls Container */}
          <div className="flex items-end gap-3 flex-wrap justify-end">
            {/* Phase Filter (visible in Trend mode) */}
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
                      {settings.tradingPhases && settings.tradingPhases.length > 0 ? (
                        <>
                          {/* Select All / Clear buttons */}
                          <div className="flex gap-2 mb-2 pb-2 border-b border-zinc-700">
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
                                className="w-4 h-4 rounded border-zinc-600"
                              />
                              <span className={`text-sm ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                                {phase.id}
                              </span>
                            </label>
                          ))}
                        </>
                      ) : (
                        <div className="px-2 py-4 text-center">
                          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                            No trading phases configured
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                            Go to Settings → Trading Phases to add phases
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Granularity Selector (visible in Trend mode) */}
            {timeRange === 'trend' && (
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Granularity
                </label>
                <div className="flex rounded-md overflow-hidden border border-zinc-700">
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

            {/* Range Selector (visible in Trend mode) */}
            {timeRange === 'trend' && (
              <div>
                <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
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

            {/* Time Range Mode Selector (always visible) */}
            <div>
              <label className={`text-xs font-medium mb-1.5 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
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

        {/* Conditional Rendering based on timeRange */}
        {timeRange === 'trend' ? (
          /* Trend View */
          <div className="space-y-6">
            <EntryEmotionActivity
              trades={closedTrades}
              granularity={granularity}
              range={range}
              selectedPhases={selectedPhases}
              isDark={isDark}
              emotionalStates={settings.emotionalStates}
            />
            <InTradeEmotionActivity
              trades={closedTrades}
              granularity={granularity}
              range={range}
              selectedPhases={selectedPhases}
              isDark={isDark}
              emotionalStates={settings.emotionalStates}
            />
            <ExitEmotionActivity
              trades={closedTrades}
              granularity={granularity}
              range={range}
              selectedPhases={selectedPhases}
              isDark={isDark}
              emotionalStates={settings.emotionalStates}
            />
            <PostExitEmotionActivity
              trades={closedTrades}
              granularity={granularity}
              range={range}
              selectedPhases={selectedPhases}
              isDark={isDark}
              emotionalStates={settings.emotionalStates}
            />
          </div>
        ) : (
          /* All Time View - New Phase-based Structure */
          <>
            {/* Show empty state if no emotion data */}
            {!hasAnyEmotionData && (
              <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <p className={`text-base font-medium ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      No Emotion Data Found
                    </p>
                    <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'} max-w-md`}>
                      You have {closedTrades.length} closed trade{closedTrades.length !== 1 ? 's' : ''}, but none have emotion data. 
                      Start adding emotions to your trades to unlock powerful behavioral insights.
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-neutral-400'} mt-2`}>
                      💡 Tip: Edit existing trades or add emotions when creating new trades
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Phase-based Emotion Tables */}
            {closedTrades.length > 0 && hasAnyEmotionData && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="mb-6">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'} mb-2`}>
                    Emotion Impact on Performance
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    How emotional states affect trade outcomes
                  </p>
                </div>

                <EmotionPhaseTable
                  phase="Entry"
                  insight={entryInsight}
                  data={entryTableData}
                  isDark={isDark}
                  formatIndianCurrency={formatIndianCurrency}
                />

                <EmotionPhaseTable
                  phase="In-Trade"
                  insight={inTradeInsight}
                  data={inTradeTableData}
                  isDark={isDark}
                  formatIndianCurrency={formatIndianCurrency}
                />

                <EmotionPhaseTable
                  phase="Exit"
                  insight={exitInsight}
                  data={exitTableData}
                  isDark={isDark}
                  formatIndianCurrency={formatIndianCurrency}
                />

                <EmotionPhaseTable
                  phase="Post-Exit"
                  insight={postExitInsight}
                  data={postExitTableData}
                  isDark={isDark}
                  formatIndianCurrency={formatIndianCurrency}
                />
              </div>
            )}

            {/* Emotion Path Explorer Section */}
            {closedTrades.length > 0 && hasAnyEmotionData && (
              <EmotionPathExplorer
                closedTrades={closedTrades}
                isDark={isDark}
              />
            )}

            {/* Emotional Carryover Analysis Section */}
            {closedTrades.length > 0 && hasAnyEmotionData && (
              <EmotionalCarryoverAnalysis
                closedTrades={closedTrades}
                isDark={isDark}
              />
            )}

            {/* Behavioral Insights from Notes Section */}
            {closedTrades.length > 0 && hasAnyEmotionData && (
              <BehavioralInsightsFromNotes
                closedTrades={closedTrades}
                isDark={isDark}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}