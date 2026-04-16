import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, ReferenceLine } from 'recharts';
import { calculatePnL, calculatePointsCaptured } from '../../../utils/tradeCalculations';

interface Trade {
  id: string;
  entryDate: string;
  exitDate?: string;
  entryPremium: number;
  exitPremium?: number;
  quantity: number;
  action: 'buy' | 'sell';
  lotSize?: number;
  pnl?: number;
}

interface AvgPointsPerLotChartProps {
  trades: Trade[];
  isDark: boolean;
  timeFrame: 'trades' | 'daily' | 'weekly' | 'monthly';
  sharedHoverIndex?: number | null;
  setSharedHoverIndex?: (index: number | null) => void;
}

export function AvgPointsPerLotChart({ trades, isDark, timeFrame, sharedHoverIndex, setSharedHoverIndex }: AvgPointsPerLotChartProps) {
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const pointsValue = data.points?.toFixed(2) || '0.00';
    const color = data.pnl >= 0 ? '#10b981' : '#ef4444';

    return (
      <div
        style={{
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
          borderRadius: '8px',
          padding: '12px',
          color: isDark ? '#fafafa' : '#09090b',
          minWidth: '180px'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
          {data.period}
        </div>
        <div style={{ marginBottom: '4px', fontSize: '13px', fontWeight: '600', color }}>
          {pointsValue} points/lot
        </div>
        <div style={{ fontSize: '12px', color: isDark ? '#a1a1aa' : '#71717a' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Avg Lots:</strong> {data.lots}
          </div>
          <div>
            <strong>Trades:</strong> {data.trades}
          </div>
        </div>
      </div>
    );
  };

  const chartData = (() => {
    if (timeFrame === 'trades') {
      // Sort trades by exit date first to match equity chart
      const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.exitDate!).getTime();
        const dateB = new Date(b.exitDate!).getTime();
        return dateA - dateB;
      });

      // Show individual trades
      return sortedTrades.map((trade, idx) => {
        const pnl = calculatePnL(trade);
        
        let pointsCaptured = trade.action === 'buy'
          ? trade.exitPremium! - trade.entryPremium
          : trade.entryPremium - trade.exitPremium!;
        
        // Points captured is already the premium difference (points per lot)
        const finalPoints = pnl < 0 && pointsCaptured > 0 ? -pointsCaptured : pointsCaptured;
        
        return {
          period: `T${idx + 1}`,
          points: finalPoints,
          lots: trade.lotSize || 1,  // Number of lots, not total quantity
          trades: 1,
          pnl
        };
      });
    } else {
      // Group by time period
      const tradesByPeriod: { [key: string]: { trades: typeof trades, dateObj: Date } } = {};
      
      trades.forEach(trade => {
        // Validate exitDate before processing
        if (!trade.exitDate) return;
        
        const exitDate = new Date(trade.exitDate);
        
        // Skip if invalid date
        if (isNaN(exitDate.getTime())) {
          console.warn('Invalid exit date in AvgPointsPerLotChart:', trade.id, trade.exitDate);
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
        let totalPointsPerLot = 0;
        let totalLots = 0;
        let totalPnL = 0;
        
        periodTrades.forEach(t => {
          const pnl = calculatePnL(t);
          
          let pointsCaptured = t.action === 'buy'
            ? t.exitPremium! - t.entryPremium
            : t.entryPremium - t.exitPremium!;
          
          totalPointsPerLot += pointsCaptured;
          totalLots += (t.lotSize || 1);  // Sum of lots, not quantity
          totalPnL += pnl;
        });
        
        const avgPointsPerLot = totalPointsPerLot / periodTrades.length;
        const avgLots = totalLots / periodTrades.length;
        
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
          points: avgPointsPerLot,
          lots: Math.round(avgLots * 10) / 10,  // Round to 1 decimal place
          trades: periodTrades.length,
          pnl: totalPnL
        };
      });
    }
  })();

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
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} opacity={0.4} />
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
            width={70}
            opacity={0.6}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
          />
          <ReferenceLine 
            y={0} 
            stroke={isDark ? '#71717a' : '#737373'} 
            strokeDasharray="3 3" 
            strokeWidth={1.5} 
            opacity={0.65}
          />
          <Bar 
            dataKey="points" 
            radius={[3, 3, 0, 0]}
            maxBarSize={60}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`points-captured-cell-${index}`} 
                fill={entry.pnl > 0 ? '#10b981' : '#ef4444'}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}