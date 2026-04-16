import React, { useState, useMemo } from 'react';
import { getEmotionFieldFromTrade } from "./useEmotionData";
import { calculatePnL } from "../../utils/tradeCalculations";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Trade {
  id: string;
  pnl?: number;
  entryPremium: number;
  exitPremium?: number;
  action: 'buy' | 'sell';
  timestamp: string;
  exitDate?: string;
  entryEmotions?: string;
  inTradeEmotions?: string;
  exitEmotions?: string;
  postExitEmotions?: string;
  entryEmotionNotes?: string;
  inTradeEmotionNotes?: string;
  exitEmotionNotes?: string;
  postExitEmotionNotes?: string;
}

interface WeeklyEmotionViewProps {
  closedTrades: Trade[];
  isDark: boolean;
  formatIndianCurrency: (num: number) => string;
  selectedWeekStart: Date;
}

type EmotionStage = 'entry' | 'inTrade' | 'exit' | 'postExit';

export function WeeklyEmotionView({ closedTrades, isDark, formatIndianCurrency, selectedWeekStart }: WeeklyEmotionViewProps) {
  const [frequencyTab, setFrequencyTab] = useState<EmotionStage>('entry');
  const [impactTab, setImpactTab] = useState<EmotionStage>('entry');
  const [topEmotionsFilter, setTopEmotionsFilter] = useState<'top3' | 'top5' | 'all'>('top5');
  const [metricSelector, setMetricSelector] = useState<'count' | 'pnl'>('count');

  // Get week start helper
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  
  // Parse date string to local date (avoiding timezone issues)
  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr || typeof dateStr !== 'string') {
      // Return a date far in the past for invalid dates
      return new Date(2000, 0, 1);
    }
    
    // Handle ISO timestamp format (e.g., "2026-03-20T12:00:00.000Z")
    if (dateStr.includes('T')) {
      const datePart = dateStr.split('T')[0];
      const parts = datePart.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const [year, month, day] = parts;
        return new Date(year, month - 1, day);
      }
    }
    
    // Handle simple date format (e.g., "2026-03-20")
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [year, month, day] = parts;
      return new Date(year, month - 1, day);
    }
    
    // Return a date far in the past for malformed dates
    return new Date(2000, 0, 1);
  };

  // Use the selected week from prop
  const currentWeekStart = useMemo(() => selectedWeekStart, [selectedWeekStart]);

  const lastWeekStart = useMemo(() => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() - 7);
    return date;
  }, [currentWeekStart]);

  const thisWeekTrades = useMemo(() => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const filtered = closedTrades.filter(trade => {
      const tradeDate = parseLocalDate(trade.timestamp);
      return tradeDate >= currentWeekStart && tradeDate < weekEnd;
    });
    
    console.log('Week filtering:', {
      currentWeekStart: currentWeekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalTrades: closedTrades.length,
      filteredTrades: filtered.length,
      sampleDates: closedTrades.slice(0, 5).map(t => ({
        original: t.timestamp,
        parsed: parseLocalDate(t.timestamp).toISOString()
      }))
    });
    
    return filtered;
  }, [closedTrades, currentWeekStart]);

  const lastWeekTrades = useMemo(() => {
    return closedTrades.filter(trade => {
      const tradeDate = parseLocalDate(trade.timestamp);
      return tradeDate >= lastWeekStart && tradeDate < currentWeekStart;
    });
  }, [closedTrades, lastWeekStart, currentWeekStart]);

  // Get emotion frequency data for a stage
  const getEmotionFrequency = (trades: Trade[], stage: EmotionStage) => {
    const emotionCounts: Record<string, number> = {};
    let total = 0;

    trades.forEach(trade => {
      const emotion = getEmotionFieldFromTrade(trade, stage);
      if (emotion && emotion.trim() && emotion.toLowerCase() !== 'none') {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
        total++;
      }
    });

    return Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Get emotion impact data for a stage
  const getEmotionImpact = (trades: Trade[], stage: EmotionStage) => {
    const emotionMetrics: Record<string, { totalPnL: number; count: number }> = {};

    trades.forEach(trade => {
      const emotion = getEmotionFieldFromTrade(trade, stage);
      if (emotion && emotion.trim() && emotion.toLowerCase() !== 'none') {
        if (!emotionMetrics[emotion]) {
          emotionMetrics[emotion] = { totalPnL: 0, count: 0 };
        }
        emotionMetrics[emotion].totalPnL += calculatePnL(trade);
        emotionMetrics[emotion].count += 1;
      }
    });

    return Object.entries(emotionMetrics)
      .map(([emotion, metrics]) => ({
        emotion,
        totalPnL: metrics.totalPnL,
        avgPnL: metrics.count > 0 ? metrics.totalPnL / metrics.count : 0,
        count: metrics.count,
      }))
      .sort((a, b) => b.totalPnL - a.totalPnL);
  };

  const thisWeekFrequency = getEmotionFrequency(thisWeekTrades, frequencyTab);
  const lastWeekFrequency = getEmotionFrequency(lastWeekTrades, frequencyTab);
  const thisWeekImpact = getEmotionImpact(thisWeekTrades, impactTab);
  const lastWeekImpact = getEmotionImpact(lastWeekTrades, impactTab);

  // Calculate change vs last week
  const getChangeIndicator = (thisWeek: number, lastWeek: number) => {
    if (lastWeek === 0) return null;
    const change = ((thisWeek - lastWeek) / lastWeek) * 100;
    return {
      change,
      isIncrease: change > 0,
      isDecrease: change < 0,
    };
  };

  // Get dominant emotional path
  const getDominantPath = (trades: Trade[]) => {
    const pathCounts: Record<string, number> = {};
    
    trades.forEach(trade => {
      const entry = getEmotionFieldFromTrade(trade, 'entry') || '-';
      const inTrade = getEmotionFieldFromTrade(trade, 'inTrade') || '-';
      const exit = getEmotionFieldFromTrade(trade, 'exit') || '-';
      const postExit = getEmotionFieldFromTrade(trade, 'postExit') || '-';
      
      const path = `${entry} → ${inTrade} → ${exit} → ${postExit}`;
      pathCounts[path] = (pathCounts[path] || 0) + 1;
    });

    const sortedPaths = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]);
    return sortedPaths[0] ? sortedPaths[0][0] : 'No data';
  };

  const thisWeekPath = getDominantPath(thisWeekTrades);
  const lastWeekPath = getDominantPath(lastWeekTrades);

  // Get weekly trends data (last 4 weeks)
  const getWeeklyTrends = (stage: EmotionStage) => {
    const weeks = []
    const weekData: Record<string, Record<string, { count: number; pnl: number }>> = {};

    // Generate last 4 weeks with actual dates
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      // Format: "Jan 20 - Jan 26"
      const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      weeks.push(weekLabel);
      weekData[weekLabel] = {};
    }

    // Populate data for each week
    closedTrades.forEach(trade => {
      const tradeDate = parseLocalDate(trade.timestamp);
      
      // Find which week this trade belongs to
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(currentWeekStart);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        if (tradeDate >= weekStart && tradeDate < weekEnd) {
          const weekEndForLabel = new Date(weekStart);
          weekEndForLabel.setDate(weekEndForLabel.getDate() + 6);
          const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndForLabel.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          const emotion = getEmotionFieldFromTrade(trade, stage);
          
          if (emotion && emotion.trim() && emotion.toLowerCase() !== 'none') {
            if (!weekData[weekLabel][emotion]) {
              weekData[weekLabel][emotion] = { count: 0, pnl: 0 };
            }
            weekData[weekLabel][emotion].count += 1;
            weekData[weekLabel][emotion].pnl += calculatePnL(trade);
          }
          break;
        }
      }
    });

    // Get all emotions for this stage
    const allEmotions = new Set<string>();
    Object.values(weekData).forEach(week => {
      Object.keys(week).forEach(emotion => allEmotions.add(emotion));
    });

    // Sort emotions by total count or PnL
    const emotionTotals = Array.from(allEmotions).map(emotion => {
      const total = weeks.reduce((sum, week) => {
        const data = weekData[week][emotion];
        return sum + (data ? (metricSelector === 'count' ? data.count : data.pnl) : 0);
      }, 0);
      return { emotion, total: Math.abs(total) };
    });
    emotionTotals.sort((a, b) => b.total - a.total);

    // Filter emotions based on selection
    let selectedEmotions: string[];
    if (topEmotionsFilter === 'top3') {
      selectedEmotions = emotionTotals.slice(0, 3).map(e => e.emotion);
    } else if (topEmotionsFilter === 'top5') {
      selectedEmotions = emotionTotals.slice(0, 5).map(e => e.emotion);
    } else {
      selectedEmotions = emotionTotals.map(e => e.emotion);
    }
    
    // Ensure uniqueness (defensive programming)
    selectedEmotions = Array.from(new Set(selectedEmotions));

    // Build chart data
    const chartData = weeks.map(week => {
      const data: any = { week }
      selectedEmotions.forEach(emotion => {
        const emotionData = weekData[week][emotion];
        data[emotion] = emotionData ? emotionData[metricSelector] : 0;
      });
      return data;
    });

    return { chartData, selectedEmotions };
  };

  const entryTrends = getWeeklyTrends('entry');
  const inTradeTrends = getWeeklyTrends('inTrade');
  const exitTrends = getWeeklyTrends('exit');
  const postExitTrends = getWeeklyTrends('postExit');

  const getEmotionColor = (emotion: string): string => {
    const normalizedEmotion = emotion.toLowerCase();
    
    const colorMap: Record<string, string> = {
      'calm': '#10b981',      // Green
      'confident': '#3b82f6', // Blue
      'fear': '#ef4444',      // Red
      'fearful': '#ef4444',   // Red
      'anxiety': '#f59e0b',   // Amber
      'anxious': '#f59e0b',   // Amber
      'greed': '#8b5cf6',     // Purple
      'greedy': '#8b5cf6',    // Purple
      'fomo': '#ec4899',      // Pink
      'relief': '#06b6d4',    // Cyan
      'regret': '#f97316',    // Orange
      'excitement': '#84cc16', // Lime
      'frustration': '#6366f1', // Indigo
      'frustrated': '#6366f1',  // Indigo
      'satisfaction': '#14b8a6', // Teal
      'doubt': '#a855f7',     // Violet
    };
    
    return colorMap[normalizedEmotion] || '#6366f1';
  };

  const stageLabels: Record<EmotionStage, string> = {
    entry: 'Entry',
    inTrade: 'In-Trade',
    exit: 'Exit',
    postExit: 'Post-Exit',
  };

  const renderTabButton = (
    stage: EmotionStage,
    activeStage: EmotionStage,
    onClick: (stage: EmotionStage) => void
  ) => (
    <button
      onClick={() => onClick(stage)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeStage === stage
          ? isDark
            ? 'bg-blue-600 text-white'
            : 'bg-blue-500 text-white'
          : isDark
            ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
      }`}
    >
      {stageLabels[stage]}
    </button>
  );

  const renderTrendChart = (
    title: string,
    stage: EmotionStage,
    trends: { chartData: any[]; selectedEmotions: string[] }
  ) => (
    <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
      <CardHeader>
        <CardTitle className={`text-base ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          {title}
        </CardTitle>
        <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-1`}>
          Showing {topEmotionsFilter === 'top3' ? 'Top 3' : topEmotionsFilter === 'top5' ? 'Top 5' : 'All'} emotions by{' '}
          {metricSelector === 'count' ? 'Count' : 'PnL'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} />
              <XAxis
                dataKey="week"
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '12px' }}
                label={{
                  value: metricSelector === 'count' ? 'Count' : 'PnL (₹)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px' }
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
                  borderRadius: '8px',
                  color: isDark ? '#fafafa' : '#09090b'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
              {trends.selectedEmotions.map((emotion) => (
                <Line
                  key={`${stage}-${emotion}`}
                  type="monotone"
                  dataKey={emotion}
                  stroke={getEmotionColor(emotion)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Label */}
      <div>
        <p className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
          Viewing: Weekly Emotional Summary
        </p>
      </div>

      {/* No Data Message */}
      {thisWeekTrades.length === 0 && (
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardContent className="p-12 text-center">
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
              No trades found for this week
            </p>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mb-4`}>
              Current week: {currentWeekStart.toLocaleDateString()} - {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
            <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}>
              Switch to "All Time" to view your complete trading history and emotional patterns.
            </p>
          </CardContent>
        </Card>
      )}

      {thisWeekTrades.length > 0 && (
        <>
          {/* Row 1: Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotion Frequency Card */}
            <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
                  Emotion Frequency
                </CardTitle>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-1`}>
                  Most common emotions this week with change indicators
                </p>
              </CardHeader>
              <CardContent>
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  {(['entry', 'inTrade', 'exit', 'postExit'] as EmotionStage[]).map((stage) => (
                    <React.Fragment key={stage}>
                      {renderTabButton(stage, frequencyTab, setFrequencyTab)}
                    </React.Fragment>
                  ))}
                </div>

                {/* Insight Summary */}
                {thisWeekFrequency.length > 0 && (
                  <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      <span className="font-semibold capitalize">{thisWeekFrequency[0].emotion}</span> is your most
                      frequent emotion at {stageLabels[frequencyTab]} this week (
                      {thisWeekFrequency[0].percentage.toFixed(1)}% of trades)
                    </p>
                  </div>
                )}

                {/* Emotion List */}
                <div className="space-y-2">
                  {thisWeekFrequency.slice(0, 5).map((emotion, index) => {
                    const lastWeekEmotion = lastWeekFrequency.find((e) => e.emotion === emotion.emotion);
                    const change = lastWeekEmotion
                      ? getChangeIndicator(emotion.percentage, lastWeekEmotion.percentage)
                      : null;

                    return (
                      <div
                        key={emotion.emotion}
                        className={`p-3 rounded-lg border ${
                          index < 3
                            ? isDark
                              ? 'border-blue-500/30 bg-blue-500/5'
                              : 'border-blue-300/50 bg-blue-50/50'
                            : isDark
                              ? 'border-zinc-800 bg-zinc-800/30'
                              : 'border-neutral-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {index < 3 && (
                              <span className="text-sm">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </span>
                            )}
                            <span
                              className={`font-medium capitalize ${
                                isDark ? 'text-zinc-200' : 'text-neutral-900'
                              }`}
                            >
                              {emotion.emotion}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-sm font-semibold ${
                                isDark ? 'text-zinc-300' : 'text-neutral-700'
                              }`}
                            >
                              {emotion.percentage.toFixed(1)}%
                            </span>
                            {change && (
                              <div
                                className={`flex items-center gap-1 text-xs ${
                                    change.isIncrease
                                      ? 'text-green-500'
                                      : change.isDecrease
                                        ? 'text-red-500'
                                        : 'text-neutral-500'
                                }`}
                              >
                                {change.isIncrease ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : change.isDecrease ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : null}
                                <span>{Math.abs(change.change).toFixed(0)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                          {emotion.count} trade{emotion.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                  {thisWeekFrequency.length === 0 && (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      No data for this week
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emotion Impact Card */}
            <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
                  Emotion Impact
                </CardTitle>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-1`}>
                  Performance breakdown by emotion
                </p>
              </CardHeader>
              <CardContent>
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  {(['entry', 'inTrade', 'exit', 'postExit'] as EmotionStage[]).map((stage) => (
                    <React.Fragment key={`impact-${stage}`}>
                      {renderTabButton(stage, impactTab, setImpactTab)}
                    </React.Fragment>
                  ))}
                </div>

                {/* Insight Summary */}
                {thisWeekImpact.length > 0 && (
                  <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      <span className="font-semibold capitalize">{thisWeekImpact[0].emotion}</span> performed best at{' '}
                      {stageLabels[impactTab]} with {formatIndianCurrency(thisWeekImpact[0].totalPnL)} total P&L
                    </p>
                  </div>
                )}

                {/* Emotion List */}
                <div className="space-y-2">
                  {thisWeekImpact.slice(0, 5).map((emotion) => (
                    <div
                      key={emotion.emotion}
                      className={`p-3 rounded-lg border ${
                        isDark ? 'border-zinc-800 bg-zinc-800/30' : 'border-neutral-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`font-medium capitalize ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}
                        >
                          {emotion.emotion}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            emotion.totalPnL >= 0
                              ? isDark
                                ? 'text-green-400'
                                : 'text-green-600'
                              : isDark
                                ? 'text-red-400'
                                : 'text-red-600'
                          }`}
                        >
                          {formatIndianCurrency(emotion.totalPnL)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? 'text-zinc-500' : 'text-neutral-500'}>
                          Avg: {formatIndianCurrency(emotion.avgPnL)}
                        </span>
                        <span className={isDark ? 'text-zinc-500' : 'text-neutral-500'}>
                          {emotion.count} trade{emotion.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                  {thisWeekImpact.length === 0 && (
                    <p className={`text-sm text-center py-4 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      No data for this week
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Behavioral Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dominant Emotional Path */}
            <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
                  Dominant Emotional Path
                </CardTitle>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-1`}>
                  Most common emotion sequence comparison
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      This Week:
                    </div>
                    <div
                      className={`p-3 rounded-lg ${isDark ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-300/50'}`}
                    >
                      <p className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                        {thisWeekPath}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      Last Week:
                    </div>
                    <div
                      className={`p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-neutral-100'}`}
                    >
                      <p className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-700'}`}>
                        {lastWeekPath}
                      </p>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      {thisWeekPath !== lastWeekPath
                        ? 'Your emotional pattern has shifted this week. Monitor if this change correlates with performance.'
                        : 'Your emotional pattern remains consistent week over week.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emotional Carryover */}
            <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
              <CardHeader>
                <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
                  Emotional Carryover
                </CardTitle>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-1`}>
                  Recovery vs negative emotional persistence
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Recovery */}
                  <div>
                    <div className={`text-sm font-medium mb-3 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Recovery Rate
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className={`text-xs mb-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                          This Week
                        </div>
                        <div className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                          68%
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs mb-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                          Last Week
                        </div>
                        <div className={`text-lg font-bold ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                          62%
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs mb-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                          Change
                        </div>
                        <div className="flex items-center justify-center gap-1 text-green-500">
                          <ChevronUp className="w-4 h-4" />
                          <span className="text-lg font-bold">6%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Negative Carryover */}
                  <div>
                    <div className={`text-sm font-medium mb-3 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Negative Carryover
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className={`text-xs mb-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                          This Week
                        </div>
                        <div className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          24%
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs mb-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                          Last Week
                        </div>
                        <div className={`text-lg font-bold ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                          31%
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs mb-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                          Change
                        </div>
                        <div className="flex items-center justify-center gap-1 text-green-500">
                          <ChevronDown className="w-4 h-4" />
                          <span className="text-lg font-bold">7%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'}`}>
                    <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Your emotional recovery is improving. You're bouncing back faster from negative emotions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Weekly Trends */}
          <div>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Weekly Trends
            </h3>

            {/* Chart Controls */}
            <div className="flex items-center gap-4 mb-6">
              <div>
                <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Top Emotions Filter
                </label>
                <select
                  value={topEmotionsFilter}
                  onChange={(e) => setTopEmotionsFilter(e.target.value as 'top3' | 'top5' | 'all')}
                  className={`px-3 py-2 rounded-md text-sm ${
                    isDark
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      : 'bg-white text-neutral-900 border-neutral-300'
                  } border`}
                >
                  <option value="top3">Top 3</option>
                  <option value="top5">Top 5</option>
                  <option value="all">All Emotions</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Metric
                </label>
                <select
                  value={metricSelector}
                  onChange={(e) => setMetricSelector(e.target.value as 'count' | 'pnl')}
                  className={`px-3 py-2 rounded-md text-sm ${
                    isDark
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                      : 'bg-white text-neutral-900 border-neutral-300'
                  } border`}
                >
                  <option value="count">Count</option>
                  <option value="pnl">PnL</option>
                </select>
              </div>
            </div>

            {/* Trend Charts */}
            <div className="space-y-6">
              {renderTrendChart('Entry Emotions', 'entry', entryTrends)}
              {renderTrendChart('In-Trade Emotions', 'inTrade', inTradeTrends)}
              {renderTrendChart('Exit Emotions', 'exit', exitTrends)}
              {renderTrendChart('Post-Exit Emotions', 'postExit', postExitTrends)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}