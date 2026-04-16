import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Trade } from '../../../hooks/useTrades';
import { calculatePnL } from '../../../utils/tradeCalculations';

interface OverallGrossProfitLossChartProps {
  trades: Trade[];
  isDark: boolean;
  onClose?: () => void;
}

export function OverallGrossProfitLossChart({ trades, isDark, onClose }: OverallGrossProfitLossChartProps) {
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

  // Format full currency for tooltips (no decimals, with commas)
  const formatFullCurrency = (num: number): string => {
    const absNum = Math.abs(num);
    const rounded = Math.round(absNum);
    const intPart = rounded.toString();
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
    
    return (num < 0 ? '-' : '') + result;
  };

  // Get aggregated data - overall totals
  const getAggregatedData = () => {
    if (trades.length === 0) return [];

    // Use calculatePnL() to compute P&L for each trade
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

    return [{
      date: 'Overall',
      profit: totalProfit,
      loss: totalLoss,
      winCount: winningTrades.length,
      lossCount: losingTrades.length,
      netPnL: totalProfit + totalLoss
    }];
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
                Net P&L: {data.netPnL >= 0 ? '+' : ''}₹{formatFullCurrency(data.netPnL >= 0 ? data.netPnL : Math.abs(data.netPnL))}
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
            Overall Gross Profit and Loss
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
    return 'Overall Gross Profit and Loss';
  };

  const getChartDescription = () => {
    return 'Aggregated view: Green bar shows total gross profits, red bar shows total gross losses';
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
                opacity={0.25}
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
                key="overall-pnl-ref-line"
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
                fillOpacity={0.9}
                barSize={100}
              />
              
              {/* Loss bars (red, extending downward from zero) */}
              <Bar 
                key="loss-bar"
                dataKey="loss" 
                fill="#ef4444"
                stackId="stack"
                fillOpacity={0.9}
                barSize={100}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}