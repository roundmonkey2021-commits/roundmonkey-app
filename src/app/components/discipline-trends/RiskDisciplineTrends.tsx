import { Card, CardContent } from "../ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trade } from "../../hooks/useTrades";
import { useDisciplineTrendData, hasCompletePlan } from "./useDisciplineTrendData";
import { AlertTriangle } from "lucide-react";

interface RiskDisciplineTrendsProps {
  trades: Trade[];
  granularity: 'daily' | 'weekly' | 'monthly';
  range: string;
  selectedPhases: string[];
  isDark: boolean;
}

// Custom tooltip for SL Adherence with enhanced context
const SLAdherenceTooltip = ({ active, payload, isDark }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div
      className={`p-3 rounded-md shadow-lg border ${
        isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'
      }`}
      style={{ minWidth: '220px' }}
    >
      <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
        {data.date}
      </p>
      <p className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-neutral-800'}`}>
        SL Adherence: <span className="text-green-600">{data.slAdherence}%</span>
      </p>

      {data.slModified && (
        <div className="mt-3 pt-3 border-t border-zinc-600">
          <div className="flex items-center gap-1 mb-2">
            <AlertTriangle className="size-3 text-orange-600" />
            <p className={`text-xs font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
              SL Modified: Yes ({data.slModifiedCount} trades)
            </p>
          </div>

          {data.slModReasons && data.slModReasons.length > 0 && (
            <div className="mb-2">
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                Top Reasons:
              </p>
              {data.slModReasons.map((r: any, i: number) => (
                <p key={i} className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                  • {r.reason} ({r.count})
                </p>
              ))}
            </div>
          )}

          {data.trailingSLPercent > 0 && (
            <p className={`text-xs mb-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Trailing SL: {data.trailingSLPercent}%
            </p>
          )}

          {data.inTradeEmotions && data.inTradeEmotions.length > 0 && (
            <div>
              <p className={`text-xs font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                In-Trade Emotions:
              </p>
              {data.inTradeEmotions.map((e: any, i: number) => (
                <p key={i} className={`text-xs ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                  • {e.emotion} ({e.count})
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Custom dot for SL Adherence - red marker when SL was modified
const SLAdherenceDot = (props: any) => {
  const { cx, cy, payload } = props;

  // Don't render dot for null/undefined values
  if (payload.slAdherence === null || payload.slAdherence === undefined) {
    return null;
  }

  if (payload.slModified) {
    return (
      <g>
        {/* Regular green dot */}
        <circle cx={cx} cy={cy} r={4} fill="#16A34A" />
        {/* Red warning dot on top */}
        <circle cx={cx} cy={cy} r={6} fill="none" stroke="#DC2626" strokeWidth={2} />
      </g>
    );
  }

  return <circle cx={cx} cy={cy} r={4} fill="#16A34A" />;
};

export function RiskDisciplineTrends({ trades, granularity, range, selectedPhases, isDark }: RiskDisciplineTrendsProps) {
  // Get grouped trade data
  const groupedData = useDisciplineTrendData(trades, granularity, range, selectedPhases);

  // Calculate risk discipline metrics
  const data = groupedData.map(group => {
    const { trades: periodTrades } = group;

    // Only use planned trades
    const plannedTrades = periodTrades.filter(t => hasCompletePlan(t));

    // If no planned trades, return null for all metrics
    if (plannedTrades.length === 0) {
      return {
        date: group.date,
        slAdherence: null,
        positionSizing: null,
        riskReward: null,
        strikeDiscipline: null,
      };
    }

    // 1. Stop Loss Adherence - % where SL was NOT modified
    const slNotModified = plannedTrades.filter(t => t.slModified === false || t.slModified === undefined).length;
    const slAdherence = (slNotModified / plannedTrades.length) * 100;

    // SL Modification details for tooltip
    const slModifiedTrades = plannedTrades.filter(t => t.slModified === true);
    const slModifiedCount = slModifiedTrades.length;
    const hasSlModified = slModifiedCount > 0;

    // Aggregate SL modification reasons
    const slModReasons = slModifiedTrades.reduce((acc, t) => {
      if (t.slModificationReason) {
        acc[t.slModificationReason] = (acc[t.slModificationReason] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    const topSlReasons = Object.entries(slModReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));

    // Trailing SL usage
    const trailingSLCount = slModifiedTrades.filter(t => t.isTrailingSL === true).length;
    const trailingSLPercent = slModifiedCount > 0 ? (trailingSLCount / slModifiedCount) * 100 : 0;

    // In-trade emotions
    const inTradeEmotions = slModifiedTrades.reduce((acc, t) => {
      if (t.inTradeEmotions) {
        acc[t.inTradeEmotions] = (acc[t.inTradeEmotions] || 0) + 1;
      }
      return acc;
    }, {} as { [key: string]: number });

    const topInTradeEmotions = Object.entries(inTradeEmotions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));

    // 2. Position Sizing Discipline - % within allowed lot size
    const withinLotSize = plannedTrades.filter(t => {
      if (!t.lotSize || !t.allowedLotSize) return true; // Count as compliant if not specified
      return t.lotSize <= t.allowedLotSize;
    }).length;
    const positionSizing = (withinLotSize / plannedTrades.length) * 100;

    // 3. Risk-Reward Adherence - % with R:R >= 1:3
    const tradesWithRRData = plannedTrades.filter(t =>
      t.planEntryPrice && t.planExitPrice && t.planStopLoss
    );

    let riskReward = null;
    if (tradesWithRRData.length > 0) {
      const meetingRR = tradesWithRRData.filter(t => {
        const risk = Math.abs(t.planEntryPrice! - t.planStopLoss!);
        const reward = Math.abs(t.planExitPrice! - t.planEntryPrice!);

        if (risk === 0) return false;
        const rr = reward / risk;

        return rr >= 3;
      }).length;
      riskReward = (meetingRR / tradesWithRRData.length) * 100;
    }

    // 4. Strike Discipline - % with ITM/ATM strikes
    const calculateMoneyness = (trade: Trade): string => {
      if (!trade.symbolPrice || !trade.strikePrice) return "N/A";

      const spotPrice = trade.symbolPrice;
      const strikePrice = trade.strikePrice;
      const diff = Math.abs(spotPrice - strikePrice);
      const percentDiff = (diff / spotPrice) * 100;

      if (percentDiff <= 2) return "ATM";

      // Moneyness is the same for both buy and sell
      if (trade.optionType === 'call') {
        return strikePrice < spotPrice ? "ITM" : "OTM";
      } else if (trade.optionType === 'put') {
        return strikePrice > spotPrice ? "ITM" : "OTM";
      }

      return "N/A";
    };

    // 4. Strike Discipline - only for planned trades with required data
    const tradesWithStrikeData = plannedTrades.filter(t =>
      t.symbolPrice && t.strikePrice && t.optionType && t.action
    );

    let strikeDiscipline = null;
    if (tradesWithStrikeData.length > 0) {
      const itmAtmTrades = tradesWithStrikeData.filter(t => {
        const moneyness = calculateMoneyness(t);
        return moneyness === "ITM" || moneyness === "ATM";
      }).length;
      strikeDiscipline = (itmAtmTrades / tradesWithStrikeData.length) * 100;
    }

    return {
      date: group.date,
      slAdherence: slAdherence !== null ? Number(slAdherence.toFixed(1)) : null,
      positionSizing: positionSizing !== null ? Number(positionSizing.toFixed(1)) : null,
      riskReward: riskReward !== null ? Number(riskReward.toFixed(1)) : null,
      strikeDiscipline: strikeDiscipline !== null ? Number(strikeDiscipline.toFixed(1)) : null,
      // SL modification context
      slModified: hasSlModified,
      slModifiedCount,
      slModReasons: topSlReasons,
      trailingSLPercent: Number(trailingSLPercent.toFixed(1)),
      inTradeEmotions: topInTradeEmotions,
    };
  });

  const chartConfig = {
    height: 240,
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
          Risk Discipline Trends
        </h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
          Track consistency in risk management over time
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Chart 1: Stop Loss Adherence */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Stop Loss Adherence
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                % of trades where SL was not modified
              </p>
            </div>

            <div style={{ height: chartConfig.height }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid {...chartConfig.cartesianGrid} />
                  <XAxis dataKey="date" {...chartConfig.xAxis} />
                  <YAxis {...chartConfig.yAxis} />
                  <Tooltip content={<SLAdherenceTooltip isDark={isDark} />} />
                  <Line
                    type="monotone"
                    dataKey="slAdherence"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={<SLAdherenceDot />}
                    name="SL Adherence (%)"
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Position Sizing Discipline */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Position Sizing Discipline
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                % of trades within allowed lot size
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
                    dataKey="positionSizing"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#2563EB' }}
                    name="Position Sizing (%)"
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 3: Risk-Reward Adherence */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Risk-Reward Adherence (≥1:3)
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                % of trades meeting minimum R:R
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
                    dataKey="riskReward"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#F97316' }}
                    name="R:R Adherence (%)"
                    connectNulls={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 4: Strike Discipline */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : ''}>
          <CardContent className="pt-6">
            <div className="mb-4">
              <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Strike Discipline (ITM/ATM)
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                % of trades within defined strike selection
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
                    dataKey="strikeDiscipline"
                    stroke="#9333EA"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#9333EA' }}
                    name="Strike Discipline (%)"
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
