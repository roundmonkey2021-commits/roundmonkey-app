import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { useState } from "react";
import { calculatePnL } from "../../../utils/tradeCalculations";
import { parsePhaseLabel } from "../../../utils/phaseUtils";

interface Trade {
  id: string;
  entryDate: string;
  exitDate?: string;
  entryPremium: number;
  exitPremium?: number | null;
  quantity: number;
  lotSize?: number;
  action: 'buy' | 'sell';
  pnl?: number;
  phase?: string;
}

interface SynchronizedEquityDrawdownChartProps {
  trades: Trade[];
  isDark: boolean;
  timeFrame: TimeFrame;
  onStatsCalculated?: (stats: { peakEquity: number; currentEquity: number; currentDrawdown: number; maxDrawdown: number }) => void;
  sharedHoverIndex?: number | null;
  setSharedHoverIndex?: (index: number | null) => void;
}

type TimeFrame = 'trades' | 'daily' | 'weekly' | 'monthly';

export function SynchronizedEquityDrawdownChart({ trades, isDark, timeFrame, onStatsCalculated, sharedHoverIndex, setSharedHoverIndex }: SynchronizedEquityDrawdownChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Use shared hover index if provided, otherwise use local state
  const activeHoverIndex = sharedHoverIndex !== undefined ? sharedHoverIndex : hoveredIndex;

  // Format currency for axis
  const formatAxisCurrency = (num: number): string => {
    if (num === 0) return '0';
    const absNum = Math.abs(num);
    if (absNum >= 100000) {
      return `${num < 0 ? '-' : ''}${(absNum / 100000).toFixed(1)}L`;
    } else if (absNum >= 1000) {
      return `${num < 0 ? '-' : ''}${(absNum / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format number in Indian standard
  const formatIndianCurrency = (num: number): string => {
    const absNum = Math.abs(num);
    const rounded = Math.round(absNum); // Round to whole number, no decimals
    const intPart = rounded.toString();
    const len = intPart.length;
    
    let result = '';
    if (len <= 3) {
      result = intPart;
    } else {
      result = intPart.slice(-3);
      let remaining = intPart.slice(0, -3);
      
      while (remaining.length > 0) {
        if (remaining.length <= 2) {
          result = remaining + ',' + result;
          break;
        } else {
          result = remaining.slice(-2) + ',' + result;
          remaining = remaining.slice(0, -2);
        }
      }
    }
    
    return (num < 0 ? '-' : '') + result;
  };

  // Generate synchronized data for both charts
  const generateChartData = () => {
    const closedTrades = [...trades]
      .filter(t => t.exitDate && (t.exitPremium !== undefined && t.exitPremium !== null))
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

    if (closedTrades.length === 0) return [];

    if (timeFrame === 'trades') {
      // Per trade basis
      let cumulativePnL = 0;
      let maxEquity = 0;
      
      return closedTrades.map((trade, index) => {
        const pnl = calculatePnL(trade);
        cumulativePnL += pnl;
        
        // Update max equity if current is higher
        if (cumulativePnL > maxEquity) {
          maxEquity = cumulativePnL;
        }
        
        // Calculate drawdown (always <= 0)
        const drawdown = cumulativePnL - maxEquity;
        
        return {
          label: `T${index + 1}`,
          fullLabel: `Trade ${index + 1}`,
          date: trade.exitDate!,
          equity: cumulativePnL,
          drawdown: drawdown,
          dailyPnL: pnl,
          tradeNumber: index + 1,
          index: index,
          phase: trade.phase || 'Unknown'
        };
      });
    }

    // For time-based aggregations
    const aggregationMap = new Map<string, { trades: Trade[], pnl: number, dateObj: Date, phases: Set<string> }>();

    closedTrades.forEach(trade => {
      // Validate exitDate before processing
      if (!trade.exitDate) return;
      
      const exitDate = new Date(trade.exitDate);
      
      // Skip if invalid date
      if (isNaN(exitDate.getTime())) {
        console.warn('Invalid exit date in SynchronizedEquityDrawdownChart:', trade.id, trade.exitDate);
        return;
      }
      
      let key: string;

      if (timeFrame === 'daily') {
        key = exitDate.toISOString().split('T')[0];
      } else if (timeFrame === 'weekly') {
        const weekStart = new Date(exitDate);
        weekStart.setDate(exitDate.getDate() - exitDate.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // monthly
        key = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, { 
          trades: [], 
          pnl: 0, 
          dateObj: timeFrame === 'monthly' ? 
            new Date(parseInt(key.split('-')[0]), parseInt(key.split('-')[1]) - 1, 1) : 
            new Date(key),
          phases: new Set<string>()
        });
      }
      
      const pnl = calculatePnL(trade);
      const existing = aggregationMap.get(key)!;
      existing.trades.push(trade);
      existing.pnl += pnl;
      if (trade.phase) {
        existing.phases.add(trade.phase);
      }
    });

    // Convert to array and sort by date
    const sortedEntries = Array.from(aggregationMap.entries()).sort((a, b) => {
      return a[0].localeCompare(b[0]);
    });

    // Calculate cumulative values and drawdown
    let cumulativePnL = 0;
    let maxEquity = 0;
    
    return sortedEntries.map(([key, data], index) => {
      cumulativePnL += data.pnl;
      
      // Update max equity if current is higher
      if (cumulativePnL > maxEquity) {
        maxEquity = cumulativePnL;
      }
      
      // Calculate drawdown (always <= 0)
      const drawdown = cumulativePnL - maxEquity;
      
      let label: string;
      if (timeFrame === 'daily') {
        const date = new Date(key);
        label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (timeFrame === 'weekly') {
        const date = new Date(key);
        label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }

      // For aggregated data, use the most recent phase if multiple phases exist
      const phase = data.phases.size > 0 ? Array.from(data.phases)[data.phases.size - 1] : 'Unknown';

      return {
        label: label,
        fullLabel: label,
        date: key,
        equity: cumulativePnL,
        drawdown: drawdown,
        dailyPnL: data.pnl,
        tradesCount: data.trades.length,
        index: index,
        phase: phase
      };
    });
  };

  const chartData = generateChartData();

  // Detect phase boundaries and create phase segments
  interface PhaseSegment {
    phase: string;
    startIndex: number;
    endIndex: number;
    label: string;
  }

  const phaseSegments: PhaseSegment[] = [];
  const phaseBoundaries: number[] = [];

  if (chartData.length > 0) {
    let currentPhase = chartData[0].phase;
    let segmentStart = 0;

    for (let i = 1; i < chartData.length; i++) {
      if (chartData[i].phase !== currentPhase) {
        // Phase transition detected
        phaseSegments.push({
          phase: currentPhase,
          startIndex: segmentStart,
          endIndex: i - 1,
          label: parsePhaseLabel(currentPhase)
        });
        phaseBoundaries.push(i);
        currentPhase = chartData[i].phase;
        segmentStart = i;
      }
    }

    // Add the last segment
    phaseSegments.push({
      phase: currentPhase,
      startIndex: segmentStart,
      endIndex: chartData.length - 1,
      label: parsePhaseLabel(currentPhase)
    });
  }

  // Calculate summary stats
  const maxDrawdown = chartData.length > 0 
    ? Math.min(...chartData.map(d => d.drawdown))
    : 0;

  const peakEquity = chartData.length > 0
    ? Math.max(...chartData.map(d => d.equity))
    : 0;

  const currentEquity = chartData.length > 0
    ? chartData[chartData.length - 1].equity
    : 0;

  const currentDrawdown = chartData.length > 0
    ? chartData[chartData.length - 1].drawdown
    : 0;

  // Find worst drawdown point index
  const worstDrawdownIndex = chartData.length > 0
    ? chartData.reduce((maxIdx, curr, idx, arr) => 
        curr.drawdown < arr[maxIdx].drawdown ? idx : maxIdx, 0)
    : -1;

  // Calculate intelligent X-axis interval based on timeframe and data length
  const calculateXAxisInterval = (dataLength: number, timeFrame: TimeFrame): number => {
    if (dataLength <= 0) return 0;
    
    switch (timeFrame) {
      case 'trades':
        // Show every 10-20 trades depending on total
        if (dataLength <= 30) return 2;
        if (dataLength <= 60) return 5;
        if (dataLength <= 120) return 10;
        return 15;
      
      case 'daily':
        // Show every 3-5 days
        if (dataLength <= 15) return 1;
        if (dataLength <= 30) return 3;
        if (dataLength <= 60) return 5;
        return 7;
      
      case 'weekly':
        // Show every week, or every 2 weeks for longer periods
        if (dataLength <= 12) return 0; // Show all
        if (dataLength <= 26) return 1; // Every other week
        return 2;
      
      case 'monthly':
        // Show every month, or every 2-3 months for longer periods
        if (dataLength <= 12) return 0; // Show all
        if (dataLength <= 24) return 1; // Every other month
        return 2;
      
      default:
        return Math.floor(dataLength / 6) || 0;
    }
  };

  const xAxisInterval = calculateXAxisInterval(chartData.length, timeFrame);

  // Custom tooltip that shows both equity and drawdown
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className={`p-3 rounded-lg border ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-neutral-300'}`}>
        <p className={`font-medium mb-2 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          {timeFrame === 'trades' ? data.fullLabel : `${data.fullLabel} (${data.tradesCount} trades)`}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              {timeFrame === 'trades' ? 'Trade P&L:' : 'Period P&L:'}
            </span>
            <span className={`text-xs font-semibold ${data.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.dailyPnL >= 0 ? '+' : ''}₹{formatIndianCurrency(data.dailyPnL)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Equity:</span>
            <span className={`text-xs font-semibold ${data.equity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.equity >= 0 ? '+' : ''}₹{formatIndianCurrency(data.equity)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Drawdown:</span>
            <span className={`text-xs font-semibold ${data.drawdown === 0 ? 'text-green-600' : 'text-orange-600'}`}>
              ₹{formatIndianCurrency(data.drawdown)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Call the callback with calculated stats
  if (onStatsCalculated) {
    onStatsCalculated({ peakEquity, currentEquity, currentDrawdown, maxDrawdown });
  }

  return (
    <>
      {chartData.length > 0 ? (
        <>
          {/* Enhanced Equity Curve Chart - Hero Section */}
          <div className="mb-6">
            {/* Phase Labels Bar (Above Chart) */}
            {phaseSegments.length > 1 && (
              <div className="flex mb-3 px-2">
                {phaseSegments.map((segment, idx) => {
                  const widthPercent = ((segment.endIndex - segment.startIndex + 1) / chartData.length) * 100;
                  return (
                    <div
                      key={idx}
                      className={`text-center px-2 py-1.5 ${
                        idx % 2 === 0
                          ? isDark
                            ? 'bg-zinc-800/30'
                            : 'bg-neutral-100/50'
                          : isDark
                          ? 'bg-zinc-800/10'
                          : 'bg-neutral-50/30'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    >
                      <p className={`text-[10px] font-medium truncate ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                        {segment.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  syncId="performanceCharts"
                  onMouseMove={(e: any) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      setHoveredIndex(e.activeTooltipIndex);
                      if (setSharedHoverIndex) setSharedHoverIndex(e.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    if (setSharedHoverIndex) setSharedHoverIndex(null);
                  }}
                >
                  <defs>
                    {/* Subtle gradient fill under equity line */}
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  
                  {/* Phase alternating background segments (optional enhancement) */}
                  {phaseSegments.length > 1 && phaseSegments.map((segment, idx) => (
                    <ReferenceArea
                      key={`phase-bg-${idx}`}
                      x1={chartData[segment.startIndex].label}
                      x2={chartData[segment.endIndex].label}
                      fill={idx % 2 === 0 ? (isDark ? '#52525b' : '#e5e7eb') : 'transparent'}
                      fillOpacity={0.05}
                    />
                  ))}

                  {/* Reduced grid opacity, horizontal only */}
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#27272a' : '#e5e5e5'} 
                    opacity={0.3}
                    vertical={false}
                  />
                  
                  {/* Reduced x-axis labels */}
                  <XAxis
                    dataKey="label"
                    stroke={isDark ? '#71717a' : '#737373'}
                    style={{ fontSize: '10px' }}
                    interval={xAxisInterval}
                    opacity={0.6}
                  />
                  
                  <YAxis
                    stroke={isDark ? '#71717a' : '#737373'}
                    style={{ fontSize: '10px' }}
                    tickFormatter={formatAxisCurrency}
                    width={70}
                    opacity={0.6}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Zero reference line */}
                  <ReferenceLine 
                    y={0} 
                    stroke={isDark ? '#52525b' : '#a3a3a3'} 
                    strokeWidth={1} 
                    strokeDasharray="3 3"
                    opacity={0.4}
                  />
                  
                  {/* Phase Boundary Vertical Lines */}
                  {phaseBoundaries.map((boundaryIndex, idx) => (
                    <ReferenceLine
                      key={`phase-boundary-${idx}`}
                      x={chartData[boundaryIndex].label}
                      stroke="#9CA3AF"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      opacity={0.5}
                      label={{
                        position: 'top',
                        value: '',
                        fill: isDark ? '#71717a' : '#737373',
                        fontSize: 10
                      }}
                    />
                  ))}
                  
                  {/* Enhanced equity line with gradient fill */}
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#16A34A"
                    strokeWidth={3}
                    fill="url(#colorEquity)"
                    dot={false}
                    activeDot={{ 
                      r: 6, 
                      fill: '#16A34A', 
                      strokeWidth: 2, 
                      stroke: '#ffffff' 
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Drawdown Chart */}
          <div className="mt-4">
            <p className={`text-sm font-medium mb-3 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
              Drawdown (Underwater)
            </p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  syncId="performanceCharts"
                  onMouseMove={(e: any) => {
                    if (e && e.activeTooltipIndex !== undefined) {
                      setHoveredIndex(e.activeTooltipIndex);
                      if (setSharedHoverIndex) setSharedHoverIndex(e.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(null);
                    if (setSharedHoverIndex) setSharedHoverIndex(null);
                  }}
                >
                  <defs>
                    {/* Subtle gradient fill for drawdown area */}
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>

                  {/* Phase alternating background segments */}
                  {phaseSegments.length > 1 && phaseSegments.map((segment, idx) => (
                    <ReferenceArea
                      key={`phase-bg-dd-${idx}`}
                      x1={chartData[segment.startIndex].label}
                      x2={chartData[segment.endIndex].label}
                      fill={idx % 2 === 0 ? (isDark ? '#52525b' : '#e5e7eb') : 'transparent'}
                      fillOpacity={0.05}
                    />
                  ))}

                  {/* Reduced grid opacity, horizontal only */}
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? '#27272a' : '#e5e5e5'} 
                    opacity={0.3}
                    vertical={false}
                  />

                  {/* Reduced x-axis labels */}
                  <XAxis
                    dataKey="label"
                    stroke={isDark ? '#71717a' : '#737373'}
                    style={{ fontSize: '10px' }}
                    interval={xAxisInterval}
                    opacity={0.6}
                  />

                  <YAxis
                    stroke={isDark ? '#71717a' : '#737373'}
                    style={{ fontSize: '10px' }}
                    tickFormatter={formatAxisCurrency}
                    width={70}
                    opacity={0.6}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {/* Enhanced zero baseline */}
                  <ReferenceLine 
                    y={0} 
                    stroke={isDark ? '#71717a' : '#9CA3AF'} 
                    strokeWidth={1.5} 
                    opacity={0.6}
                  />

                  {/* Phase Boundary Vertical Lines */}
                  {phaseBoundaries.map((boundaryIndex, idx) => (
                    <ReferenceLine
                      key={`phase-boundary-dd-${idx}`}
                      x={chartData[boundaryIndex].label}
                      stroke="#9CA3AF"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      opacity={0.5}
                    />
                  ))}

                  {/* Drawdown area with controlled red palette */}
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#DC2626"
                    strokeWidth={2.5}
                    fill="url(#colorDrawdown)"
                    dot={(props: any) => {
                      // Only show dot at worst drawdown point
                      if (props.index === worstDrawdownIndex) {
                        return (
                          <g key={`worst-dd-marker-${props.index}`}>
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={6}
                              fill="#B91C1C"
                              stroke="#ffffff"
                              strokeWidth={2.5}
                              style={{ cursor: 'pointer' }}
                            />
                            {/* Optional tooltip hint */}
                            <title>Max Drawdown: ₹{formatIndianCurrency(props.payload.drawdown)}</title>
                          </g>
                        );
                      }
                      return null;
                    }}
                    activeDot={{ 
                      r: 5, 
                      fill: '#DC2626', 
                      strokeWidth: 2, 
                      stroke: '#ffffff' 
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="h-[600px] flex items-center justify-center">
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
            No closed trades available
          </p>
        </div>
      )}
    </>
  );
}