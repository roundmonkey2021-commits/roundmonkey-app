import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, hasCompletePlan } from "./useDisciplineTrendData";
import { calculatePnL } from "../../utils/tradeCalculations";

interface BehavioralDisciplineProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
  maxTradesPerDay: number;
  maxDailyLoss: number;
}

export function BehavioralDiscipline({ trades, granularity, range, selectedPhases, isDark, maxTradesPerDay, maxDailyLoss }: BehavioralDisciplineProps) {
  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate behavioral metrics
  const overtradingData = groupedData.map(group => {
    const { trades: periodTrades } = group;

    if (periodTrades.length === 0) {
      return { date: group.date, tradesPerDay: null };
    }

    // Trades per day - average for the period (ALL trades - planned and unplanned)
    const dailyTradeCount: { [key: string]: number } = {};
    periodTrades.forEach(trade => {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      dailyTradeCount[date] = (dailyTradeCount[date] || 0) + 1;
    });

    const tradingDays = Object.keys(dailyTradeCount).length;
    const avgTradesPerDay = periodTrades.length / tradingDays;

    return {
      date: group.date,
      tradesPerDay: Number(avgTradesPerDay.toFixed(1)),
    };
  });

  // Calculate Daily Loss Discipline data differently for daily vs weekly/monthly
  let dailyLossData: any[] = [];

  if (granularity === 'daily') {
    // DAILY VIEW: Show ONLY breach days as spikes
    const allDates = new Set<string>();
    const plannedTrades = trades.filter(t =>
      hasCompletePlan(t) &&
      (selectedPhases.length === 0 || selectedPhases.includes(t.phaseId))
    );

    // Calculate daily PnL for planned trades
    const dailyPnL: { [key: string]: { loss: number; tradeCount: number } } = {};
    plannedTrades.forEach(trade => {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      const pnl = calculatePnL(trade);
      if (pnl !== undefined && pnl !== null) {
        if (!dailyPnL[date]) {
          dailyPnL[date] = { loss: 0, tradeCount: 0 };
        }
        dailyPnL[date].loss += pnl;
        dailyPnL[date].tradeCount += 1;
      }
    });

    // Filter by range and create breach data
    Object.entries(dailyPnL).forEach(([date, data]) => {
      const isBreach = data.loss < 0 && Math.abs(data.loss) > maxDailyLoss;

      if (isBreach) {
        dailyLossData.push({
          date,
          breachValue: 1,
          dailyLoss: Math.abs(data.loss),
          maxLoss: maxDailyLoss,
          tradeCount: data.tradeCount,
          isBreach: true,
        });
      }
    });

    // Sort by date
    dailyLossData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  } else {
    // WEEKLY/MONTHLY VIEW: Show breach percentage
    dailyLossData = groupedData.map(group => {
      const { trades: periodTrades } = group;
      const plannedTrades = periodTrades.filter(t => hasCompletePlan(t));

      if (plannedTrades.length === 0) {
        return { date: group.date, breachPercent: null };
      }

      const dailyPnL: { [key: string]: number } = {};
      plannedTrades.forEach(trade => {
        const date = new Date(trade.timestamp).toISOString().split('T')[0];
        const pnl = calculatePnL(trade);
        if (pnl !== undefined && pnl !== null) {
          dailyPnL[date] = (dailyPnL[date] || 0) + pnl;
        }
      });

      const daysBreachingMaxLoss = Object.values(dailyPnL).filter(pnl =>
        pnl < 0 && Math.abs(pnl) > maxDailyLoss
      ).length;

      const totalDaysWithTrades = Object.keys(dailyPnL).length;
      const breachPercent = totalDaysWithTrades > 0
        ? Number(((daysBreachingMaxLoss / totalDaysWithTrades) * 100).toFixed(1))
        : null;

      return {
        date: group.date,
        breachPercent,
      };
    });
  }

  const maxTradesThreshold = maxTradesPerDay;

  // Custom tooltip for Daily Loss breach spikes
  const DailyLossTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    if (granularity === 'daily' && data.isBreach) {
      return (
        <div
          className={`p-3 rounded-md shadow-lg border ${
            isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'
          }`}
          style={{ minWidth: '180px' }}
        >
          <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
            {data.date}
          </p>
          <p className={`text-sm font-medium mb-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            Breach: Yes
          </p>
          <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
            Daily Loss: ₹{data.dailyLoss.toFixed(2)}
          </p>
          <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
            Max Allowed: ₹{data.maxLoss.toFixed(2)}
          </p>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Trades: {data.tradeCount}
          </p>
        </div>
      );
    } else if (granularity !== 'daily') {
      return (
        <div
          className={`p-3 rounded-md shadow-lg border ${
            isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'
          }`}
        >
          <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
            {data.date}
          </p>
          <p className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-800'}`}>
            Breach Days: {data.breachPercent}%
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className={`text-xl font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          Behavioural Discipline
        </h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
          Monitor trading frequency and loss management discipline
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
      {/* Overtrading Trend */}
      <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Overtrading Trend
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Average trades per day
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overtradingData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
                  stroke={isDark ? '#52525b' : '#d1d5db'}
                />
                <YAxis
                  domain={[0, 6]}
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
                <ReferenceLine
                  y={maxTradesThreshold}
                  stroke="#DC2626"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{
                    value: `Max (${maxTradesThreshold})`,
                    position: 'right',
                    fill: '#DC2626',
                    fontSize: 11
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tradesPerDay"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#F97316' }}
                  name="Trades per Day"
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Loss Discipline */}
      <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
        <CardContent className="pt-6">
          <div className="mb-4">
            <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Daily Loss Discipline
            </h3>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              {granularity === 'daily' ? 'Days with loss breach (spikes)' : '% days with loss breach'}
            </p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {granularity === 'daily' ? (
                <BarChart data={dailyLossData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
                    stroke={isDark ? '#52525b' : '#d1d5db'}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 11 }}
                    stroke={isDark ? '#52525b' : '#d1d5db'}
                    hide
                  />
                  <Tooltip content={<DailyLossTooltip />} />
                  <Bar
                    dataKey="breachValue"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={4}
                  />
                </BarChart>
              ) : (
                <LineChart data={dailyLossData}>
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
                  <Tooltip content={<DailyLossTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="breachPercent"
                    stroke="#DC2626"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#DC2626' }}
                    name="Breach %"
                    connectNulls={true}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
