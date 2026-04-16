import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, hasCompletePlan } from "./useDisciplineTrendData";

interface DisciplineComponentBreakdownProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
}

export function DisciplineComponentBreakdown({ trades, granularity, range, selectedPhases, isDark }: DisciplineComponentBreakdownProps) {
  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate component scores
  const data = groupedData.map(group => {
    const { trades: periodTrades } = group;
    if (periodTrades.length === 0) {
      return { date: group.date, risk: 0, execution: 0, behavior: 0 };
    }

    // Risk Management Score (SL adherence + position sizing)
    const slNotModified = periodTrades.filter(t => !t.slModified).length;
    const positionSizingOk = periodTrades.filter(t => {
      if (!t.lotSize || !t.allowedLotSize) return true;
      return t.lotSize <= t.allowedLotSize;
    }).length;
    const riskScore = ((slNotModified + positionSizingOk) / (periodTrades.length * 2)) * 100;

    // Execution Quality Score (target achievement + trade planning)
    const plannedTrades = periodTrades.filter(t => hasCompletePlan(t)).length;
    const notEarlyExit = periodTrades.filter(t => !t.earlyExit).length;
    const executionScore = ((plannedTrades + notEarlyExit) / (periodTrades.length * 2)) * 100;

    // Behavioral Discipline Score (overtrading + daily loss)
    // For behavioral, we'll use a simple metric based on early exit and plan adherence
    const notEarlyExitCount = periodTrades.filter(t => !t.earlyExit).length;
    const plannedCount = periodTrades.filter(t => hasCompletePlan(t)).length;
    const behaviorScore = ((notEarlyExitCount + plannedCount) / (periodTrades.length * 2)) * 100;

    return {
      date: group.date,
      risk: Number(riskScore.toFixed(1)),
      execution: Number(executionScore.toFixed(1)),
      behavior: Number(behaviorScore.toFixed(1)),
    };
  });

  return (
    <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            Discipline Components
          </h3>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Breakdown of discipline scores by category
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
              <Legend
                wrapperStyle={{
                  paddingTop: '20px'
                }}
              />
              <Line
                type="monotone"
                dataKey="risk"
                stroke="#16A34A"
                strokeWidth={2}
                name="Risk Management"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="execution"
                stroke="#2563EB"
                strokeWidth={2}
                name="Execution Quality"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="behavior"
                stroke="#F97316"
                strokeWidth={2}
                name="Behavioral Discipline"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
