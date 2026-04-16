import { Card, CardContent } from "../ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, hasCompletePlan } from "./useDisciplineTrendData";

interface TradePlanningConsistencyProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
}

export function TradePlanningConsistency({ trades, granularity, range, selectedPhases, isDark }: TradePlanningConsistencyProps) {
  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate planned vs unplanned percentages
  const data = groupedData.map(group => {
    const { trades: periodTrades } = group;
    const totalTrades = periodTrades.length;

    if (totalTrades === 0) {
      return { date: group.date, planned: null, unplanned: null };
    }

    const plannedTrades = periodTrades.filter(t => hasCompletePlan(t)).length;
    const unplannedTrades = totalTrades - plannedTrades;

    return {
      date: group.date,
      planned: Number(((plannedTrades / totalTrades) * 100).toFixed(1)),
      unplanned: Number(((unplannedTrades / totalTrades) * 100).toFixed(1)),
    };
  });

  return (
    <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            Planned vs Unplanned Trades
          </h3>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Percentage of planned trades over time
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="unplannedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 12 }}
                stroke={isDark ? '#52525b' : '#d1d5db'}
              />
              <YAxis
                domain={[0, 100]}
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
              <Area
                type="monotone"
                dataKey="planned"
                stackId="1"
                stroke="#16A34A"
                fill="url(#plannedGradient)"
                name="Planned (%)"
              />
              <Area
                type="monotone"
                dataKey="unplanned"
                stackId="1"
                stroke="#DC2626"
                fill="url(#unplannedGradient)"
                name="Unplanned (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Planned Trades
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Unplanned Trades
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
