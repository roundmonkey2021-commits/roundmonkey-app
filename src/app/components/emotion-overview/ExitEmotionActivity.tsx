import { useMemo, useState, useRef, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { PsychologyTag } from "../../hooks/useSettings";
import { ChevronDown } from "lucide-react";

interface ExitEmotionActivityProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
  emotionalStates: PsychologyTag[];
}

const EMOTION_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#a855f7', '#f43f5e'
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
      <p className="text-zinc-200 text-sm font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-zinc-300">{entry.name}:</span>
          <span className="text-zinc-100 font-medium">{entry.value} trades</span>
        </div>
      ))}
    </div>
  );
}

export function ExitEmotionActivity({
  trades,
  granularity,
  range,
  selectedPhases,
  isDark,
  emotionalStates
}: ExitEmotionActivityProps) {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [showEmotionDropdown, setShowEmotionDropdown] = useState(false);
  const emotionDropdownRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emotionDropdownRef.current && !emotionDropdownRef.current.contains(event.target as Node)) {
        setShowEmotionDropdown(false);
      }
    };

    if (showEmotionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmotionDropdown]);

  const chartData = useMemo(() => {
    let filteredTrades = trades;

    filteredTrades = filteredTrades.filter(t => t.exitDate && t.exitDate !== '');

    if (selectedPhases.length > 0) {
      filteredTrades = filteredTrades.filter(t => t.phase && selectedPhases.includes(t.phase));
    }

    if (filteredTrades.length === 0) {
      return { data: [], emotions: [], allEmotions: [] };
    }

    const emotionSet = new Set<string>();
    filteredTrades.forEach(t => {
      const emotion = t.exitEmotions;
      if (emotion && typeof emotion === 'string') {
        emotionSet.add(emotion);
      }
    });

    const emotions = Array.from(emotionSet).sort();
    const displayEmotions = emotions.filter(e => selectedEmotions.includes(e));

    const dates = filteredTrades.map(t => new Date(t.exitDate!).getTime());
    const latestDate = new Date(Math.max(...dates));

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

    const periodMap = new Map();
    filteredTrades.forEach(trade => {
      const date = new Date(trade.exitDate!);

      if (isNaN(date.getTime())) {
        return;
      }

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

    const dataPoints = [];
    for (const [periodKey, periodTrades] of periodMap.entries()) {
      let label: string;
      if (granularity === 'daily') {
        const d = new Date(periodKey);
        if (isNaN(d.getTime())) continue;
        label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else if (granularity === 'weekly') {
        const d = new Date(periodKey);
        if (isNaN(d.getTime())) continue;
        label = `W ${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      } else {
        const [year, month] = periodKey.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        if (isNaN(d.getTime())) continue;
        label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }

      const point: any = { period: label, _sortKey: periodKey };

      displayEmotions.forEach(emotion => {
        point[emotion] = periodTrades.filter((t: Trade) => t.exitEmotions === emotion).length;
      });

      dataPoints.push(point);
    }

    dataPoints.sort((a, b) => a._sortKey.localeCompare(b._sortKey));

    return { data: dataPoints, emotions: displayEmotions, allEmotions: emotions };
  }, [trades, granularity, range, selectedPhases, emotionalStates, selectedEmotions]);

  useEffect(() => {
    if (!isInitialized.current && chartData.allEmotions && chartData.allEmotions.length > 0) {
      setSelectedEmotions(chartData.allEmotions);
      isInitialized.current = true;
    }
  }, [chartData.allEmotions]);

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const selectAllEmotions = () => {
    if (chartData.allEmotions) {
      setSelectedEmotions(chartData.allEmotions);
    }
  };

  const clearAllEmotions = () => {
    setSelectedEmotions([]);
  };

  const handleLegendClick = (emotion: string) => {
    toggleEmotion(emotion);
  };

  const granularityLabel = granularity.charAt(0).toUpperCase() + granularity.slice(1);

  return (
    <div className={`rounded-lg border p-6 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}`}>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
              Exit Emotion Activity — {granularityLabel}
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
              Number of trades over time grouped by Exit emotion
            </p>
          </div>

          {chartData.allEmotions && chartData.allEmotions.length > 0 && (
            <div className="relative" ref={emotionDropdownRef}>
              <button
                onClick={() => setShowEmotionDropdown(!showEmotionDropdown)}
                className={`min-w-[160px] px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between gap-2 ${
                  isDark
                    ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-750'
                    : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
                } border transition-colors`}
              >
                <span className="truncate">
                  {selectedEmotions.length === 0
                    ? 'No emotions'
                    : selectedEmotions.length === chartData.allEmotions.length
                    ? 'All Emotions'
                    : `${selectedEmotions.length} selected`}
                </span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showEmotionDropdown && (
                <div
                  className={`absolute right-0 mt-1 w-64 rounded-md shadow-lg z-50 border max-h-96 overflow-y-auto ${
                    isDark
                      ? 'bg-zinc-800 border-zinc-700'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  <div className="p-2">
                    <div className={`flex gap-2 mb-2 pb-2 border-b ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
                      <button
                        onClick={selectAllEmotions}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
                          isDark
                            ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllEmotions}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded ${
                          isDark
                            ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Clear
                      </button>
                    </div>

                    {chartData.allEmotions.map((emotion, index) => (
                      <label
                        key={emotion}
                        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded hover:bg-opacity-10 ${
                          isDark ? 'hover:bg-white' : 'hover:bg-black'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmotions.includes(emotion)}
                          onChange={() => toggleEmotion(emotion)}
                          className="w-4 h-4 rounded"
                        />
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: EMOTION_COLORS[index % EMOTION_COLORS.length] }}
                        />
                        <span className={`text-sm ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                          {emotion}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {chartData.data.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} vertical={false} />
            <XAxis
              dataKey="period"
              stroke={isDark ? '#71717a' : '#a3a3a3'}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              stroke={isDark ? '#71717a' : '#a3a3a3'}
              tick={{ fontSize: 12 }}
              tickLine={false}
              allowDecimals={false}
              label={{
                value: 'Number of Trades',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12, fill: isDark ? '#71717a' : '#a3a3a3' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
              onClick={(e) => handleLegendClick(e.value)}
              formatter={(value: string) => (
                <span style={{
                  textDecoration: !selectedEmotions.includes(value) ? 'line-through' : 'none',
                  color: !selectedEmotions.includes(value) ? '#71717a' : 'inherit',
                  cursor: 'pointer'
                }}>
                  {value}
                </span>
              )}
            />
            {chartData.emotions.map((emotion, i) => (
              <Line
                key={emotion}
                type="monotone"
                dataKey={emotion}
                stroke={EMOTION_COLORS[chartData.allEmotions?.indexOf(emotion) ?? i % EMOTION_COLORS.length]}
                strokeWidth={1.5}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[350px]">
          <div className="text-center">
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>No data available</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
              Adjust your filters or add exit emotions to trades
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
