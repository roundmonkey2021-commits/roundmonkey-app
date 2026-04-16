import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface EmotionDistributionProps {
  emotions: string[];
  distributionData: any[];
  percentageData: any[];
  heatmapData: any[];
  maxCount: number;
  isDark: boolean;
  getEmotionColor: (emotion: string, index: number) => string;
  getHeatmapColor: (value: number) => string;
  getHeatmapTextColor: (value: number) => string;
}

export function EmotionDistribution({
  emotions,
  distributionData,
  percentageData,
  heatmapData,
  maxCount,
  isDark,
  getEmotionColor,
  getHeatmapColor,
  getHeatmapTextColor
}: EmotionDistributionProps) {
  if (emotions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          Emotion Distribution
        </h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
          How emotions evolve across the trade lifecycle
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: 100% Stacked Bar Chart */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
              Emotion Distribution by Trade Stage
            </CardTitle>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Percentage composition of emotions across trade stages
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={percentageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} />
                  <XAxis 
                    dataKey="stage" 
                    stroke={isDark ? '#71717a' : '#737373'}
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke={isDark ? '#71717a' : '#737373'}
                    label={{ value: 'Percentage of Trades', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
                      borderRadius: '8px',
                      color: isDark ? '#fafafa' : '#09090b'
                    }}
                    formatter={(value: any, name: string, props: any) => {
                      const percentage = Number(value).toFixed(1);
                      // Get stage from the payload
                      const stage = props.payload.stage;
                      // Find the stage index
                      const stageIndex = distributionData.findIndex(d => d.stage === stage);
                      // Get actual count for this emotion at this stage
                      const count = distributionData[stageIndex]?.[name] || 0;
                      return [`${percentage}% (${count} trades)`, name];
                    }}
                    labelFormatter={(label) => `Stage: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                  {emotions.map((emotion, index) => (
                    <Bar 
                      key={`percentage-bar-${emotion}-${index}`}
                      dataKey={emotion} 
                      stackId="a" 
                      fill={getEmotionColor(emotion, index)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Heatmap with Frequency */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
              Emotion Frequency by Trade Stage
            </CardTitle>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Trade count and percentage distribution across stages
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm border-collapse">
                <thead className={`sticky top-0 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                  <tr>
                    <th className={`text-left py-2 px-3 font-medium border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-neutral-200 text-neutral-700'}`}>
                      Emotion
                    </th>
                    <th className={`text-center py-2 px-3 font-medium border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-neutral-200 text-neutral-700'}`}>
                      Entry
                    </th>
                    <th className={`text-center py-2 px-3 font-medium border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-neutral-200 text-neutral-700'}`}>
                      In-Trade
                    </th>
                    <th className={`text-center py-2 px-3 font-medium border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-neutral-200 text-neutral-700'}`}>
                      Exit
                    </th>
                    <th className={`text-center py-2 px-3 font-medium border ${isDark ? 'border-zinc-700 text-zinc-300' : 'border-neutral-200 text-neutral-700'}`}>
                      Post-Exit
                    </th>
                    <th className={`text-center py-2 px-3 font-medium border ${isDark ? 'border-zinc-700 text-zinc-300 bg-zinc-800' : 'border-neutral-200 text-neutral-700 bg-neutral-100'}`}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((row, rowIndex) => (
                    <tr key={`heatmap-row-${rowIndex}`}>
                      <td className={`py-2 px-3 font-medium border capitalize ${isDark ? 'border-zinc-700 text-zinc-200' : 'border-neutral-200 text-neutral-800'}`}>
                        {row.emotion}
                      </td>
                      <td 
                        className={`text-center py-2 px-3 border text-xs`}
                        style={{ 
                          backgroundColor: getHeatmapColor(row.Entry),
                          color: getHeatmapTextColor(row.Entry)
                        }}
                        title={`${row.emotion} at Entry: ${row.Entry} trades (${row.EntryPct.toFixed(0)}% of this emotion's total)`}
                      >
                        <div className="font-semibold">{row.Entry}</div>
                        <div style={{ opacity: 0.7 }}>
                          ({row.EntryPct.toFixed(0)}%)
                        </div>
                      </td>
                      <td 
                        className={`text-center py-2 px-3 border text-xs`}
                        style={{ 
                          backgroundColor: getHeatmapColor(row['In-Trade']),
                          color: getHeatmapTextColor(row['In-Trade'])
                        }}
                        title={`${row.emotion} In-Trade: ${row['In-Trade']} trades (${row.InTradePct.toFixed(0)}% of this emotion's total)`}
                      >
                        <div className="font-semibold">{row['In-Trade']}</div>
                        <div style={{ opacity: 0.7 }}>
                          ({row.InTradePct.toFixed(0)}%)
                        </div>
                      </td>
                      <td 
                        className={`text-center py-2 px-3 border text-xs`}
                        style={{ 
                          backgroundColor: getHeatmapColor(row.Exit),
                          color: getHeatmapTextColor(row.Exit)
                        }}
                        title={`${row.emotion} at Exit: ${row.Exit} trades (${row.ExitPct.toFixed(0)}% of this emotion's total)`}
                      >
                        <div className="font-semibold">{row.Exit}</div>
                        <div style={{ opacity: 0.7 }}>
                          ({row.ExitPct.toFixed(0)}%)
                        </div>
                      </td>
                      <td 
                        className={`text-center py-2 px-3 border text-xs`}
                        style={{ 
                          backgroundColor: getHeatmapColor(row['Post-Exit']),
                          color: getHeatmapTextColor(row['Post-Exit'])
                        }}
                        title={`${row.emotion} Post-Exit: ${row['Post-Exit']} trades (${row.PostExitPct.toFixed(0)}% of this emotion's total)`}
                      >
                        <div className="font-semibold">{row['Post-Exit']}</div>
                        <div style={{ opacity: 0.7 }}>
                          ({row.PostExitPct.toFixed(0)}%)
                        </div>
                      </td>
                      <td 
                        className={`text-center py-2 px-3 border font-bold ${isDark ? 'border-zinc-700 text-zinc-100 bg-zinc-800/50' : 'border-neutral-200 text-neutral-900 bg-neutral-100/50'}`}
                      >
                        {row.Total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}