import { useTheme } from "../hooks/useTheme";
import { useTrades } from "../hooks/useTrades";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ReferenceLine, ComposedChart, LabelList } from "recharts";
import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { calculatePnL } from "../utils/tradeCalculations";
import { PerformanceMetricsOverview } from "./PerformanceMetricsOverview";
import { getUniquePhases, filterTradesByPhases } from "../utils/phaseUtils";

export function PerformanceMetrics() {
  // Performance metrics with financial statistics and charts
  const { theme } = useTheme();
  const { trades } = useTrades();
  const isDark = theme === 'dark';
  const [equityPnlTimeFrame, setEquityPnlTimeFrame] = useState<'trades' | 'daily' | 'weekly' | 'monthly'>('trades');
  const [isDetailedAnalysisOpen, setIsDetailedAnalysisOpen] = useState(false);

  // Shared hover state for synchronized tooltips
  const [sharedHoverIndex, setSharedHoverIndex] = useState<number | null>(null);

  // Phase filtering state
  const availablePhases = useMemo(() => getUniquePhases(trades), [trades]);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(availablePhases);

  // Update selected phases when available phases change (e.g., when trades are loaded)
  useMemo(() => {
    if (availablePhases.length > 0 && selectedPhases.length === 0) {
      setSelectedPhases(availablePhases);
    }
  }, [availablePhases]);

  // Filter trades by selected phases
  const filteredTrades = useMemo(() => {
    if (selectedPhases.length === 0 || selectedPhases.length === availablePhases.length) {
      return trades; // Return all trades if none or all selected
    }
    return filterTradesByPhases(trades, selectedPhases);
  }, [trades, selectedPhases, availablePhases]);

  // Format number in Indian standard (lakhs and crores) without decimal places
  const formatIndianCurrency = (num: number): string => {
    const absNum = Math.abs(num);
    const rounded = Math.round(absNum); // Round to integer, no decimals
    const intPart = rounded.toString();
    const len = intPart.length;
    
    let result = '';
    if (len <= 3) {
      result = intPart;
    } else {
      result = intPart.slice(-3); // Last 3 digits
      let remaining = intPart.slice(0, -3);
      
      // Add commas every 2 digits for remaining part
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
    
    return result;
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

  // Calculate metrics
  // Filter out open trades (only use closed trades for calculations)
  
  // ALL closed trades (unfiltered) - for KPI cards at top
  const allClosedTrades = trades.filter(t => calculatePnL(t) !== undefined);
  
  // FILTERED closed trades - for equity curve and charts
  const closedTrades = filteredTrades.filter(t => calculatePnL(t) !== undefined);
  
  console.log('PerformanceMetrics - Total trades:', trades.length);
  console.log('PerformanceMetrics - All closed trades (unfiltered):', allClosedTrades.length);
  console.log('PerformanceMetrics - Filtered closed trades:', closedTrades.length);
  
  // Calculate equity stats for the card header
  const calculateEquityStats = () => {
    if (equityPnlTimeFrame === 'trades') {
      // Per-trade basis
      const sortedTrades = [...closedTrades].sort((a, b) => {
        const dateA = a.exitDate ? new Date(a.exitDate).getTime() : new Date(a.entryDate).getTime();
        const dateB = b.exitDate ? new Date(b.exitDate).getTime() : new Date(b.entryDate).getTime();
        return dateA - dateB;
      });

      let cumulativePnL = 0;
      let maxEquity = 0;
      let currentDrawdown = 0;
      let maxDrawdown = 0;

      sortedTrades.forEach(trade => {
        // Calculate PnL from raw data only
        const lotSize = trade.lotSize || 1;
        const lotUnitSize = trade.lotUnitSize || 1;
        const pointsPerLot = trade.action === 'buy' 
          ? (trade.exitPremium! - trade.entryPremium)
          : (trade.entryPremium - trade.exitPremium!);
        const pnl = pointsPerLot * lotSize * lotUnitSize;
        
        cumulativePnL += pnl;
        
        if (cumulativePnL > maxEquity) {
          maxEquity = cumulativePnL;
        }
        
        const drawdown = cumulativePnL - maxEquity;
        if (drawdown < maxDrawdown) {
          maxDrawdown = drawdown;
        }
      });

      currentDrawdown = cumulativePnL - maxEquity;

      return {
        peakEquity: maxEquity,
        currentEquity: cumulativePnL,
        currentDrawdown: currentDrawdown,
        maxDrawdown: maxDrawdown
      };
    }

    // For time-based aggregations (daily/weekly/monthly)
    const tradesByPeriod: { [key: string]: { trades: typeof closedTrades, dateObj: Date } } = {};
    
    closedTrades.forEach(trade => {
      // Validate exitDate before creating Date object
      if (!trade.exitDate) return;
      
      const exitDate = new Date(trade.exitDate);
      
      // Skip if invalid date
      if (isNaN(exitDate.getTime())) {
        console.warn('Invalid exit date for trade:', trade.id, trade.exitDate);
        return;
      }
      
      let periodKey: string;
      let dateObj: Date;
      
      if (equityPnlTimeFrame === 'daily') {
        periodKey = exitDate.toISOString().split('T')[0];
        dateObj = new Date(periodKey);
      } else if (equityPnlTimeFrame === 'weekly') {
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
    
    // Sort by date and calculate cumulative equity
    const sortedPeriods = Object.entries(tradesByPeriod).sort((a, b) => 
      a[1].dateObj.getTime() - b[1].dateObj.getTime()
    );

    let cumulativePnL = 0;
    let maxEquity = 0;
    let currentDrawdown = 0;
    let maxDrawdown = 0;

    sortedPeriods.forEach(([_, { trades: periodTrades }]) => {
      const periodPnL = periodTrades.reduce((sum, t) => {
        const pnl = calculatePnL(t);
        return sum + (pnl || 0);
      }, 0);
      
      cumulativePnL += periodPnL;
      
      if (cumulativePnL > maxEquity) {
        maxEquity = cumulativePnL;
      }
      
      const drawdown = cumulativePnL - maxEquity;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    currentDrawdown = cumulativePnL - maxEquity;

    return {
      peakEquity: maxEquity,
      currentEquity: cumulativePnL,
      currentDrawdown: currentDrawdown,
      maxDrawdown: maxDrawdown
    };
  };

  const equityStats = closedTrades.length > 0 ? calculateEquityStats() : {
    peakEquity: 0,
    currentEquity: 0,
    currentDrawdown: 0,
    maxDrawdown: 0
  };
  
  // Calculate best and worst based on timeframe
  const calculateBestWorst = () => {
    if (closedTrades.length === 0) return { best: 0, worst: 0 };

    if (equityPnlTimeFrame === 'trades') {
      // Calculate for individual trades using centralized function
      const pnls = closedTrades.map(t => {
        const pnl = calculatePnL(t);
        return pnl || 0;
      });
      return {
        best: Math.max(...pnls),
        worst: Math.min(...pnls)
      };
    }

    // Group by time period for daily/weekly/monthly
    const tradesByPeriod: { [key: string]: typeof closedTrades } = {};
    
    closedTrades.forEach(trade => {
      // Validate exitDate before creating Date object
      if (!trade.exitDate) return;
      
      const exitDate = new Date(trade.exitDate);
      
      // Skip if invalid date
      if (isNaN(exitDate.getTime())) {
        console.warn('Invalid exit date for trade in calculateBestWorst:', trade.id, trade.exitDate);
        return;
      }
      
      let periodKey: string;
      
      if (equityPnlTimeFrame === 'daily') {
        periodKey = exitDate.toISOString().split('T')[0];
      } else if (equityPnlTimeFrame === 'weekly') {
        const weekStart = new Date(exitDate);
        weekStart.setDate(exitDate.getDate() - exitDate.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = `${exitDate.getFullYear()}-${String(exitDate.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!tradesByPeriod[periodKey]) {
        tradesByPeriod[periodKey] = [];
      }
      tradesByPeriod[periodKey].push(trade);
    });
    
    // Calculate P&L for each period using centralized function
    const periodPnLs = Object.values(tradesByPeriod).map(periodTrades => {
      return periodTrades.reduce((sum, t) => {
        const pnl = calculatePnL(t);
        return sum + (pnl || 0);
      }, 0);
    });

    return {
      best: periodPnLs.length > 0 ? Math.max(...periodPnLs) : 0,
      worst: periodPnLs.length > 0 ? Math.min(...periodPnLs) : 0
    };
  };

  const { best: bestValue, worst: worstValue } = calculateBestWorst();

  // Get labels based on timeframe
  const getBestWorstLabels = () => {
    switch (equityPnlTimeFrame) {
      case 'trades': return { best: 'Best Trade', worst: 'Worst Trade' };
      case 'daily': return { best: 'Best Day', worst: 'Worst Day' };
      case 'weekly': return { best: 'Best Week', worst: 'Worst Week' };
      case 'monthly': return { best: 'Best Month', worst: 'Worst Month' };
      default: return { best: 'Best Trade', worst: 'Worst Trade' };
    }
  };

  const bestWorstLabels = getBestWorstLabels();
  
  // ========================================
  // KPI CALCULATIONS (from ALL closed trades - unfiltered)
  // ========================================
  
  // Win/Loss calculation for KPIs
  const allWinningTrades = allClosedTrades.filter(t => {
    const pnl = calculatePnL(t);
    return pnl !== undefined && pnl > 0;
  });
  
  const allLosingTrades = allClosedTrades.filter(t => {
    const pnl = calculatePnL(t);
    return pnl !== undefined && pnl < 0;
  });
  
  // Total Profit/Loss for KPIs
  const allTotalProfit = allWinningTrades.reduce((sum, t) => {
    const pnl = calculatePnL(t);
    return sum + (pnl || 0);
  }, 0);
  
  const allTotalLoss = allLosingTrades.reduce((sum, t) => {
    const pnl = calculatePnL(t);
    return sum + (pnl || 0);
  }, 0);
  
  const allNetPnL = allTotalProfit + allTotalLoss;
  const allWinRate = allClosedTrades.length > 0 ? (allWinningTrades.length / allClosedTrades.length) * 100 : 0;
  
  // Profit Factor for KPIs
  const allProfitFactor = Math.abs(allTotalLoss) > 0 ? allTotalProfit / Math.abs(allTotalLoss) : allTotalProfit > 0 ? Infinity : 0;
  
  // Expectancy for KPIs
  const allExpectancy = allClosedTrades.length > 0 ? allNetPnL / allClosedTrades.length : 0;
  
  // Calculate Peak P&L, Max Drawdown for KPIs (from all trades)
  const allSortedTrades = [...allClosedTrades].sort((a, b) => {
    const dateA = a.exitDate ? new Date(a.exitDate).getTime() : new Date(a.entryDate).getTime();
    const dateB = b.exitDate ? new Date(b.exitDate).getTime() : new Date(b.entryDate).getTime();
    return dateA - dateB;
  });

  let allCumulativePnL = 0;
  let allPeakPnL = 0;
  let allLowestPoint = 0;
  let allMaxDrawdown = 0;
  let allCurrentPeak = 0;
  let allCurrentDrawdown = 0;

  allSortedTrades.forEach(trade => {
    const lotSize = trade.lotSize || 1;
    const lotUnitSize = trade.lotUnitSize || 1;
    const pointsPerLot = trade.action === 'buy' 
      ? (trade.exitPremium! - trade.entryPremium)
      : (trade.entryPremium - trade.exitPremium!);
    const pnl = pointsPerLot * lotSize * lotUnitSize;
    
    allCumulativePnL += pnl;
    
    if (allCumulativePnL > allPeakPnL) {
      allPeakPnL = allCumulativePnL;
    }
    
    if (allCumulativePnL < allLowestPoint) {
      allLowestPoint = allCumulativePnL;
    }
    
    if (allCumulativePnL > allCurrentPeak) {
      allCurrentPeak = allCumulativePnL;
    }
    
    const drawdown = allCurrentPeak - allCumulativePnL;
    if (drawdown > allMaxDrawdown) {
      allMaxDrawdown = drawdown;
    }
    
    allCurrentDrawdown = allCurrentPeak - allCumulativePnL;
  });
  
  // ========================================
  // FILTERED CALCULATIONS (for equity curve and charts)
  // ========================================
  
  // Win/Loss calculation
  // Winning and Losing Trades using centralized calculation
  const winningTrades = closedTrades.filter(t => {
    const pnl = calculatePnL(t);
    return pnl !== undefined && pnl > 0;
  });
  
  const losingTrades = closedTrades.filter(t => {
    const pnl = calculatePnL(t);
    return pnl !== undefined && pnl < 0;
  });
  
  // Total Profit/Loss using centralized calculation
  const totalProfit = winningTrades.reduce((sum, t) => {
    const pnl = calculatePnL(t);
    return sum + (pnl || 0);
  }, 0);
  
  const totalLoss = losingTrades.reduce((sum, t) => {
    const pnl = calculatePnL(t);
    return sum + (pnl || 0);
  }, 0);
  
  const netPnL = totalProfit + totalLoss;
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  // Average Profit and Average Loss
  const avgProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
  
  // Profit Factor
  const profitFactor = Math.abs(totalLoss) > 0 ? totalProfit / Math.abs(totalLoss) : totalProfit > 0 ? Infinity : 0;

  // Expectancy
  const expectancy = closedTrades.length > 0 ? netPnL / closedTrades.length : 0;

  // Win-to-Loss Ratio
  const winLossRatio = Math.abs(avgLoss) > 0 ? avgProfit / Math.abs(avgLoss) : avgProfit > 0 ? Infinity : 0;

  // Calculate Peak P&L, Max Drawdown, and Lowest Point
  const sortedTrades = [...closedTrades].sort((a, b) => {
    const dateA = a.exitDate ? new Date(a.exitDate).getTime() : new Date(a.entryDate).getTime();
    const dateB = b.exitDate ? new Date(b.exitDate).getTime() : new Date(b.entryDate).getTime();
    return dateA - dateB;
  });

  let cumulativePnL = 0;
  let peakPnL = 0;
  let lowestPoint = 0;
  let maxDrawdown = 0;
  let currentPeak = 0;
  let currentDrawdown = 0;

  sortedTrades.forEach(trade => {
    // Calculate PnL from raw data only
    const lotSize = trade.lotSize || 1;
    const lotUnitSize = trade.lotUnitSize || 1;
    const pointsPerLot = trade.action === 'buy' 
      ? (trade.exitPremium! - trade.entryPremium)
      : (trade.entryPremium - trade.exitPremium!);
    const pnl = pointsPerLot * lotSize * lotUnitSize;
    
    cumulativePnL += pnl;
    
    // Track peak
    if (cumulativePnL > peakPnL) {
      peakPnL = cumulativePnL;
    }
    
    // Track lowest point
    if (cumulativePnL < lowestPoint) {
      lowestPoint = cumulativePnL;
    }
    
    // Track peak for drawdown calculation
    if (cumulativePnL > currentPeak) {
      currentPeak = cumulativePnL;
    }
    
    // Calculate drawdown from current peak
    const drawdown = currentPeak - cumulativePnL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
    
    // Track current drawdown (at the end of all trades)
    currentDrawdown = currentPeak - cumulativePnL;
  });

  // Pie Chart Data for Overall Win Rate
  const pieData = [
    { name: 'Winning', value: winningTrades.length, percentage: winRate.toFixed(1) },
    { name: 'Losing', value: losingTrades.length, percentage: (100 - winRate).toFixed(1) }
  ];

  const COLORS = ['#10b981', '#ef4444'];

  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Iceberg Chart Data - Profit bars extend upward, Loss bars extend downward
  const icebergData = [
    {
      name: 'P&L',
      profit: totalProfit, // Positive value extends upward
      loss: totalLoss,     // Negative value extends downward
    },
  ];



  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            Performance Metrics
          </h1>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
            Comprehensive analysis of your trading performance
          </p>
        </div>

        {/* Content */}
        <div>
          <PerformanceMetricsOverview
            closedTrades={closedTrades}
            isDark={isDark}
            equityPnlTimeFrame={equityPnlTimeFrame}
            setEquityPnlTimeFrame={setEquityPnlTimeFrame}
            sharedHoverIndex={sharedHoverIndex}
            setSharedHoverIndex={setSharedHoverIndex}
            equityStats={equityStats}
            bestWorstLabels={bestWorstLabels}
            bestValue={bestValue}
            worstValue={worstValue}
            formatIndianCurrency={formatIndianCurrency}
            isDetailedAnalysisOpen={isDetailedAnalysisOpen}
            setIsDetailedAnalysisOpen={setIsDetailedAnalysisOpen}
            closedTradesLength={allClosedTrades.length}
            winRate={allWinRate}
            winningTradesLength={allWinningTrades.length}
            losingTradesLength={allLosingTrades.length}
            netPnL={allNetPnL}
            profitFactor={allProfitFactor}
            expectancy={allExpectancy}
            peakPnL={allPeakPnL}
            currentDrawdown={allCurrentDrawdown}
            maxDrawdown={allMaxDrawdown}
            lowestPoint={allLowestPoint}
            availablePhases={availablePhases}
            selectedPhases={selectedPhases}
            onPhaseSelectionChange={setSelectedPhases}
          />
        </div>
      </div>
    </div>
  );
}