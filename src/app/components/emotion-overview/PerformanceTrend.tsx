import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Trade } from "../../hooks/useTrades";

interface PerformanceTrendProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
}

type EmotionPhase = 'entry' | 'inTrade' | 'exit' | 'postExit';

const EMOTION_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function PerformanceTrend({ trades, granularity, range, selectedPhases, isDark }: PerformanceTrendProps) {
  const [emotionPhase, setEmotionPhase] = useState<EmotionPhase>('entry');

  const chartData = useMemo(() => {
    // Trades are already filtered to closed trades by parent component
    let filteredTrades = trades;

    // Filter trades that have valid exit dates
    filteredTrades = filteredTrades.filter(t => t.exitDate && t.exitDate !== '');

    if (filteredTrades.length === 0) return { data: [], emotions: [] };

    // Get emotion field name
    const emotionField = `${emotionPhase}Emotion` as keyof Trade;

    // Extract unique emotions
    const emotionSet = new Set<string>();
    filteredTrades.forEach(t => {
      const emotion = t[emotionField];
      if (emotion && typeof emotion === 'string') {
        emotionSet.add(emotion);
      }
    });
    const emotions = Array.from(emotionSet).sort();

    // Find latest trade date (based on exit date)
    const dates = filteredTrades.map(t => new Date(t.exitDate!).getTime());
    const latestDate = new Date(Math.max(...dates));

    // Calculate start date
    let startDate = new Date(latestDate);
    const rangeMatch = range.match(/^Last (\d+)$/);
    if (rangeMatch) {
      const count = parseInt(rangeMatch[1]);
      if (granularity === 'daily') {
        startDate.setDate(latestDate.getDate() - count);
      } else if (granularity === 'weekly') {
        startDate.setDate(latestDate.getDate() - (count * 7));
      } else {
        startDate.setMonth(latestDate.getMonth() - count);
      }
    } else {
      startDate = new Date(Math.min(...dates));
    }

    // Group by period (based on exit date)
    const periodMap = new Map();
    filteredTrades.forEach(trade => {
      const date = new Date(trade.exitDate!);
      if (date < startDate) return;

      let key: string;
      if (granularity === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (granularity === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!periodMap.has(key)) {
        periodMap.set(key, []);
      }
      periodMap.get(key).push(trade);
    });

    // Build data points
    const dataPoints = [];
    for (const [periodKey, periodTrades] of periodMap.entries()) {
      let label: string;
      if (granularity === 'daily') {
        const d = new Date(periodKey);
        label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else if (granularity === 'weekly') {
        const d = new Date(periodKey);
        label = `W ${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      } else {
        const [year, month] = periodKey.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1);
        label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }

      const point: any = { period: label, _sortKey: periodKey };

      emotions.forEach(emotion => {
        point[emotion] = periodTrades.filter((t: Trade) => t[emotionField] === emotion).length;
      });

      dataPoints.push(point);
    }

    dataPoints.sort((a, b) => a._sortKey.localeCompare(b._sortKey));

    return { data: dataPoints, emotions };
  }, [trades, granularity, range, selectedPhases, emotionPhase]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className={`rounded-lg border p-3 shadow-lg ${
        isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'
      }`}>
        <p className={`text-sm font-medium mb-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
          {label}
        </p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
            <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={`rounded-lg border p-6 ${
      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
          Emotion Trends
        </h2>
        <div>
          <label className={`text-xs font-medium mr-2 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Phase
          </label>
          <select
            value={emotionPhase}
            onChange={(e) => setEmotionPhase(e.target.value as EmotionPhase)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
              isDark
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-white text-neutral-900 border-neutral-300'
            }`}
          >
            <option value="entry">Entry</option>
            <option value="inTrade">In-Trade</option>
            <option value="exit">Exit</option>
            <option value="postExit">Post-Exit</option>
          </select>
        </div>
      </div>

      {chartData.data.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} vertical={false} />
            <XAxis dataKey="period" stroke={isDark ? '#71717a' : '#a3a3a3'} tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis stroke={isDark ? '#71717a' : '#a3a3a3'} tick={{ fontSize: 12 }} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
            {chartData.emotions.map((emotion, i) => (
              <Line
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stroke={EMOTION_COLORS[i % EMOTION_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
              No data available
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
              Adjust your filters or add emotions to trades
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
