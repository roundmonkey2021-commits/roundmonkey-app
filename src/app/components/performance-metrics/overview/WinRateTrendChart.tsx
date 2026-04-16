import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Trade } from '../../../types/trade';
import { calculatePnL } from '../../../utils/tradeCalculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface WinRateTrendChartProps {
  trades: Trade[];
  isDark: boolean;
}

export function WinRateTrendChart({ trades, isDark }: WinRateTrendChartProps) {
  const [timeFrame, setTimeFrame] = useState<'days' | 'weeks' | 'months'>('days');

  const formatIndianCurrency = (num: number): string => {
    const absNum = Math.abs(num);
    const rounded = Math.round(absNum * 100) / 100;
    const [intPart, decPart] = rounded.toFixed(2).split('.');
    const len = intPart.length;
    
    let result = '';
    if (len <= 3) {
      result = intPart;
    } else {
      result = intPart.slice(-3);
      let remaining = intPart.slice(0, -3);
      
      while (remaining.length > 0) {
        if (remaining.length <= 2) {
          result = remaining + ',' + result;
          break;
        } else {
          result = remaining.slice(-2) + ',' + result;
          remaining = remaining.slice(0, -2);
        }
      }
    }
    
    return (num < 0 ? '-' : '') + result + '.' + decPart;
  };

  const closedTrades = trades.filter(t => t.exitPremium !== undefined && t.exitPremium !== null);

  const getLineChartData = () => {
    if (closedTrades.length === 0) return [];

    type TradesByPeriod = { [key: string]: typeof closedTrades };
    const tradesByPeriod: TradesByPeriod = {};
    const periodDates: { [key: string]: Date } = {}; // Track the actual date for each period

    closedTrades.forEach(trade => {
      const exitDate = new Date(trade.exitDate!);
      let periodKey: string;

      if (timeFrame === 'days') {
        periodKey = exitDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      } else if (timeFrame === 'weeks') {
        const weekStart = new Date(exitDate);
        weekStart.setDate(exitDate.getDate() - exitDate.getDay());
        periodKey = weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      } else {
        periodKey = exitDate.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
      }

      if (!tradesByPeriod[periodKey]) {
        tradesByPeriod[periodKey] = [];
        periodDates[periodKey] = exitDate; // Store the first occurrence date
      }
      tradesByPeriod[periodKey].push(trade);
    });

    return Object.entries(tradesByPeriod)
      .map(([period, trades]) => {
        const winningTrades = trades.filter(t => {
          const pnl = calculatePnL(t);
          return pnl > 0;
        });

        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        
        const totalPnl = trades.reduce((sum, t) => {
          const pnl = calculatePnL(t);
          return sum + pnl;
        }, 0);

        return {
          period,
          winRate: Math.round(winRate * 10) / 10,
          trades: trades.length,
          pnl: totalPnl,
          sortDate: periodDates[period], // Include the actual date for sorting
        };
      })
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
  };

  const lineChartData = getLineChartData();

  // Calculate tick interval based on number of data points to avoid clutter
  const getXAxisInterval = () => {
    const dataLength = lineChartData.length;
    if (dataLength <= 7) return 0; // Show all labels
    if (dataLength <= 14) return 1; // Show every other label
    if (dataLength <= 30) return Math.floor(dataLength / 7); // Show ~7 labels
    return Math.floor(dataLength / 10); // Show ~10 labels max
  };

  return (
    <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} h-[450px] flex flex-col`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
              Win Rate Trend
            </CardTitle>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mt-1`}>
              Win percentage over time
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeFrame === 'days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame('days')}
              className="text-xs"
            >
              Daily
            </Button>
            <Button
              variant={timeFrame === 'weeks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame('weeks')}
              className="text-xs"
            >
              Weekly
            </Button>
            <Button
              variant={timeFrame === 'months' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFrame('months')}
              className="text-xs"
            >
              Monthly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {lineChartData.length > 0 ? (
          <div className="space-y-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart 
                  data={lineChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#27272a' : '#e5e5e5'}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="period" 
                    stroke={isDark ? '#71717a' : '#737373'}
                    style={{ fontSize: '11px' }}
                    interval={getXAxisInterval()}
                  />
                  <YAxis 
                    stroke={isDark ? '#71717a' : '#737373'}
                    style={{ fontSize: '10px' }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                    opacity={0.6}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
                      borderRadius: '8px',
                      color: isDark ? '#fafafa' : '#09090b'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'winRate') return [`${value}%`, 'Win Rate'];
                      if (name === 'trades') return [value, 'Trades'];
                      if (name === 'pnl') return [`₹${formatIndianCurrency(value)}`, 'P&L'];
                      return [value, name];
                    }}
                  />
                  {/* 50% baseline reference - stronger than grid */}
                  <ReferenceLine 
                    y={50} 
                    stroke={isDark ? '#52525b' : '#737373'} 
                    strokeWidth={2}
                  />
                  {/* Bars with neutral color and reduced opacity */}
                  <Bar 
                    dataKey="winRate" 
                    fill={isDark ? '#64748b' : '#94a3b8'}
                    fillOpacity={0.9}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-[350px] flex items-center justify-center">
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              No closed trades to display. Start logging your trades to see win rate trends.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}