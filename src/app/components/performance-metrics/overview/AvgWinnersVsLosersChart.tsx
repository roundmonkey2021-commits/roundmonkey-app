import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Trade } from '../../../hooks/useTrades';
import { calculatePnL } from '../../../utils/tradeCalculations';

interface AvgWinnersVsLosersChartProps {
  trades: Trade[];
  isDark: boolean;
}

export function AvgWinnersVsLosersChart({ trades, isDark }: AvgWinnersVsLosersChartProps) {
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

  // Calculate overall averages
  const getOverallData = () => {
    if (trades.length === 0) return [];

    const winningTrades = trades.filter(t => {
      const pnl = calculatePnL(t);
      return pnl > 0;
    });
    const losingTrades = trades.filter(t => {
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
    
    const avgProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    return [{
      category: 'Overall',
      profit: avgProfit,
      loss: avgLoss,
      totalProfit: totalProfit,
      totalLoss: totalLoss,
      winCount: winningTrades.length,
      lossCount: losingTrades.length,
      netPnL: totalProfit + totalLoss
    }];
  };

  const chartData = getOverallData();

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
            Overall Performance
          </p>
          <div className="space-y-1">
            <p className="text-emerald-500 text-sm font-medium">
              Avg Profit per Trade: +₹{formatIndianCurrency(data.profit)}
            </p>
            <p className="text-emerald-500 text-xs opacity-70">
              ({data.winCount} winning trade{data.winCount !== 1 ? 's' : ''} • Total: +₹{formatIndianCurrency(data.totalProfit)})
            </p>
            <p className="text-red-500 text-sm font-medium mt-2">
              Avg Loss per Trade: -₹{formatIndianCurrency(Math.abs(data.loss))}
            </p>
            <p className="text-red-500 text-xs opacity-70">
              ({data.lossCount} losing trade{data.lossCount !== 1 ? 's' : ''} • Total: -₹{formatIndianCurrency(Math.abs(data.totalLoss))})
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
            Avg Winners vs Avg Losers
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
    <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} h-[450px] flex flex-col`}>
      <CardHeader>
        <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
          Avg Winners vs Avg Losers
        </CardTitle>
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
                opacity={0.25}
              />
              <XAxis 
                dataKey="category" 
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '12px' }}
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
                key="avg-winners-losers-ref-line"
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
                barSize={100}
                fillOpacity={0.9}
              />
              
              {/* Loss bars (red, extending downward from zero) */}
              <Bar 
                key="loss-bar"
                dataKey="loss" 
                fill="#ef4444"
                stackId="stack"
                barSize={100}
                fillOpacity={0.9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}