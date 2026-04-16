import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis } from 'recharts';
import { Trade } from '../../../hooks/useTrades';
import { calculatePnL } from '../../../utils/tradeCalculations';

interface PointsVsLotSizeScatterProps {
  trades: Trade[];
  isDark: boolean;
}

export function PointsVsLotSizeScatter({ trades, isDark }: PointsVsLotSizeScatterProps) {
  // Calculate points captured for each trade
  const getScatterData = () => {
    return trades
      .filter(trade => trade.exitPremium !== undefined && trade.quantity > 0)
      .map((trade, idx) => {
        // Calculate P&L using the centralized function
        const pnl = calculatePnL(trade);
        
        // Calculate points per lot
        const pointsCaptured = trade.action === 'buy'
          ? trade.exitPremium! - trade.entryPremium
          : trade.entryPremium - trade.exitPremium!;
        
        // Calculate bubble size based on absolute P&L
        const bubbleSize = Math.abs(pnl);
        
        return {
          lotSize: trade.lotSize || 1,  // Number of lots, not total quantity
          points: pointsCaptured, // Negative for losses, positive for profits
          pnl,
          bubbleSize,
          isProfitable: pnl > 0,
          optionType: trade.optionType,
          tradeNumber: idx + 1,
          trade
        };
      });
  };

  const scatterData = getScatterData();

  // Find min and max bubble sizes for scaling
  const bubbleSizes = scatterData.map(d => d.bubbleSize);
  const minBubbleSize = Math.min(...bubbleSizes);
  const maxBubbleSize = Math.max(...bubbleSizes);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const trade = data.trade;

    return (
      <div
        style={{
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          border: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}`,
          borderRadius: '8px',
          padding: '12px',
          color: isDark ? '#fafafa' : '#09090b',
          minWidth: '200px'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
          Trade #{data.tradeNumber}
        </div>
        
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Points Captured:</strong>{' '}
            <span style={{ color: data.isProfitable ? '#10b981' : '#ef4444', fontWeight: '600' }}>
              {data.points > 0 ? '+' : ''}{data.points.toFixed(2)}
            </span>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Lot Size:</strong> {data.lotSize}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>P&L:</strong>{' '}
            <span style={{ color: data.pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
              ₹{data.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: isDark ? '#a1a1aa' : '#71717a', paddingTop: '8px', borderTop: `1px solid ${isDark ? '#3f3f46' : '#e5e5e5'}` }}>
          <div style={{ marginBottom: '3px' }}>
            <strong>Type:</strong> {trade.optionType?.toUpperCase()}
          </div>
          <div style={{ marginBottom: '3px' }}>
            <strong>Action:</strong> {trade.action?.toUpperCase()}
          </div>
          <div style={{ marginBottom: '3px' }}>
            <strong>Strike:</strong> {trade.strikePrice}
          </div>
          <div>
            <strong>Entry:</strong> ₹{trade.entryPremium} → <strong>Exit:</strong> ₹{trade.exitPremium}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} />
          <XAxis 
            type="number" 
            dataKey="lotSize" 
            name="Lot Size"
            stroke={isDark ? '#71717a' : '#737373'}
            style={{ fontSize: '12px' }}
            label={{ 
              value: 'Lot Size (Quantity)', 
              position: 'insideBottom',
              offset: -10,
              style: { fill: isDark ? '#71717a' : '#737373' }
            }}
          />
          <YAxis 
            type="number" 
            dataKey="points" 
            name="Points Captured"
            stroke={isDark ? '#71717a' : '#737373'}
            style={{ fontSize: '12px' }}
            label={{ 
              value: 'Points Captured', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: isDark ? '#71717a' : '#737373' }
            }}
          />
          <ZAxis 
            type="number" 
            dataKey="bubbleSize" 
            range={[50, 400]} 
            name="P&L Impact"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine y={0} stroke={isDark ? '#71717a' : '#737373'} strokeDasharray="3 3" />
          
          {/* All trades in grey with varying sizes */}
          <Scatter 
            name="Trades" 
            data={scatterData} 
            fill={isDark ? '#71717a' : '#9ca3af'}
            opacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}