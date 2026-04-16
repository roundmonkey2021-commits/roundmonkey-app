import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, hasCompletePlan } from "./useDisciplineTrendData";
import { calculatePnL } from "../../utils/tradeCalculations";

interface ExecutionDisciplineTrendsProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
}

export function ExecutionDisciplineTrends({ trades, granularity, range, selectedPhases, isDark }: ExecutionDisciplineTrendsProps) {
  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate execution discipline metrics
  const data = groupedData.map(group => {
    const { trades: periodTrades } = group;

    if (periodTrades.length === 0) {
      return {
        date: group.date,
        targetAchievement: null,
        tradePlanning: null,
      };
    }

    // 1. Target Achievement Consistency - only for planned profitable trades
    const plannedProfitableTrades = periodTrades.filter(t => {
      if (!hasCompletePlan(t)) return false;
      if (!t.entryPremium || !t.exitPremium || !t.action) return false;
      const pnl = calculatePnL(t);
      return pnl !== undefined && pnl !== null && pnl > 0;
    });

    let targetAchievement = null;
    if (plannedProfitableTrades.length > 0) {
      const tradesWithTarget = plannedProfitableTrades.filter(t => t.planExitPrice && t.exitPremium);

      if (tradesWithTarget.length > 0) {
        const tradesHittingTarget = tradesWithTarget.filter(t => {
          if (t.action === 'buy') {
            return t.exitPremium! >= t.planExitPrice!;
          } else if (t.action === 'sell') {
            return t.exitPremium! <= t.planExitPrice!;
          }
          return false;
        });
        targetAchievement = (tradesHittingTarget.length / plannedProfitableTrades.length) * 100;
      }
    }

    // 2. Trade Planning Discipline - % with complete plan
    const plannedTrades = periodTrades.filter(t => hasCompletePlan(t));
    const tradePlanning = (plannedTrades.length / periodTrades.length) * 100;

    return {
      date: group.date,
      targetAchievement: targetAchievement !== null ? Number(targetAchievement.toFixed(1)) : null,
      tradePlanning: Number(tradePlanning.toFixed(1)),
    };
  });

  const chartConfig = {
    height: 280,
    cartesianGrid: { strokeDasharray: "3 3", stroke: isDark ? '#3f3f46' : '#e5e7eb' },
    xAxis: {
      tick: { fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 },
      stroke: isDark ? '#52525b' : '#d1d5db',
    },
    yAxis: {
      domain: [0, 100],
      tick: { fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 },
      stroke: isDark ? '#52525b' : '#d1d5db',
    },
    tooltip: {
      backgroundColor: isDark ? '#27272a' : '#fff',
      border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
      borderRadius: '6px',
      fontSize: '12px',
    },
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          Execution Discipline Trends
        </h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
          Track execution quality and planning consistency over time
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Chart 1: Target Achievement Consistency */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Target Achievement Consistency
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                % of profitable trades that hit target
              </p>
            </div>

            <div style={{ height: chartConfig.height }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid {...chartConfig.cartesianGrid} />
                  <XAxis dataKey="date" {...chartConfig.xAxis} />
                  <YAxis {...chartConfig.yAxis} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartConfig.tooltip.backgroundColor,
                      border: chartConfig.tooltip.border,
                      borderRadius: chartConfig.tooltip.borderRadius,
                      fontSize: chartConfig.tooltip.fontSize,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="targetAchievement"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#16A34A' }}
                    name="Target Achievement (%)"
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Trade Planning Discipline */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Trade Planning Discipline
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                % of trades with complete plan
              </p>
            </div>

            <div style={{ height: chartConfig.height }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid {...chartConfig.cartesianGrid} />
                  <XAxis dataKey="date" {...chartConfig.xAxis} />
                  <YAxis {...chartConfig.yAxis} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartConfig.tooltip.backgroundColor,
                      border: chartConfig.tooltip.border,
                      borderRadius: chartConfig.tooltip.borderRadius,
                      fontSize: chartConfig.tooltip.fontSize,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tradePlanning"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#2563EB' }}
                    name="Trade Planning (%)"
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
