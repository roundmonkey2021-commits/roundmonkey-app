import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Trade } from '../../../hooks/useTrades';
import { calculatePnL } from '../../../utils/tradeCalculations';
import { PhaseFilter } from '../PhaseFilter';

interface GrossProfitLossDistributionChartProps {
  trades: Trade[];
  isDark: boolean;
  onClose?: () => void;
}

export function GrossProfitLossDistributionChart({ trades, isDark, onClose }: GrossProfitLossDistributionChartProps) {
  const [timeFrame, setTimeFrame] = useState<'days' | 'weeks' | 'months'>('days');
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  
  // Get available phases from trades
  const availablePhases = Array.from(new Set(trades.map(t => t.phase).filter(Boolean))) as string[];
  
  // Filter trades by selected phases
  const filteredTrades = selectedPhases.length === 0 
    ? trades 
    : trades.filter(t => t.phase && selectedPhases.includes(t.phase));

  // Format currency for Indian numbering system
  const formatIndianCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 10000000) {
      return `${(absValue / 10000000).toFixed(1)}Cr`;
    } else if (absValue >= 100000) {
      return `${(absValue / 100000).toFixed(1)}L`;
    } else if (absValue >= 1000) {
      return `${(absValue / 1000).toFixed(1)}K`;
    }
    return absValue.toFixed(0);
  };

  const formatAxisCurrency = (value: number): string => {
    return `₹${formatIndianCurrency(value)}`;
  };

  // Get week start date (Monday)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Get month start date
  const getMonthStart = (date: Date): Date => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Get aggregated data based on timeframe
  const getAggregatedData = () => {
    if (filteredTrades.length === 0) return [];

    const sortedTrades = [...filteredTrades].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstTradeDate = new Date(sortedTrades[0].timestamp);
    const now = new Date();
    const data: any[] = [];

    if (timeFrame === 'days') {
      const currentDate = new Date(firstTradeDate);
      currentDate.setHours(0, 0, 0, 0);

      while (currentDate <= now) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const periodTrades = sortedTrades.filter(t => {
          const tradeDate = new Date(t.timestamp);
          return tradeDate >= currentDate && tradeDate < nextDate;
        });

        if (periodTrades.length > 0) {
          const winningTrades = periodTrades.filter(t => {
            const pnl = calculatePnL(t);
            return pnl > 0;
          });
          const losingTrades = periodTrades.filter(t => {
            const pnl = calculatePnL(t);
            return pnl < 0;
          });
          
          const totalProfit = winningTrades.reduce((sum, t) => {
            const pnl = calculatePnL(t);
            return sum + pnl;
          }, 0);
          const totalLoss = losingTrades.reduce((sum, t) => {
            const pnl = calculatePnL(t);
            return sum + pnl;
          }, 0);

          data.push({
            date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            dateKey: currentDate.toISOString().split('T')[0],
            profit: totalProfit,
            loss: totalLoss,
            winCount: winningTrades.length,
            lossCount: losingTrades.length,
            netPnL: totalProfit + totalLoss
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (timeFrame === 'weeks') {
      const currentWeekStart = getWeekStart(firstTradeDate);
      
      while (currentWeekStart <= now) {
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(nextWeekStart.getDate() + 7);

        const periodTrades = sortedTrades.filter(t => {
          const tradeDate = new Date(t.timestamp);
          return tradeDate >= currentWeekStart && tradeDate < nextWeekStart;
        });

        if (periodTrades.length > 0) {
          const winningTrades = periodTrades.filter(t => {
            const pnl = calculatePnL(t);
            return pnl > 0;
          });
          const losingTrades = periodTrades.filter(t => {
            const pnl = calculatePnL(t);
            return pnl < 0;
          });
          
          const totalProfit = winningTrades.reduce((sum, t) => {
            const pnl = calculatePnL(t);
            return sum + pnl;
          }, 0);
          const totalLoss = losingTrades.reduce((sum, t) => {
            const pnl = calculatePnL(t);
            return sum + pnl;
          }, 0);

          const weekEnd = new Date(nextWeekStart);
          weekEnd.setDate(weekEnd.getDate() - 1);

          data.push({
            date: `${currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            dateKey: currentWeekStart.toISOString().split('T')[0],
            profit: totalProfit,
            loss: totalLoss,
            winCount: winningTrades.length,
            lossCount: losingTrades.length,
            netPnL: totalProfit + totalLoss
          });
        }

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
    } else if (timeFrame === 'months') {
      const currentMonthStart = getMonthStart(firstTradeDate);
      
      while (currentMonthStart <= now) {
        const nextMonthStart = new Date(currentMonthStart);
        nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

        const periodTrades = sortedTrades.filter(t => {
          const tradeDate = new Date(t.timestamp);
          return tradeDate >= currentMonthStart && tradeDate < nextMonthStart;
        });

        if (periodTrades.length > 0) {
          const winningTrades = periodTrades.filter(t => {
            const pnl = calculatePnL(t);
            return pnl > 0;
          });
          const losingTrades = periodTrades.filter(t => {
            const pnl = calculatePnL(t);
            return pnl < 0;
          });
          
          const totalProfit = winningTrades.reduce((sum, t) => {
            const pnl = calculatePnL(t);
            return sum + pnl;
          }, 0);
          const totalLoss = losingTrades.reduce((sum, t) => {
            const pnl = calculatePnL(t);
            return sum + pnl;
          }, 0);

          data.push({
            date: currentMonthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            dateKey: currentMonthStart.toISOString().split('T')[0],
            profit: totalProfit,
            loss: totalLoss,
            winCount: winningTrades.length,
            lossCount: losingTrades.length,
            netPnL: totalProfit + totalLoss
          });
        }

        currentMonthStart.setMonth(currentMonthStart.getMonth() + 1);
      }
    }

    return data;
  };

  const chartData = getAggregatedData();


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-4 rounded-lg border ${
          isDark 
            ? 'bg-zinc-900 border-zinc-700' 
            : 'bg-white border-neutral-200'
        }`}>
          <p className={`font-semibold mb-2 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            {data.date}
          </p>
          <div className="space-y-1">
            <p className="text-emerald-500 text-sm font-medium">
              {data.winCount} winning trade{data.winCount !== 1 ? 's' : ''}: +₹{formatIndianCurrency(data.profit)}
            </p>
            <p className="text-red-500 text-sm font-medium">
              {data.lossCount} losing trade{data.lossCount !== 1 ? 's' : ''}: -₹{formatIndianCurrency(Math.abs(data.loss))}
            </p>
            <div className={`pt-2 mt-2 border-t ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
              <p className={`text-sm font-bold ${ 
                data.netPnL >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}>
                Net P&L: {data.netPnL >= 0 ? '+' : ''}₹{formatIndianCurrency(data.netPnL >= 0 ? data.netPnL : Math.abs(data.netPnL))}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
            Gross Profit vs Loss Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={isDark ? 'text-zinc-500' : 'text-neutral-500'}>
            No trading data available
          </p>
        </CardContent>
      </Card>
    );
  };

  const getChartTitle = () => {
    if (timeFrame === 'days') return 'Daily Gross Profit vs Loss Distribution';
    if (timeFrame === 'weeks') return 'Weekly Gross Profit vs Loss Distribution';
    return 'Monthly Gross Profit vs Loss Distribution';
  };

  const getChartDescription = () => {
    if (timeFrame === 'days') return 'Green bars show gross profits, red bars show gross losses per day';
    if (timeFrame === 'weeks') return 'Green bars show gross profits, red bars show gross losses per week';
    return 'Green bars show gross profits, red bars show gross losses per month';
  };

  return (
    <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} h-[450px] flex flex-col`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
              {getChartTitle()}
            </CardTitle>
            
          </div>
          <div className="flex items-center gap-2">
            {/* Phase Filter */}
            {availablePhases.length > 0 && (
              <PhaseFilter
                phases={availablePhases}
                selectedPhases={selectedPhases}
                onSelectionChange={setSelectedPhases}
                isDark={isDark}
              />
            )}
            
            <div className="flex gap-2">
              <Button
                variant={timeFrame === 'days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFrame('days')}
              >
                Daily
              </Button>
              <Button
                variant={timeFrame === 'weeks' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFrame('weeks')}
              >
                Weekly
              </Button>
              <Button
                variant={timeFrame === 'months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFrame('months')}
              >
                Monthly
              </Button>
            </div>
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="ml-2"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[370px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              stackOffset="sign"
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#27272a' : '#e5e5e5'}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '11px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '10px' }}
                tickFormatter={formatAxisCurrency}
                opacity={0.6}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Zero baseline reference */}
              <ReferenceLine 
                key="gross-pnl-ref-line"
                y={0} 
                stroke={isDark ? '#52525b' : '#737373'} 
                strokeWidth={2}
              />
              
              {/* Profit bars (green, extending upward from zero) */}
              <Bar 
                key="profit-bar"
                dataKey="profit" 
                fill="#10b981"
                stackId="stack"
              />
              
              {/* Loss bars (red, extending downward from zero) */}
              <Bar 
                key="loss-bar"
                dataKey="loss" 
                fill="#ef4444"
                stackId="stack"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}