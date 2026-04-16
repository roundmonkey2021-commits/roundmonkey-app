import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

interface Trade {
  id: string;
  instrument?: string;
  setup?: string;
  timestamp: string;
  quantity?: number;
  entryPremium?: number;
  exitPremium?: number;
  action?: 'buy' | 'sell';
}

interface PointsCapturedChartProps {
  trades: Trade[];
  isDark?: boolean;
}

type TimeFrame = 'trade' | 'day' | 'week' | 'month';

export function PointsCapturedChart({ trades, isDark = true }: PointsCapturedChartProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('trade');

  const formatPoints = (num: number): string => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 1,
    }).format(Math.abs(num));
  };

  const calculatePoints = (trade: Trade): number => {
    if (!trade.exitPremium || !trade.entryPremium) return 0;
    
    // Points captured based on action type
    if (trade.action === 'buy') {
      return trade.exitPremium - trade.entryPremium;
    } else {
      return trade.entryPremium - trade.exitPremium;
    }
  };

  const getChartData = () => {
    const closedTrades = trades
      .filter(t => t.exitPremium !== undefined && t.entryPremium !== undefined)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (closedTrades.length === 0) return [];

    if (timeFrame === 'trade') {
      // Calculate points for each trade
      const tradesWithPoints = closedTrades.map(trade => ({
        ...trade,
        points: calculatePoints(trade)
      }));

      // Find top 3 profits and top 3 losses (only from positive and negative trades respectively)
      const profitTrades = tradesWithPoints.filter(t => t.points > 0);
      const lossTrades = tradesWithPoints.filter(t => t.points < 0);
      
      const sortedProfits = [...profitTrades].sort((a, b) => b.points - a.points);
      const sortedLosses = [...lossTrades].sort((a, b) => a.points - b.points);
      
      const top3Profits = new Set(sortedProfits.slice(0, 3).map(t => t.id));
      const top3Losses = new Set(sortedLosses.slice(0, 3).map(t => t.id));

      return tradesWithPoints.map((trade, index) => {
        const isTop3Profit = top3Profits.has(trade.id);
        const isTop3Loss = top3Losses.has(trade.id);
        
        let fill = '';
        if (isTop3Profit) {
          fill = '#059669'; // Darker green for top profits
        } else if (isTop3Loss) {
          fill = '#dc2626'; // Darker red for top losses
        } else if (trade.points >= 0) {
          fill = '#10b981'; // Regular green
        } else {
          fill = '#ef4444'; // Regular red
        }

        return {
          name: `T${index + 1}`,
          tradeKey: trade.id, // Unique key for each trade
          points: trade.points,
          fill: fill,
          trade: trade,
          isTop3Profit,
          isTop3Loss,
        };
      });
    }

    // Aggregate by day, week, or month
    const aggregated = new Map<string, { points: number; trades: Trade[] }>();

    closedTrades.forEach(trade => {
      const date = new Date(trade.timestamp);
      let key = '';

      if (timeFrame === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (timeFrame === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (timeFrame === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!aggregated.has(key)) {
        aggregated.set(key, { points: 0, trades: [] });
      }
      const entry = aggregated.get(key)!;
      entry.points += calculatePoints(trade);
      entry.trades.push(trade);
    });

    const aggregatedData = Array.from(aggregated.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, data]) => ({ key, ...data }));

    // Find top 3 profits and top 3 losses for aggregated data (only from positive and negative periods respectively)
    const profitPeriods = aggregatedData.filter(d => d.points > 0);
    const lossPeriods = aggregatedData.filter(d => d.points < 0);
    
    const sortedProfits = [...profitPeriods].sort((a, b) => b.points - a.points);
    const sortedLosses = [...lossPeriods].sort((a, b) => a.points - b.points);
    
    const top3Profits = new Set(sortedProfits.slice(0, 3).map(d => d.key));
    const top3Losses = new Set(sortedLosses.slice(0, 3).map(d => d.key));

    return aggregatedData.map(data => {
      let displayName = data.key;
      if (timeFrame === 'day') {
        displayName = new Date(data.key).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else if (timeFrame === 'week') {
        displayName = `Week ${new Date(data.key).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      } else if (timeFrame === 'month') {
        const [year, month] = data.key.split('-');
        displayName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      }

      const isTop3Profit = top3Profits.has(data.key);
      const isTop3Loss = top3Losses.has(data.key);
      
      let fill = '';
      if (isTop3Profit) {
        fill = '#059669'; // Darker green for top profits
      } else if (isTop3Loss) {
        fill = '#dc2626'; // Darker red for top losses
      } else if (data.points >= 0) {
        fill = '#10b981'; // Regular green
      } else {
        fill = '#ef4444'; // Regular red
      }

      return {
        name: displayName,
        points: data.points,
        fill: fill,
        tradeCount: data.trades.length,
        periodKey: data.key, // Renamed to avoid conflict with React key
        isTop3Profit,
        isTop3Loss,
      };
    });
  };

  const chartData = getChartData();

  // Calculate points statistics based on current view
  let totalPoints = 0;
  let top3LossesTotal = 0;
  let pointsWithoutTop3Losses = 0;

  if (timeFrame === 'trade' || timeFrame === 'day') {
    if (timeFrame === 'trade') {
      // Calculate based on individual trades
      const closedTrades = trades.filter(t => t.exitPremium !== undefined && t.entryPremium !== undefined);
      totalPoints = closedTrades.reduce((sum, t) => sum + calculatePoints(t), 0);
      const tradesWithPoints = closedTrades.map(t => ({ ...t, points: calculatePoints(t) }));
      const sortedByPoints = [...tradesWithPoints].sort((a, b) => b.points - a.points);
      const top3Losses = sortedByPoints.slice(-3);
      top3LossesTotal = top3Losses.reduce((sum, t) => sum + t.points, 0);
      pointsWithoutTop3Losses = totalPoints - top3LossesTotal;
    } else {
      // Calculate based on daily aggregated data
      totalPoints = chartData.reduce((sum, d) => sum + d.points, 0);
      const sortedByPoints = [...chartData].sort((a, b) => b.points - a.points);
      const top3Losses = sortedByPoints.slice(-3);
      top3LossesTotal = top3Losses.reduce((sum, d) => sum + d.points, 0);
      pointsWithoutTop3Losses = totalPoints - top3LossesTotal;
    }
  } else {
    // For week/month views, just show total
    const closedTrades = trades.filter(t => t.exitPremium !== undefined && t.entryPremium !== undefined);
    totalPoints = closedTrades.reduce((sum, t) => sum + calculatePoints(t), 0);
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;

    return (
      <div className={`rounded-lg border p-3 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className={`font-semibold mb-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
          {data.name}
          {data.isTop3Profit && (
            <span className="ml-2 text-xs font-bold text-green-400">🏆 TOP GAIN</span>
          )}
          {data.isTop3Loss && (
            <span className="ml-2 text-xs font-bold text-red-400">⚠️ TOP LOSS</span>
          )}
        </div>
        <div className={`text-sm font-bold ${data.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {data.points >= 0 ? '+' : ''}{formatPoints(data.points)} pts
        </div>
        
        {timeFrame === 'trade' && data.trade && (
          <div className="mt-2 space-y-1">
            {data.trade.quantity && (
              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="font-medium">Quantity:</span> {data.trade.quantity}
              </div>
            )}
            {data.trade.setup && (
              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="font-medium">Setup:</span> {data.trade.setup}
              </div>
            )}
            {data.trade.entryPremium !== undefined && (
              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="font-medium">Entry:</span> ₹{data.trade.entryPremium.toFixed(2)}
              </div>
            )}
            {data.trade.exitPremium !== undefined && (
              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                <span className="font-medium">Exit:</span> ₹{data.trade.exitPremium.toFixed(2)}
              </div>
            )}
          </div>
        )}
        
        {timeFrame !== 'trade' && data.tradeCount && (
          <div className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {data.tradeCount} trade{data.tradeCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-zinc-900'}>
              Points Captured Per {timeFrame === 'trade' ? 'Trade' : timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
            </CardTitle>
            <p className={`text-sm mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
              Premium points gained or lost • Top 3 gains/losses highlighted
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeFrame === 'trade' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame('trade')}
            >
              Trades
            </Button>
            <Button
              variant={timeFrame === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame('day')}
            >
              Daily
            </Button>
            <Button
              variant={timeFrame === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame('week')}
            >
              Weekly
            </Button>
            <Button
              variant={timeFrame === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame('month')}
            >
              Monthly
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Points Statistics Box */}
        <div className={`${(timeFrame === 'trade' || timeFrame === 'day') ? 'grid grid-cols-2 gap-4' : ''} mb-6 p-4 rounded-lg border ${isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
          <div>
            <div className={`text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Total Points Captured
            </div>
            <div className={`text-2xl font-bold ${totalPoints >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPoints >= 0 ? '+' : ''}{formatPoints(totalPoints)} pts
            </div>
            <div className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
              {chartData.length} {timeFrame === 'trade' ? 'trades' : timeFrame === 'day' ? 'days' : timeFrame === 'week' ? 'weeks' : 'months'}
            </div>
          </div>
          
          {(timeFrame === 'trade' || timeFrame === 'day') && (
            <div>
              <div className={`text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Points Without Top 3 {timeFrame === 'trade' ? 'Loss Trades' : 'Loss Days'}
              </div>
              <div className={`text-2xl font-bold ${pointsWithoutTop3Losses >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {pointsWithoutTop3Losses >= 0 ? '+' : ''}{formatPoints(pointsWithoutTop3Losses)} pts
              </div>
              <div className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>
                Impact: {top3LossesTotal >= 0 ? '+' : ''}{formatPoints(Math.abs(top3LossesTotal))} pts
              </div>
            </div>
          )}
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke={isDark ? '#71717a' : '#52525b'}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke={isDark ? '#71717a' : '#52525b'}
                tickFormatter={(value) => `${value}`}
              />
              <ReferenceLine y={0} stroke={isDark ? '#52525b' : '#a1a1aa'} strokeWidth={2} />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
              />
              <Bar key="points-bar" dataKey="points" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-points-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
