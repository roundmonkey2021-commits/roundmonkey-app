import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, calculateDisciplineScore } from "./useDisciplineTrendData";

interface DisciplineScoreTrendProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
}

export function DisciplineScoreTrend({ trades, granularity, range, selectedPhases, isDark }: DisciplineScoreTrendProps) {
  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate discipline scores and moving average
  const data = groupedData.map((group, index, arr) => {
    const score = calculateDisciplineScore(group.trades);

    // Calculate moving average (3-period simple moving average)
    let movingAvg = score;
    if (index >= 2) {
      const prev1 = calculateDisciplineScore(arr[index - 1].trades);
      const prev2 = calculateDisciplineScore(arr[index - 2].trades);
      movingAvg = Number(((score + prev1 + prev2) / 3).toFixed(1));
    } else if (index === 1) {
      const prev1 = calculateDisciplineScore(arr[index - 1].trades);
      movingAvg = Number(((score + prev1) / 2).toFixed(1));
    }

    return {
      date: group.date,
      score,
      movingAvg,
    };
  });

  return (
    <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            Discipline Score Trend
          </h3>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Overall discipline score over time
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                {/* Background zones */}
                <linearGradient id="zoneGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#FEE2E2" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#FEF3C7" stopOpacity={0.3} />
                  <stop offset="70%" stopColor="#FEF3C7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D1FAE5" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3f3f46' : '#e5e7eb'} />
              <XAxis
                dataKey="date"
                tick={{ fill: isDark ? '#a1a1aa' : '#6b7280', fontSize: 12 }}
                stroke={isDark ? '#52525b' : '#d1d5db'}
              />
              <YAxis
                domain={[0, 10]}
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
                dataKey="score"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
              <Line
                type="monotone"
                dataKey="movingAvg"
                stroke="#9333EA"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Moving Average"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Discipline Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-600" style={{ width: '12px', height: '2px', borderTop: '2px dashed #9333EA' }}></div>
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Moving Average
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
