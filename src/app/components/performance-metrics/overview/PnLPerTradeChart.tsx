import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Trade } from '../../../hooks/useTrades';
import { calculatePnL } from '../../../utils/tradeCalculations';

interface PnLPerTradeChartProps {
  trades: Trade[];
  isDark: boolean;
  timeFrame: 'trades' | 'daily' | 'weekly' | 'monthly';
  sharedHoverIndex?: number | null;
  setSharedHoverIndex?: (index: number | null) => void;
}

export function PnLPerTradeChart({ trades, isDark, timeFrame, sharedHoverIndex, setSharedHoverIndex }: PnLPerTradeChartProps) {
  // Format currency for Indian standard
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

  // Format currency for axis ticks (shorter format)
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

  // Calculate intelligent X-axis interval based on timeframe and data length
  const calculateXAxisInterval = (dataLength: number, timeFrame: 'trades' | 'daily' | 'weekly' | 'monthly'): number => {
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

  // Generate chart data based on timeFrame
  const getChartData = () => {
    if (trades.length === 0) return [];

    if (timeFrame === 'trades') {
      // Sort trades by exit date first to match equity chart
      const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.exitDate!).getTime();
        const dateB = new Date(b.exitDate!).getTime();
        return dateA - dateB;
      });

      // Show P&L per individual trade with full trade data
      return sortedTrades.map((trade, idx) => {
        const pnl = calculatePnL(trade);
        
        return {
          period: `T${idx + 1}`,
          pnl,
          trades: 1,
          tradeData: trade // Include full trade data for tooltip
        };
      });
    }

    // Group trades by time period (days, weeks, months)
    const tradesByPeriod: { [key: string]: { trades: typeof trades, dateObj: Date } } = {};
    
    trades.forEach(trade => {
      // Validate exitDate before processing
      if (!trade.exitDate) return;
      
      const exitDate = new Date(trade.exitDate);
      
      // Skip if invalid date
      if (isNaN(exitDate.getTime())) {
        console.warn('Invalid exit date in PnLPerTradeChart:', trade.id, trade.exitDate);
        return;
      }
      
      let periodKey: string;
      let dateObj: Date;
      
      if (timeFrame === 'daily') {
        periodKey = exitDate.toISOString().split('T')[0];
        dateObj = new Date(periodKey);
      } else if (timeFrame === 'weekly') {
        const weekStart = new Date(exitDate);
        weekStart.setDate(exitDate.getDate() - exitDate.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
        dateObj = new Date(periodKey);
      } else {
        periodKey = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
        dateObj = new Date(parseInt(periodKey.split('-')[0]), parseInt(periodKey.split('-')[1]) - 1, 1);
      }
      
      if (!tradesByPeriod[periodKey]) {
        tradesByPeriod[periodKey] = { trades: [], dateObj };
      }
      tradesByPeriod[periodKey].trades.push(trade);
    });
    
    // Sort by date
    const sortedPeriods = Object.entries(tradesByPeriod).sort((a, b) => 
      a[1].dateObj.getTime() - b[1].dateObj.getTime()
    );
    
    return sortedPeriods.map(([key, { trades: periodTrades, dateObj }]) => {
      const periodPnL = periodTrades.reduce((sum, t) => {
        const pnl = calculatePnL(t);
        return sum + pnl;
      }, 0);
      
      // Format the period label
      let label: string;
      if (timeFrame === 'daily') {
        label = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (timeFrame === 'weekly') {
        label = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else {
        label = dateObj.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }
      
      return {
        period: label,
        pnl: periodPnL,
        trades: periodTrades.length
      };
    });
  };

  const chartData = getChartData();

  // Identify top 3 profits and top 3 losses for highlighting
  const getTopIndices = () => {
    if (chartData.length === 0) return { topProfits: [], topLosses: [] };
    
    // Get indices sorted by P&L value
    const withIndices = chartData.map((item, index) => ({ ...item, index }));
    
    // Top 3 profits (highest positive values)
    const profits = withIndices.filter(item => item.pnl > 0);
    profits.sort((a, b) => b.pnl - a.pnl);
    const topProfits = profits.slice(0, 3).map(item => item.index);
    
    // Top 3 losses (lowest negative values)
    const losses = withIndices.filter(item => item.pnl < 0);
    losses.sort((a, b) => a.pnl - b.pnl);
    const topLosses = losses.slice(0, 3).map(item => item.index);
    
    return { topProfits, topLosses };
  };

  const { topProfits, topLosses } = getTopIndices();

  // Function to get bar color based on whether it's a top performer
  const getBarColor = (pnl: number, index: number) => {
    if (pnl >= 0) {
      // Profit bars - brighter green for top 3
      return topProfits.includes(index) ? '#059669' : '#10b981';
    } else {
      // Loss bars - brighter red for top 3
      return topLosses.includes(index) ? '#dc2626' : '#ef4444';
    }
  };

  // Format emotion string to capitalize first letter
  const formatEmotion = (emotion: string | undefined) => {
    if (!emotion) return 'N/A';
    return emotion.charAt(0).toUpperCase() + emotion.slice(1);
  };

  // Custom tooltip component for trades view
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    if (timeFrame === 'trades' && data.tradeData) {
      const trade = data.tradeData;
      return (
        <div
          style={{
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
            borderRadius: '8px',
            padding: '12px',
            color: isDark ? '#fafafa' : '#09090b',
            minWidth: '220px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
            {data.period}
          </div>
          <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
            <span style={{ color: data.pnl >= 0 ? '#10b981' : '#ef4444' }}>
              ₹{formatIndianCurrency(data.pnl)}
            </span>
          </div>
          
          <div style={{ fontSize: '12px', color: isDark ? '#a1a1aa' : '#71717a' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>Lots:</strong> {trade.lotSize || 1}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Planned:</strong> {trade.isPlanned ? 'Yes' : 'No'}
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>SL Moved:</strong> {trade.modifiedSL ? 'Yes' : 'No'}
            </div>
          </div>

          <div style={{ fontSize: '12px', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}` }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Emotions:</div>
            <div style={{ marginBottom: '3px' }}>
              <strong>Entry:</strong> {formatEmotion(trade.entryEmotions)}
            </div>
            <div style={{ marginBottom: '3px' }}>
              <strong>In-Trade:</strong> {formatEmotion(trade.inTradeEmotions)}
            </div>
            <div style={{ marginBottom: '3px' }}>
              <strong>Exit:</strong> {formatEmotion(trade.exitEmotions)}
            </div>
            <div>
              <strong>Post-Exit:</strong> {formatEmotion(trade.postExitEmotions)}
            </div>
          </div>
        </div>
      );
    }

    // Default tooltip for other timeframes
    return (
      <div
        style={{
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
          borderRadius: '8px',
          padding: '12px',
          color: isDark ? '#fafafa' : '#09090b'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.period}</div>
        <div>
          ₹{formatIndianCurrency(data.pnl)} ({data.trades} trades)
        </div>
      </div>
    );
  };

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          syncId="performanceCharts"
          barCategoryGap="10%"
          onMouseMove={(e: any) => {
            if (e && e.activeTooltipIndex !== undefined && setSharedHoverIndex) {
              setSharedHoverIndex(e.activeTooltipIndex);
            }
          }}
          onMouseLeave={() => {
            if (setSharedHoverIndex) setSharedHoverIndex(null);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} opacity={0.3} />
          <XAxis 
            dataKey="period" 
            stroke={isDark ? '#71717a' : '#737373'}
            style={{ fontSize: '10px' }}
            interval={calculateXAxisInterval(chartData.length, timeFrame)}
            opacity={0.6}
          />
          <YAxis 
            stroke={isDark ? '#71717a' : '#737373'}
            style={{ fontSize: '10px' }}
            tickFormatter={formatAxisCurrency}
            width={70}
            opacity={0.6}
          />
          <Tooltip 
            content={<CustomTooltip />}
            labelFormatter={(label) => label}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
          />
          <ReferenceLine 
            y={0} 
            stroke={isDark ? '#71717a' : '#737373'} 
            strokeDasharray="3 3" 
            strokeWidth={1.5}
            opacity={0.7}
          />
          <Bar 
            dataKey="pnl" 
            radius={[3, 3, 0, 0]}
            maxBarSize={60}
          >
            {chartData.map((entry, index) => {
              const isHighlighted = topProfits.includes(index) || topLosses.includes(index);
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(entry.pnl, index)}
                  fillOpacity={isHighlighted ? 1.0 : 0.9}
                  stroke={isHighlighted ? '#ffffff' : 'none'}
                  strokeWidth={isHighlighted ? 2 : 0}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}