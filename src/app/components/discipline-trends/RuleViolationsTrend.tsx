import { Card, CardContent } from "../ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, hasCompletePlan } from "./useDisciplineTrendData";
import { calculatePnL } from "../../utils/tradeCalculations";

interface RuleViolationsTrendProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
  maxDailyLoss: number;
}

export function RuleViolationsTrend({ trades, granularity, range, selectedPhases, isDark, maxDailyLoss }: RuleViolationsTrendProps) {
  const [viewMode, setViewMode] = useState<'count' | 'percentage'>('count');

  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate violation counts
  const data = groupedData.map(group => {
    const { trades: periodTrades } = group;

    // Only use planned trades
    const plannedTrades = periodTrades.filter(t => hasCompletePlan(t));

    if (plannedTrades.length === 0) {
      return {
        date: group.date,
        overtrading: null,
        slModified: null,
        earlyExit: null,
        maxLossBreach: null,
      };
    }

    const overtradingCount = 0; // TODO: Calculate based on max trades per day from settings
    const slModifiedCount = plannedTrades.filter(t => t.slModified === true).length;
    const earlyExitCount = plannedTrades.filter(t => t.earlyExit === true).length;

    // Max loss breach - check daily PnL (only for planned trades)
    let maxLossBreachCount = 0;
    const dailyPnL: { [key: string]: number } = {};
    plannedTrades.forEach(trade => {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      const pnl = calculatePnL(trade);
      if (pnl !== undefined && pnl !== null) {
        dailyPnL[date] = (dailyPnL[date] || 0) + pnl;
      }
    });
    maxLossBreachCount = Object.values(dailyPnL).filter(pnl => pnl < 0 && Math.abs(pnl) > maxDailyLoss).length;

    const baseCount = plannedTrades.length;
    const daysCount = Object.keys(dailyPnL).length;

    return {
      date: group.date,
      overtrading: viewMode === 'count' ? overtradingCount : (baseCount > 0 ? Number(((overtradingCount / baseCount) * 100).toFixed(1)) : 0),
      slModified: viewMode === 'count' ? slModifiedCount : (baseCount > 0 ? Number(((slModifiedCount / baseCount) * 100).toFixed(1)) : 0),
      earlyExit: viewMode === 'count' ? earlyExitCount : (baseCount > 0 ? Number(((earlyExitCount / baseCount) * 100).toFixed(1)) : 0),
      maxLossBreach: viewMode === 'count' ? maxLossBreachCount : (daysCount > 0 ? Number(((maxLossBreachCount / daysCount) * 100).toFixed(1)) : 0),
    };
  });

  return (
    <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Rule Violations Over Time
            </h3>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Track discipline violations across time periods
            </p>
          </div>

          {/* Toggle */}
          <div className={`flex rounded-md overflow-hidden border ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
            <button
              onClick={() => setViewMode('count')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'count'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              Count
            </button>
            <button
              onClick={() => setViewMode('percentage')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'percentage'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              % of Trades
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 12 }}
                stroke={isDark ? '#52525b' : '#d1d5db'}
              />
              <YAxis
                tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 12 }}
                stroke={isDark ? '#52525b' : '#d1d5db'}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#27272a' : '#fff',
                  border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
              <Bar dataKey="overtrading" fill="#F97316" name="Overtrading" radius={[4, 4, 0, 0]} />
              <Bar dataKey="slModified" fill="#DC2626" name="SL Modified" radius={[4, 4, 0, 0]} />
              <Bar dataKey="earlyExit" fill="#EF4444" name="Early Exit" radius={[4, 4, 0, 0]} />
              <Bar dataKey="maxLossBreach" fill="#B91C1C" name="Max Loss Breach" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
