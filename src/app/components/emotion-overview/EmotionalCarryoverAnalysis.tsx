import { useState, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import { getEmotionFieldFromTrade } from './useEmotionData';

interface Trade {
  id: string;
  pnl?: number;
  entryPremium: number;
  exitPremium?: number;
  action: 'buy' | 'sell';
  entryDate: string;
  exitDate?: string;
  entryEmotions?: string;
  inTradeEmotions?: string;
  exitEmotions?: string;
  postExitEmotions?: string;
}

interface EmotionalCarryoverAnalysisProps {
  closedTrades: Trade[];
  isDark: boolean;
}

type CarryoverStage = 'exitN' | 'postExitN' | 'entryN1' | 'inTradeN1';

interface EmotionNode {
  emotion: string;
  count: number;
  percentage: number;
  avgPnL: number;
  totalPnL: number;
}

interface SelectedEmotion {
  stage: CarryoverStage;
  emotion: string;
}

interface TransitionPair {
  tradeN: Trade;
  tradeN1: Trade;
}

export function EmotionalCarryoverAnalysis({ closedTrades, isDark }: EmotionalCarryoverAnalysisProps) {
  const [selectedEmotion, setSelectedEmotion] = useState<SelectedEmotion | null>(null);

  // Build within-day transition pairs
  const transitionPairs = useMemo((): TransitionPair[] => {
    const pairs: TransitionPair[] = [];
    
    // Group trades by date
    const tradesByDate: Record<string, Trade[]> = {};
    closedTrades.forEach(trade => {
      const date = trade.entryDate;
      if (!tradesByDate[date]) {
        tradesByDate[date] = [];
      }
      tradesByDate[date].push(trade);
    });

    // For each day, create pairs of consecutive trades
    Object.values(tradesByDate).forEach(dayTrades => {
      // Sort by entry time if available, otherwise by trade order
      const sortedTrades = [...dayTrades].sort((a, b) => {
        // Assuming trades have an implicit order in the array
        return closedTrades.indexOf(a) - closedTrades.indexOf(b);
      });

      // Create pairs (exclude last trade of the day)
      for (let i = 0; i < sortedTrades.length - 1; i++) {
        pairs.push({
          tradeN: sortedTrades[i],
          tradeN1: sortedTrades[i + 1]
        });
      }
    });

    return pairs;
  }, [closedTrades]);

  // Get emotion data for a specific stage
  const getEmotionData = (stage: CarryoverStage, conditionalPairs: TransitionPair[] | null = null): EmotionNode[] => {
    const pairsToAnalyze = conditionalPairs || transitionPairs;
    const emotionMap: Record<string, { count: number; totalPnL: number }> = {};

    pairsToAnalyze.forEach(pair => {
      let emotion: string | null = null;

      switch (stage) {
        case 'exitN':
          emotion = getEmotionFieldFromTrade(pair.tradeN, 'exit');
          break;
        case 'postExitN':
          emotion = getEmotionFieldFromTrade(pair.tradeN, 'postExit');
          break;
        case 'entryN1':
          emotion = getEmotionFieldFromTrade(pair.tradeN1, 'entry');
          break;
        case 'inTradeN1':
          emotion = getEmotionFieldFromTrade(pair.tradeN1, 'inTrade');
          break;
      }

      if (!emotion || emotion.trim() === '' || emotion.toLowerCase() === 'none') return;

      if (!emotionMap[emotion]) {
        emotionMap[emotion] = { count: 0, totalPnL: 0 };
      }
      emotionMap[emotion].count += 1;
      // Use the next trade's P&L for future stages
      const pnl = (stage === 'entryN1' || stage === 'inTradeN1') ? (pair.tradeN1.pnl || 0) : (pair.tradeN.pnl || 0);
      emotionMap[emotion].totalPnL += pnl;
    });

    const total = Object.values(emotionMap).reduce((sum, e) => sum + e.count, 0);
    
    return Object.entries(emotionMap)
      .map(([emotion, data]) => ({
        emotion,
        count: data.count,
        percentage: total > 0 ? (data.count / total) * 100 : 0,
        avgPnL: data.count > 0 ? data.totalPnL / data.count : 0,
        totalPnL: data.totalPnL,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Get conditional pairs based on selected emotion
  const getConditionalPairs = (
    targetStage: CarryoverStage,
    selectedStage: CarryoverStage,
    selectedEmotionValue: string
  ): TransitionPair[] => {
    if (!selectedEmotionValue) return transitionPairs;

    return transitionPairs.filter(pair => {
      let targetEmotion: string | null = null;
      let selectedEmotionInPair: string | null = null;

      // Get target emotion
      switch (targetStage) {
        case 'exitN':
          targetEmotion = getEmotionFieldFromTrade(pair.tradeN, 'exit');
          break;
        case 'postExitN':
          targetEmotion = getEmotionFieldFromTrade(pair.tradeN, 'postExit');
          break;
        case 'entryN1':
          targetEmotion = getEmotionFieldFromTrade(pair.tradeN1, 'entry');
          break;
        case 'inTradeN1':
          targetEmotion = getEmotionFieldFromTrade(pair.tradeN1, 'inTrade');
          break;
      }

      // Get selected emotion from pair
      switch (selectedStage) {
        case 'exitN':
          selectedEmotionInPair = getEmotionFieldFromTrade(pair.tradeN, 'exit');
          break;
        case 'postExitN':
          selectedEmotionInPair = getEmotionFieldFromTrade(pair.tradeN, 'postExit');
          break;
        case 'entryN1':
          selectedEmotionInPair = getEmotionFieldFromTrade(pair.tradeN1, 'entry');
          break;
        case 'inTradeN1':
          selectedEmotionInPair = getEmotionFieldFromTrade(pair.tradeN1, 'inTrade');
          break;
      }

      return selectedEmotionInPair === selectedEmotionValue;
    });
  };

  const exitNData = useMemo(() => {
    const conditionalPairs = selectedEmotion ? getConditionalPairs('exitN', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('exitN', conditionalPairs);
  }, [transitionPairs, selectedEmotion]);

  const postExitNData = useMemo(() => {
    const conditionalPairs = selectedEmotion ? getConditionalPairs('postExitN', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('postExitN', conditionalPairs);
  }, [transitionPairs, selectedEmotion]);

  const entryN1Data = useMemo(() => {
    const conditionalPairs = selectedEmotion ? getConditionalPairs('entryN1', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('entryN1', conditionalPairs);
  }, [transitionPairs, selectedEmotion]);

  const inTradeN1Data = useMemo(() => {
    const conditionalPairs = selectedEmotion ? getConditionalPairs('inTradeN1', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('inTradeN1', conditionalPairs);
  }, [transitionPairs, selectedEmotion]);

  const handleEmotionClick = (stage: CarryoverStage, emotion: string) => {
    if (selectedEmotion?.stage === stage && selectedEmotion?.emotion === emotion) {
      setSelectedEmotion(null);
    } else {
      setSelectedEmotion({ stage, emotion });
    }
  };

  const isEmotionSelected = (stage: CarryoverStage, emotion: string) => {
    return selectedEmotion?.stage === stage && selectedEmotion?.emotion === emotion;
  };

  const isEmotionRelevant = (stage: CarryoverStage, emotion: string) => {
    if (!selectedEmotion) return true;
    
    if (isEmotionSelected(stage, emotion)) return true;

    const conditionalPairs = getConditionalPairs(stage, selectedEmotion.stage, selectedEmotion.emotion);
    return conditionalPairs.some(pair => {
      let tradeEmotion: string | null = null;
      switch (stage) {
        case 'exitN':
          tradeEmotion = getEmotionFieldFromTrade(pair.tradeN, 'exit');
          break;
        case 'postExitN':
          tradeEmotion = getEmotionFieldFromTrade(pair.tradeN, 'postExit');
          break;
        case 'entryN1':
          tradeEmotion = getEmotionFieldFromTrade(pair.tradeN1, 'entry');
          break;
        case 'inTradeN1':
          tradeEmotion = getEmotionFieldFromTrade(pair.tradeN1, 'inTrade');
          break;
      }
      return tradeEmotion === emotion;
    });
  };

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

  const getEmotionColor = (emotion: string): string => {
    const colorMap: Record<string, string> = {
      'calm': '#10b981',
      'confident': '#3b82f6',
      'fearful': '#ef4444',
      'anxious': '#f59e0b',
      'greedy': '#8b5cf6',
    };
    return colorMap[emotion.toLowerCase()] || '#6366f1';
  };

  const getStageSubtitle = (stage: CarryoverStage): string => {
    if (!selectedEmotion) return 'Overall Distribution';
    
    const stages: CarryoverStage[] = ['exitN', 'postExitN', 'entryN1', 'inTradeN1'];
    const selectedIndex = stages.indexOf(selectedEmotion.stage);
    const currentIndex = stages.indexOf(stage);

    if (currentIndex === selectedIndex) {
      return 'Current selected state';
    } else if (currentIndex < selectedIndex) {
      return 'Previous trade outcomes';
    } else if (currentIndex === selectedIndex + 1) {
      return 'Next stage in sequence';
    } else {
      return 'Subsequent outcomes';
    }
  };

  const getRankingEmoji = (index: number): string => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  const getDominantPath = () => {
    const topExitN = exitNData[0]?.emotion || '-';
    const topPostExitN = postExitNData[0]?.emotion || '-';
    const topEntryN1 = entryN1Data[0]?.emotion || '-';
    const topInTradeN1 = inTradeN1Data[0]?.emotion || '-';
    return { topExitN, topPostExitN, topEntryN1, topInTradeN1 };
  };

  const dominantPath = getDominantPath();

  const getInsightSummary = () => {
    if (!selectedEmotion) return null;

    const stages: CarryoverStage[] = ['exitN', 'postExitN', 'entryN1', 'inTradeN1'];
    const selectedIndex = stages.indexOf(selectedEmotion.stage);

    let mostCommonNextEntry = '-';
    let mostCommonNextEntryPercent = 0;
    let mostCommonNextBehavior = '-';
    let mostCommonNextBehaviorPercent = 0;

    // Get most common next trade entry (always entryN1)
    if (selectedIndex < 2 && entryN1Data.length > 0) {
      mostCommonNextEntry = entryN1Data[0].emotion;
      mostCommonNextEntryPercent = entryN1Data[0].percentage;
    }

    // Get most common next trade behavior (always inTradeN1)
    if (selectedIndex < 3 && inTradeN1Data.length > 0) {
      mostCommonNextBehavior = inTradeN1Data[0].emotion;
      mostCommonNextBehaviorPercent = inTradeN1Data[0].percentage;
    }

    const stageLabels: Record<CarryoverStage, string> = {
      'exitN': 'Exit (Trade N)',
      'postExitN': 'Post-Exit (Trade N)',
      'entryN1': 'Entry (Next Trade)',
      'inTradeN1': 'In-Trade (Next Trade)'
    };

    const stageName = stageLabels[selectedEmotion.stage];

    return {
      stageName,
      mostCommonNextEntry,
      mostCommonNextEntryPercent,
      mostCommonNextBehavior,
      mostCommonNextBehaviorPercent,
      selectedIndex,
    };
  };

  const insightSummary = getInsightSummary();

  const renderColumn = (
    title: string,
    stage: CarryoverStage,
    data: EmotionNode[]
  ) => {
    const isSelectedColumn = selectedEmotion?.stage === stage;
    
    return (
      <div className={`flex-1 min-w-0 relative transition-all duration-300 ${
        isSelectedColumn ? 'scale-[1.02]' : ''
      }`}>
        {/* Subtle column highlight for selected stage */}
        {isSelectedColumn && (
          <div className={`absolute -inset-2 rounded-xl ${
            isDark ? 'bg-blue-500/5' : 'bg-blue-500/5'
          } -z-10`} />
        )}
        
        <div className="mb-4">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
            {title}
          </h3>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-0.5`}>
            {getStageSubtitle(stage)}
          </p>
        </div>

        <div className="space-y-2">
          {data.length === 0 ? (
            <div className={`text-xs ${isDark ? 'text-zinc-600' : 'text-neutral-400'} text-center py-4`}>
              No data
            </div>
          ) : (
            data.map((node, index) => {
              const isSelected = isEmotionSelected(stage, node.emotion);
              const isRelevant = isEmotionRelevant(stage, node.emotion);
              const isDominant = index === 0;
              const rankingEmoji = getRankingEmoji(index);
              
              return (
                <button
                  key={`${stage}-${node.emotion}`}
                  onClick={() => handleEmotionClick(stage, node.emotion)}
                  className={`
                    w-full text-left p-3 rounded-lg border transition-all duration-300 relative
                    ${isSelected
                      ? `${isDark ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-400'} shadow-lg ring-2 ${isDark ? 'ring-blue-500/30' : 'ring-blue-400/30'}`
                      : isRelevant
                        ? `${isDark ? 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:shadow-md' : 'bg-white border-neutral-200 hover:bg-neutral-50 hover:shadow-md'}`
                        : `${isDark ? 'bg-zinc-900/30 border-zinc-800/50' : 'bg-neutral-100/50 border-neutral-200/50'} opacity-40`
                    }
                    ${isDominant && isRelevant ? 'shadow-md' : ''}
                  `}
                  style={{
                    boxShadow: isDominant && isRelevant 
                      ? isDark 
                        ? `0 0 20px -5px ${getEmotionColor(node.emotion)}40`
                        : `0 0 15px -5px ${getEmotionColor(node.emotion)}30`
                      : undefined
                  }}
                >
                  {/* Ranking badge */}
                  {rankingEmoji && isRelevant && (
                    <div className="absolute -top-2 -right-2 text-lg">
                      {rankingEmoji}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className={`text-sm capitalize transition-all ${
                        isDominant && isRelevant ? 'font-bold' : 'font-medium'
                      } ${
                        isSelected
                          ? isDark ? 'text-blue-300' : 'text-blue-700'
                          : isRelevant
                            ? isDark ? 'text-zinc-200' : 'text-neutral-900'
                            : isDark ? 'text-zinc-600' : 'text-neutral-500'
                      }`}
                    >
                      {node.emotion}
                    </span>
                    <span 
                      className={`text-xs transition-all ${
                        isDominant && isRelevant ? 'font-bold text-base' : 'font-semibold'
                      } ${
                        isSelected
                          ? isDark ? 'text-blue-300' : 'text-blue-700'
                          : isRelevant
                            ? isDark ? 'text-zinc-300' : 'text-neutral-700'
                            : isDark ? 'text-zinc-600' : 'text-neutral-500'
                      }`}
                    >
                      {node.percentage.toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-neutral-200'}`}>
                    <div
                      className="h-full transition-all duration-500 ease-out rounded-full"
                      style={{
                        width: `${node.percentage}%`,
                        backgroundColor: isRelevant ? getEmotionColor(node.emotion) : isDark ? '#52525b' : '#a1a1aa',
                        opacity: isRelevant ? 1 : 0.3,
                        boxShadow: isDominant && isRelevant 
                          ? `0 0 8px ${getEmotionColor(node.emotion)}80`
                          : undefined
                      }}
                    />
                  </div>

                  {/* Trade Count and Avg P&L */}
                  <div className="flex items-center justify-between mt-2">
                    <span 
                      className={`text-xs transition-all ${
                        isRelevant
                          ? isDark ? 'text-zinc-400' : 'text-neutral-600'
                          : isDark ? 'text-zinc-700' : 'text-neutral-400'
                      }`}
                    >
                      {node.count} transition{node.count !== 1 ? 's' : ''}
                    </span>
                    <span 
                      className={`text-xs transition-all ${
                        isDominant && isRelevant ? 'font-bold' : 'font-medium'
                      } ${
                        node.avgPnL >= 0
                          ? isRelevant
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-green-700' : 'text-green-400'
                          : isRelevant
                            ? isDark ? 'text-red-400' : 'text-red-600'
                            : isDark ? 'text-red-700' : 'text-red-400'
                      }`}
                    >
                      {formatIndianCurrency(node.avgPnL)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (transitionPairs.length === 0) {
    return null;
  }

  return (
    <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Emotional Carryover Analysis
            </h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
              {selectedEmotion 
                ? `Showing how emotions influence the next trade within the same day`
                : 'Click any emotion to explore how it carries over to your next trade'
              }
            </p>
            <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-2 space-y-0.5`}>
              <div>Showing emotional carryover within the same trading day</div>
              <div>Transitions analyzed: {transitionPairs.length}</div>
            </div>
          </div>
        </div>

        {/* Clear Selection Button */}
        {selectedEmotion && (
          <div className="mb-4">
            <button
              onClick={() => setSelectedEmotion(null)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Insight Summary */}
        {insightSummary && (
          <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'}`}>
            <div className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'} mb-3`}>
              After <span className="capitalize text-blue-500">{selectedEmotion.emotion}</span> at <span className="text-blue-500">{insightSummary.stageName}</span>:
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              {insightSummary.selectedIndex < 2 && (
                <div>
                  <div className={`${isDark ? 'text-zinc-400' : 'text-neutral-600'} mb-1`}>
                    Next trade most common entry:
                  </div>
                  <div className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                    <span className="capitalize">{insightSummary.mostCommonNextEntry}</span> 
                    <span className={`ml-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      ({insightSummary.mostCommonNextEntryPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
              {insightSummary.selectedIndex < 3 && (
                <div>
                  <div className={`${isDark ? 'text-zinc-400' : 'text-neutral-600'} mb-1`}>
                    Next trade behavior:
                  </div>
                  <div className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                    <span className="capitalize">{insightSummary.mostCommonNextBehavior}</span>
                    <span className={`ml-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      ({insightSummary.mostCommonNextBehaviorPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4 Column Layout */}
        <div className="grid grid-cols-4 gap-4 relative">
          {renderColumn('Exit (Trade N)', 'exitN', exitNData)}
          {renderColumn('Post-Exit (Trade N)', 'postExitN', postExitNData)}
          {renderColumn('Entry (Trade N+1)', 'entryN1', entryN1Data)}
          {renderColumn('In-Trade (Trade N+1)', 'inTradeN1', inTradeN1Data)}
        </div>

        {/* Legend */}
        <div className={`mt-6 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-neutral-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`} />
                <span className={isDark ? 'text-zinc-400' : 'text-neutral-600'}>
                  Selected Emotion
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${isDark ? 'bg-zinc-800' : 'bg-white border border-neutral-200'}`} />
                <span className={isDark ? 'text-zinc-400' : 'text-neutral-600'}>
                  Related Emotions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${isDark ? 'bg-zinc-900/30' : 'bg-neutral-100/50'} opacity-40`} />
                <span className={isDark ? 'text-zinc-400' : 'text-neutral-600'}>
                  Unrelated Emotions
                </span>
              </div>
            </div>

            {/* Dominant Path Inline */}
            <div className="flex items-center gap-3 text-xs">
              <span className={`font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                Most Common Path:
              </span>
              <span className={`capitalize ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                {dominantPath.topExitN} → {dominantPath.topPostExitN} → {dominantPath.topEntryN1} → {dominantPath.topInTradeN1}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}