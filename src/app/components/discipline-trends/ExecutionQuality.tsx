import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, hasCompletePlan } from "./useDisciplineTrendData";
import { calculatePnL } from "../../utils/tradeCalculations";

interface ExecutionQualityProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
}

export function ExecutionQuality({ trades, granularity, range, selectedPhases, isDark }: ExecutionQualityProps) {
  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate execution quality metrics
  const data = groupedData.map(group => {
    const { trades: periodTrades } = group;

    // Only use planned trades
    const plannedTrades = periodTrades.filter(t => hasCompletePlan(t));

    if (plannedTrades.length === 0) {
      return { date: group.date, targetHitRate: null, slRespectRate: null };
    }

    // Target Hit Rate - for planned profitable trades with target data
    const profitableTrades = plannedTrades.filter(t => {
      if (!t.entryPremium || !t.exitPremium || !t.action) return false;
      const pnl = calculatePnL(t);
      return pnl !== undefined && pnl !== null && pnl > 0;
    });

    let targetHitRate = null;
    if (profitableTrades.length > 0) {
      const tradesWithTarget = profitableTrades.filter(t => t.planExitPrice && t.exitPremium);

      if (tradesWithTarget.length > 0) {
        const tradesAchievingTarget = tradesWithTarget.filter(t => {
          if (t.action === 'buy') {
            return t.exitPremium! >= t.planExitPrice!;
          } else if (t.action === 'sell') {
            return t.exitPremium! <= t.planExitPrice!;
          }
          return false;
        });
        targetHitRate = (tradesAchievingTarget.length / tradesWithTarget.length) * 100;
      }
    }

    // SL Respect Rate - planned trades where SL was not modified
    const slNotModified = plannedTrades.filter(t => t.slModified === false || t.slModified === undefined).length;
    const slRespectRate = (slNotModified / plannedTrades.length) * 100;

    return {
      date: group.date,
      targetHitRate: targetHitRate !== null ? Number(targetHitRate.toFixed(1)) : null,
      slRespectRate: Number(slRespectRate.toFixed(1)),
    };
  });

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Target Hit Rate */}
      <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Target Hit Rate
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              % of trades hitting target
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
                  stroke={isDark ? '#52525b' : '#d1d5db'}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
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
                <Line
                  type="monotone"
                  dataKey="targetHitRate"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#16A34A' }}
                  name="Target Hit Rate (%)"
                  connectNulls={true}
                />
                {/* Reference line at 85% */}
                <Line
                  type="monotone"
                  data={data.map(d => ({ ...d, threshold: 85 }))}
                  dataKey="threshold"
                  stroke="#9CA3AF"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target (85%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stop Loss Respect Rate */}
      <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Stop Loss Respect Rate
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              % of trades respecting SL
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
                  stroke={isDark ? '#52525b' : '#d1d5db'}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
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
                <Line
                  type="monotone"
                  dataKey="slRespectRate"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#2563EB' }}
                  name="SL Respect Rate (%)"
                  connectNulls={true}
                />
                {/* Reference line at 85% */}
                <Line
                  type="monotone"
                  data={data.map(d => ({ ...d, threshold: 85 }))}
                  dataKey="threshold"
                  stroke="#9CA3AF"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target (85%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
