import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getEmotionFieldFromTrade } from "./useEmotionData";
import { HelpCircle, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useState } from "react";
import { calculatePnL } from "../../utils/tradeCalculations";

interface EmotionImpactPerformanceProps {
  closedTrades: any[];
  isDark: boolean;
  formatIndianCurrency: (num: number) => string;
}

interface EmotionMetric {
  emotion: string;
  trades: number;
  winRate: number;
  avgPointsNet: number;
  avgPointsWin: number;
  avgPointsLoss: number;
  avgPnL: number;
  expectancy: number;
}

type SortColumn = 'emotion' | 'trades' | 'winRate' | 'avgPointsNet' | 'avgPnL' | 'expectancy';
type SortDirection = 'asc' | 'desc';

export function EmotionImpactPerformance({ closedTrades, isDark, formatIndianCurrency }: EmotionImpactPerformanceProps) {
  const [sortConfig, setSortConfig] = useState<Record<string, { column: SortColumn; direction: SortDirection }>>({
    entry: { column: 'expectancy', direction: 'desc' },
    inTrade: { column: 'expectancy', direction: 'desc' },
    exit: { column: 'expectancy', direction: 'desc' },
    postExit: { column: 'expectancy', direction: 'desc' }
  });

  const calculateStageMetrics = (stage: 'entry' | 'inTrade' | 'exit' | 'postExit'): EmotionMetric[] => {
    const emotionMap: Record<string, {
      trades: number;
      wins: number;
      totalPoints: number;
      winPoints: number;
      lossPoints: number;
      totalPnL: number;
    }> = {};

    closedTrades.forEach(trade => {
      const emotion = getEmotionFieldFromTrade(trade, stage);

      if (!emotion || emotion === 'None' || emotion === '') return;

      if (!emotionMap[emotion]) {
        emotionMap[emotion] = {
          trades: 0,
          wins: 0,
          totalPoints: 0,
          winPoints: 0,
          lossPoints: 0,
          totalPnL: 0
        };
      }

      const points = (trade.exitPremium || 0) - (trade.entryPremium || 0);
      const pnl = calculatePnL(trade);
      const isWin = pnl > 0;

      emotionMap[emotion].trades += 1;
      emotionMap[emotion].totalPoints += points;
      emotionMap[emotion].totalPnL += pnl;

      if (isWin) {
        emotionMap[emotion].wins += 1;
        emotionMap[emotion].winPoints += points;
      } else {
        emotionMap[emotion].lossPoints += points;
      }
    });

    // Convert to array (no filtering - show all emotions)
    const metrics: EmotionMetric[] = Object.entries(emotionMap)
      .map(([emotion, data]) => {
        const winRate = (data.wins / data.trades) * 100;
        const lossRate = ((data.trades - data.wins) / data.trades);
        const avgPointsNet = data.totalPoints / data.trades;
        const avgPointsWin = data.wins > 0 ? data.winPoints / data.wins : 0;
        const avgPointsLoss = (data.trades - data.wins) > 0 ? data.lossPoints / (data.trades - data.wins) : 0;
        const avgPnL = data.totalPnL / data.trades;
        const expectancy = (winRate / 100) * avgPointsWin + lossRate * avgPointsLoss;

        return {
          emotion,
          trades: data.trades,
          winRate,
          avgPointsNet,
          avgPointsWin,
          avgPointsLoss,
          avgPnL,
          expectancy
        };
      });

    return metrics;
  };

  const sortData = (data: EmotionMetric[], stage: string): EmotionMetric[] => {
    const config = sortConfig[stage];
    if (!config) return data;

    return [...data].sort((a, b) => {
      const aValue = a[config.column];
      const bValue = b[config.column];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return config.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      const diff = (aValue as number) - (bValue as number);
      return config.direction === 'asc' ? diff : -diff;
    });
  };

  const handleSort = (stage: string, column: SortColumn) => {
    setSortConfig(prev => {
      const current = prev[stage];
      return {
        ...prev,
        [stage]: {
          column,
          direction: current?.column === column && current?.direction === 'desc' ? 'asc' : 'desc'
        }
      };
    });
  };

  const renderPerformanceBar = (value: number, maxValue: number) => {
    const absValue = Math.abs(value);
    const percentage = Math.min((absValue / maxValue) * 100, 100);
    const color = value >= 0 ? '#10b981' : '#ef4444';

    return (
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {value >= 0 ? '+' : ''}{value.toFixed(1)}
        </span>
        <div className="flex-1 h-4 bg-zinc-800/20 dark:bg-zinc-700/20 rounded overflow-hidden" style={{ maxWidth: '120px' }}>
          <div 
            className="h-full transition-all"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: color,
              opacity: 0.7
            }}
          />
        </div>
      </div>
    );
  };

  const renderTable = (title: string, stage: 'entry' | 'inTrade' | 'exit' | 'postExit') => {
    const metrics = calculateStageMetrics(stage);
    const sortedMetrics = sortData(metrics, stage);
    
    if (sortedMetrics.length === 0) {
      return (
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              No emotions recorded at this stage
            </p>
          </CardContent>
        </Card>
      );
    }

    const maxAbsPoints = Math.max(...sortedMetrics.map(m => Math.abs(m.avgPointsNet)));
    const bestExpectancy = Math.max(...sortedMetrics.map(m => m.expectancy));
    const worstExpectancy = Math.min(...sortedMetrics.map(m => m.expectancy));

    return (
      <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
        <CardHeader>
          <CardTitle className={`text-base ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={`border-b ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
                <tr>
                  <th 
                    className={`text-left py-2 px-2 font-medium cursor-pointer hover:bg-zinc-800/30 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    onClick={() => handleSort(stage, 'emotion')}
                  >
                    Emotion
                  </th>
                  <th 
                    className={`text-center py-2 px-2 font-medium cursor-pointer hover:bg-zinc-800/30 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    onClick={() => handleSort(stage, 'trades')}
                    title="Number of trades with this emotion"
                  >
                    Trades
                  </th>
                  <th 
                    className={`text-center py-2 px-2 font-medium cursor-pointer hover:bg-zinc-800/30 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    onClick={() => handleSort(stage, 'winRate')}
                    title="Percentage of winning trades"
                  >
                    Win Rate
                  </th>
                  <th 
                    className={`text-left py-2 px-2 font-medium cursor-pointer hover:bg-zinc-800/30 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    onClick={() => handleSort(stage, 'avgPointsNet')}
                  >
                    <div className="flex items-center gap-1">
                      Avg Points (Net)
                      <HelpCircle 
                        className="w-3 h-3 opacity-50" 
                        title="Average number of points captured per trade"
                      />
                    </div>
                  </th>
                  <th 
                    className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    title="Average points on winning trades"
                  >
                    Avg Win
                  </th>
                  <th 
                    className={`text-center py-2 px-2 font-medium ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    title="Average points on losing trades"
                  >
                    Avg Loss
                  </th>
                  <th 
                    className={`text-center py-2 px-2 font-medium cursor-pointer hover:bg-zinc-800/30 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    onClick={() => handleSort(stage, 'avgPnL')}
                  >
                    Avg P&L
                  </th>
                  <th 
                    className={`text-center py-2 px-2 font-medium cursor-pointer hover:bg-zinc-800/30 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                    onClick={() => handleSort(stage, 'expectancy')}
                  >
                    <div className="flex items-center gap-1 justify-center">
                      Expectancy
                      <HelpCircle 
                        className="w-3 h-3 opacity-50" 
                        title="Expected profit per trade = (Win Rate × Avg Win) - (Loss Rate × Avg Loss)"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMetrics.map((metric, index) => (
                  <tr 
                    key={`${stage}-${metric.emotion}-${index}`}
                    className={`border-b ${isDark ? 'border-zinc-800' : 'border-neutral-100'} hover:bg-zinc-800/20 dark:hover:bg-zinc-800/40`}
                  >
                    <td className={`py-2 px-2 font-medium capitalize ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>
                      {metric.emotion}
                    </td>
                    <td className={`py-2 px-2 text-center ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      <div className="flex items-center justify-center gap-1">
                        {metric.trades}
                        {metric.trades < 5 && (
                          <AlertTriangle 
                            className="w-3.5 h-3.5 text-yellow-500" 
                            title="Low sample size. Metrics may change as more trades are recorded."
                          />
                        )}
                      </div>
                    </td>
                    <td className={`py-2 px-2 text-center ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      {metric.winRate.toFixed(1)}%
                    </td>
                    <td className="py-2 px-2">
                      {renderPerformanceBar(metric.avgPointsNet, maxAbsPoints)}
                    </td>
                    <td className={`py-2 px-2 text-center text-green-600 dark:text-green-400`}>
                      +{metric.avgPointsWin.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2 text-center text-red-600 dark:text-red-400`}>
                      {metric.avgPointsLoss.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2 text-center ${metric.avgPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatIndianCurrency(metric.avgPnL)}
                    </td>
                    <td className={`py-2 px-2 text-center ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      <div className="flex items-center justify-center gap-1">
                        {metric.expectancy.toFixed(2)}
                        {metric.expectancy === bestExpectancy && (
                          <ArrowUpCircle className="w-4 h-4 text-green-500" title="Best expectancy" />
                        )}
                        {metric.expectancy === worstExpectancy && sortedMetrics.length > 1 && (
                          <ArrowDownCircle className="w-4 h-4 text-red-500" title="Worst expectancy" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          Emotion Impact on Performance
        </h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
          How emotional states affect trade outcomes
        </p>
      </div>

      {/* 2x2 Grid of Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTable('Entry Emotion Performance', 'entry')}
        {renderTable('In-Trade Emotion Performance', 'inTrade')}
        {renderTable('Exit Emotion Performance', 'exit')}
        {renderTable('Post-Exit Emotion Performance', 'postExit')}
      </div>
    </div>
  );
}