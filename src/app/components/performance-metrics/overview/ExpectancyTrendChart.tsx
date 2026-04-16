import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Trade } from '../../../hooks/useTrades';
import { calculatePnL } from '../../../utils/tradeCalculations';

interface ExpectancyTrendChartProps {
  trades: Trade[];
  isDark: boolean;
}

export function ExpectancyTrendChart({ trades, isDark }: ExpectancyTrendChartProps) {
  const [timeFrame, setTimeFrame] = useState<'weeks' | 'months'>('weeks');

  // Format currency for Indian numbering system
  const formatIndianCurrency = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 10000000) {
      return `${(absValue / 10000000).toFixed(2)}Cr`;
    } else if (absValue >= 100000) {
      return `${(absValue / 100000).toFixed(2)}L`;
    } else if (absValue >= 1000) {
      return `${(absValue / 1000).toFixed(2)}K`;
    }
    return absValue.toFixed(0);
  };

  const formatAxisCurrency = (value: number): string => {
    if (value === 0) return '0';
    const absValue = Math.abs(value);
    if (absValue >= 100000) {
      return `${value < 0 ? '-' : ''}${(absValue / 100000).toFixed(1)}L`;
    } else if (absValue >= 1000) {
      return `${value < 0 ? '-' : ''}${(absValue / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const getChartData = () => {
    const tradesByPeriod: { [key: string]: typeof trades } = {};
    const periodDates: { [key: string]: Date } = {}; // Track actual date for sorting
    
    trades.forEach(trade => {
      const exitDate = new Date(trade.exitDate!);
      let periodKey: string;
      
      if (timeFrame === 'weeks') {
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
      .map(([period, periodTrades]) => {
        const totalPnL = periodTrades.reduce((sum, t) => {
          const pnl = calculatePnL(t);
          return sum + pnl;
        }, 0);
        
        const expectancyValue = totalPnL / periodTrades.length;
        
        return {
          period,
          expectancy: expectancyValue,
          trades: periodTrades.length,
          totalPnL: totalPnL,
          sortDate: periodDates[period] // Include for sorting
        };
      })
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
  };

  const chartData = getChartData();

  if (trades.length === 0) {
    return (
      <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
            Expectancy Trend Per Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={isDark ? 'text-zinc-500' : 'text-neutral-500'}>
            No trading data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
              Expectancy Trend Per Trade
            </CardTitle>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mt-1`}>
              Average expected return per trade over time
            </p>
          </div>
          <div className="flex gap-2">
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
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="expectancyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isDark ? '#64748b' : '#94a3b8'} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={isDark ? '#64748b' : '#94a3b8'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDark ? '#27272a' : '#e5e5e5'} 
                vertical={false}
              />
              <XAxis 
                dataKey="period" 
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '10px' }}
                tickFormatter={formatAxisCurrency}
                opacity={0.6}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
                  borderRadius: '8px',
                  color: isDark ? '#fafafa' : '#09090b'
                }}
                formatter={(value: any, name: string, props: any) => {
                  if (name === 'expectancy') {
                    const expectancyValue = `${value >= 0 ? '+' : ''}₹${formatIndianCurrency(value)}`;
                    const tradesText = `${props.payload.trades} ${props.payload.trades === 1 ? 'trade' : 'trades'}`;
                    const pnlText = `Total P&L: ${props.payload.totalPnL >= 0 ? '+' : ''}₹${formatIndianCurrency(props.payload.totalPnL)}`;
                    return [expectancyValue + ' • ' + tradesText + ' • ' + pnlText, 'Expectancy Per Trade'];
                  }
                  return [value, name];
                }}
              />
              {/* Zero baseline reference - stronger than grid */}
              <ReferenceLine 
                y={0} 
                stroke={isDark ? '#52525b' : '#737373'} 
                strokeWidth={2}
              />
              {/* Area fill under line */}
              <Area
                type="monotoneX"
                dataKey="expectancy"
                stroke="none"
                fill="url(#expectancyGradient)"
              />
              {/* Line with subtle, desaturated color */}
              <Line 
                type="monotoneX" 
                dataKey="expectancy" 
                stroke={isDark ? '#64748b' : '#94a3b8'}
                strokeWidth={1.5}
                dot={{ r: 3, fill: isDark ? '#64748b' : '#94a3b8' }}
                activeDot={{ r: 5, fill: isDark ? '#64748b' : '#94a3b8' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}