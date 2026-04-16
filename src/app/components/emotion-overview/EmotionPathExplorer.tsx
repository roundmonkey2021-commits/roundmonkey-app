import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getEmotionFieldFromTrade } from './useEmotionData';
import { calculatePnL } from '../../utils/tradeCalculations';

interface Trade {
  id: string;
  pnl?: number;
  entryPremium: number;
  exitPremium?: number;
  action: 'buy' | 'sell';
  entryEmotions?: string;
  inTradeEmotions?: string;
  exitEmotions?: string;
  postExitEmotions?: string;
}

interface EmotionPathExplorerProps {
  closedTrades: Trade[];
  isDark: boolean;
}

type Stage = 'entry' | 'inTrade' | 'exit' | 'postExit';
type FilterType = 'all' | 'winning' | 'losing';

interface EmotionNode {
  emotion: string;
  count: number;
  percentage: number;
  avgPnL: number;
  totalPnL: number;
}

interface SelectedEmotion {
  stage: Stage;
  emotion: string;
}

export function EmotionPathExplorer({ closedTrades, isDark }: EmotionPathExplorerProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedEmotion, setSelectedEmotion] = useState<SelectedEmotion | null>(null);

  // Filter trades based on win/loss
  const filteredTrades = useMemo(() => {
    if (filter === 'all') return closedTrades;
    if (filter === 'winning') return closedTrades.filter(t => calculatePnL(t) > 0);
    if (filter === 'losing') return closedTrades.filter(t => calculatePnL(t) < 0);
    return closedTrades;
  }, [closedTrades, filter]);

  // Calculate emotion distribution for each stage
  const getEmotionData = (stage: Stage, conditionalTrades: Trade[] | null = null): EmotionNode[] => {
    const tradesToAnalyze = conditionalTrades || filteredTrades;
    const emotionMap: Record<string, { count: number; totalPnL: number }> = {};

    tradesToAnalyze.forEach(trade => {
      const emotion = getEmotionFieldFromTrade(trade, stage);
      if (!emotion || emotion.trim() === '' || emotion.toLowerCase() === 'none') return;

      if (!emotionMap[emotion]) {
        emotionMap[emotion] = { count: 0, totalPnL: 0 };
      }
      emotionMap[emotion].count += 1;
      emotionMap[emotion].totalPnL += calculatePnL(trade);
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

  // Get conditional trades based on selected emotion
  const getConditionalTrades = (
    targetStage: Stage,
    selectedStage: Stage,
    selectedEmotionValue: string
  ): Trade[] => {
    if (!selectedEmotionValue) return filteredTrades;

    // If same stage is selected, no filtering needed
    if (targetStage === selectedStage) {
      return filteredTrades.filter(trade => {
        const emotion = getEmotionFieldFromTrade(trade, targetStage);
        return emotion === selectedEmotionValue;
      });
    }

    // For previous stages (source analysis)
    const stages: Stage[] = ['entry', 'inTrade', 'exit', 'postExit'];
    const selectedIndex = stages.indexOf(selectedStage);
    const targetIndex = stages.indexOf(targetStage);

    return filteredTrades.filter(trade => {
      const targetEmotion = getEmotionFieldFromTrade(trade, targetStage);
      const selectedEmotionInTrade = getEmotionFieldFromTrade(trade, selectedStage);
      
      if (targetIndex < selectedIndex) {
        // Looking at previous stages - show where selected emotion came from
        return selectedEmotionInTrade === selectedEmotionValue;
      } else if (targetIndex > selectedIndex) {
        // Looking at next stages - show where selected emotion leads to
        return selectedEmotionInTrade === selectedEmotionValue;
      }
      
      return true;
    });
  };

  const entryData = useMemo(() => {
    const conditionalTrades = selectedEmotion ? getConditionalTrades('entry', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('entry', conditionalTrades);
  }, [filteredTrades, selectedEmotion]);

  const inTradeData = useMemo(() => {
    const conditionalTrades = selectedEmotion ? getConditionalTrades('inTrade', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('inTrade', conditionalTrades);
  }, [filteredTrades, selectedEmotion]);

  const exitData = useMemo(() => {
    const conditionalTrades = selectedEmotion ? getConditionalTrades('exit', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('exit', conditionalTrades);
  }, [filteredTrades, selectedEmotion]);

  const postExitData = useMemo(() => {
    const conditionalTrades = selectedEmotion ? getConditionalTrades('postExit', selectedEmotion.stage, selectedEmotion.emotion) : null;
    return getEmotionData('postExit', conditionalTrades);
  }, [filteredTrades, selectedEmotion]);

  const handleEmotionClick = (stage: Stage, emotion: string) => {
    if (selectedEmotion?.stage === stage && selectedEmotion?.emotion === emotion) {
      // Deselect if clicking the same emotion
      setSelectedEmotion(null);
    } else {
      setSelectedEmotion({ stage, emotion });
    }
  };

  const isEmotionSelected = (stage: Stage, emotion: string) => {
    return selectedEmotion?.stage === stage && selectedEmotion?.emotion === emotion;
  };

  const isEmotionRelevant = (stage: Stage, emotion: string) => {
    if (!selectedEmotion) return true;
    
    // Selected emotion is always relevant
    if (isEmotionSelected(stage, emotion)) return true;

    // Check if this emotion appears in trades with the selected emotion
    const conditionalTrades = getConditionalTrades(stage, selectedEmotion.stage, selectedEmotion.emotion);
    return conditionalTrades.some(trade => {
      const tradeEmotion = getEmotionFieldFromTrade(trade, stage);
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

  // Get emotion color - consistent with other components
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

  // Get contextual subtitle for each stage based on selection
  const getStageSubtitle = (stage: Stage): string => {
    if (!selectedEmotion) return 'Overall Distribution';
    
    const stages: Stage[] = ['entry', 'inTrade', 'exit', 'postExit'];
    const selectedIndex = stages.indexOf(selectedEmotion.stage);
    const currentIndex = stages.indexOf(stage);

    if (currentIndex === selectedIndex) {
      return 'Current selected state';
    } else if (currentIndex < selectedIndex) {
      return 'Source of selected emotion';
    } else if (currentIndex === selectedIndex + 1) {
      return 'Next stage outcomes';
    } else {
      return 'Final outcomes';
    }
  };

  // Get ranking emoji
  const getRankingEmoji = (index: number): string => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  // Get dominant path (top emotion in each column)
  const getDominantPath = () => {
    const topEntry = entryData[0]?.emotion || '-';
    const topInTrade = inTradeData[0]?.emotion || '-';
    const topExit = exitData[0]?.emotion || '-';
    const topPostExit = postExitData[0]?.emotion || '-';
    return { topEntry, topInTrade, topExit, topPostExit };
  };

  const dominantPath = getDominantPath();

  // Get insight summary when emotion is selected
  const getInsightSummary = () => {
    if (!selectedEmotion) return null;

    const stages: Stage[] = ['entry', 'inTrade', 'exit', 'postExit'];
    const selectedIndex = stages.indexOf(selectedEmotion.stage);

    let mostCommonPrevious = '-';
    let mostCommonPreviousPercent = 0;
    let mostCommonNext = '-';
    let mostCommonNextPercent = 0;
    let mostCommonFinal = '-';
    let mostCommonFinalPercent = 0;

    // Get most common previous (if not at entry)
    if (selectedIndex > 0) {
      const prevStage = stages[selectedIndex - 1];
      const prevData = [entryData, inTradeData, exitData, postExitData][selectedIndex - 1];
      if (prevData.length > 0) {
        mostCommonPrevious = prevData[0].emotion;
        mostCommonPreviousPercent = prevData[0].percentage;
      }
    }

    // Get most common next (if not at postExit)
    if (selectedIndex < stages.length - 1) {
      const nextStage = stages[selectedIndex + 1];
      const nextData = [entryData, inTradeData, exitData, postExitData][selectedIndex + 1];
      if (nextData.length > 0) {
        mostCommonNext = nextData[0].emotion;
        mostCommonNextPercent = nextData[0].percentage;
      }
    }

    // Get most common final (always postExit)
    if (selectedIndex < 3) {
      if (postExitData.length > 0) {
        mostCommonFinal = postExitData[0].emotion;
        mostCommonFinalPercent = postExitData[0].percentage;
      }
    }

    const stageName = selectedEmotion.stage === 'inTrade' 
      ? 'In-Trade' 
      : selectedEmotion.stage.charAt(0).toUpperCase() + selectedEmotion.stage.slice(1);

    return {
      stageName,
      mostCommonPrevious,
      mostCommonPreviousPercent,
      mostCommonNext,
      mostCommonNextPercent,
      mostCommonFinal,
      mostCommonFinalPercent,
      selectedIndex,
    };
  };

  const insightSummary = getInsightSummary();

  const renderColumn = (
    title: string,
    stage: Stage,
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
              const isDominant = index === 0; // Top emotion in column
              const rankingEmoji = getRankingEmoji(index);
              
              return (
                <button
                  key={node.emotion}
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
                      {node.count} trade{node.count !== 1 ? 's' : ''}
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

  return (
    <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Emotion Path Explorer
            </h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
              {selectedEmotion 
                ? `Showing conditional probabilities for "${selectedEmotion.emotion}" at ${selectedEmotion.stage === 'inTrade' ? 'in-trade' : selectedEmotion.stage} stage`
                : 'Click any emotion to explore its pathways and relationships across trade stages'
              }
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All Trades
            </button>
            <button
              onClick={() => setFilter('winning')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'winning'
                  ? isDark
                    ? 'bg-green-600 text-white'
                    : 'bg-green-500 text-white'
                  : isDark
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Winning
            </button>
            <button
              onClick={() => setFilter('losing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === 'losing'
                  ? isDark
                    ? 'bg-red-600 text-white'
                    : 'bg-red-500 text-white'
                  : isDark
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Losing
            </button>
          </div>
        </div>

        {/* Clear Selection Button */}
        {selectedEmotion && (
          <div className="flex items-center justify-between mb-4">
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
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Filtered Trades: {filteredTrades.length}
            </span>
          </div>
        )}

        {/* Filtered Trades Context - when no selection */}
        {!selectedEmotion && (
          <div className="mb-4 flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Analyzing {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Insight Summary - Compact version above grid */}
        {insightSummary && (
          <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'}`}>
            <div className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'} mb-3`}>
              When <span className="capitalize text-blue-500">{selectedEmotion.emotion}</span> at <span className="text-blue-500">{insightSummary.stageName}</span>:
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              {insightSummary.selectedIndex > 0 && (
                <div>
                  <div className={`${isDark ? 'text-zinc-400' : 'text-neutral-600'} mb-1`}>
                    Most common previous:
                  </div>
                  <div className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                    <span className="capitalize">{insightSummary.mostCommonPrevious}</span> 
                    <span className={`ml-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      ({insightSummary.mostCommonPreviousPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
              {insightSummary.selectedIndex < 3 && (
                <div>
                  <div className={`${isDark ? 'text-zinc-400' : 'text-neutral-600'} mb-1`}>
                    Most common next:
                  </div>
                  <div className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                    <span className="capitalize">{insightSummary.mostCommonNext}</span>
                    <span className={`ml-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      ({insightSummary.mostCommonNextPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
              {insightSummary.selectedIndex < 3 && (
                <div>
                  <div className={`${isDark ? 'text-zinc-400' : 'text-neutral-600'} mb-1`}>
                    Most common final outcome:
                  </div>
                  <div className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                    <span className="capitalize">{insightSummary.mostCommonFinal}</span>
                    <span className={`ml-1 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      ({insightSummary.mostCommonFinalPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4 Column Layout */}
        <div className="grid grid-cols-4 gap-4">
          {renderColumn('Entry', 'entry', entryData)}
          
          {/* Connector */}
          <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-[1px] h-3/4 opacity-20" 
            style={{ 
              background: isDark 
                ? 'linear-gradient(to bottom, transparent, #52525b, transparent)' 
                : 'linear-gradient(to bottom, transparent, #a1a1aa, transparent)' 
            }} 
          />
          
          {renderColumn('In-Trade', 'inTrade', inTradeData)}
          
          {/* Connector */}
          <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-[1px] h-3/4 opacity-20" 
            style={{ 
              background: isDark 
                ? 'linear-gradient(to bottom, transparent, #52525b, transparent)' 
                : 'linear-gradient(to bottom, transparent, #a1a1aa, transparent)' 
            }} 
          />
          
          {renderColumn('Exit', 'exit', exitData)}
          
          {/* Connector */}
          <div className="absolute left-[75%] top-1/2 -translate-y-1/2 w-[1px] h-3/4 opacity-20" 
            style={{ 
              background: isDark 
                ? 'linear-gradient(to bottom, transparent, #52525b, transparent)' 
                : 'linear-gradient(to bottom, transparent, #a1a1aa, transparent)' 
            }} 
          />
          
          {renderColumn('Post-Exit', 'postExit', postExitData)}
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
                {dominantPath.topEntry} → {dominantPath.topInTrade} → {dominantPath.topExit} → {dominantPath.topPostExit}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}