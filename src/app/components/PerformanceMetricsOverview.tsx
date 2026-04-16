import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { GrossProfitLossDistributionChart } from "./performance-metrics/overview/GrossProfitLossDistributionChart";
import { OverallGrossProfitLossChart } from "./performance-metrics/overview/OverallGrossProfitLossChart";
import { AvgWinnersVsLosersDistributionChart } from "./performance-metrics/overview/AvgWinnersVsLosersDistributionChart";
import { AvgWinnersVsLosersChart } from "./performance-metrics/overview/AvgWinnersVsLosersChart";
import { PnLPerTradeChart } from "./performance-metrics/overview/PnLPerTradeChart";
import { AvgPointsPerLotChart } from "./performance-metrics/overview/AvgPointsPerLotChart";
import { WinRateTrendChart } from "./performance-metrics/overview/WinRateTrendChart";
import { ExpectancyTrendChart } from "./performance-metrics/overview/ExpectancyTrendChart";
import { SynchronizedEquityDrawdownChart } from "./performance-metrics/overview/SynchronizedEquityDrawdownChart";
import { PnLDistributionChart } from "./performance-metrics/overview/PnLDistributionChart";
import { PhaseFilter } from "./performance-metrics/PhaseFilter";

interface PerformanceMetricsOverviewProps {
  closedTrades: any[];
  isDark: boolean;
  equityPnlTimeFrame: 'trades' | 'daily' | 'weekly' | 'monthly';
  setEquityPnlTimeFrame: (timeFrame: 'trades' | 'daily' | 'weekly' | 'monthly') => void;
  sharedHoverIndex: number | null;
  setSharedHoverIndex: (index: number | null) => void;
  equityStats: {
    peakEquity: number;
    currentEquity: number;
    currentDrawdown: number;
    maxDrawdown: number;
  };
  bestWorstLabels: {
    best: string;
    worst: string;
  };
  bestValue: number;
  worstValue: number;
  formatIndianCurrency: (num: number) => string;
  isDetailedAnalysisOpen: boolean;
  setIsDetailedAnalysisOpen: (isOpen: boolean) => void;
  // Summary stats
  closedTradesLength: number;
  winRate: number;
  winningTradesLength: number;
  losingTradesLength: number;
  netPnL: number;
  profitFactor: number;
  expectancy: number;
  peakPnL: number;
  currentDrawdown: number;
  maxDrawdown: number;
  lowestPoint: number;
  // Phase filtering
  availablePhases: string[];
  selectedPhases: string[];
  onPhaseSelectionChange: (phases: string[]) => void;
}

export function PerformanceMetricsOverview({
  closedTrades,
  isDark,
  equityPnlTimeFrame,
  setEquityPnlTimeFrame,
  sharedHoverIndex,
  setSharedHoverIndex,
  equityStats,
  bestWorstLabels,
  bestValue,
  worstValue,
  formatIndianCurrency,
  isDetailedAnalysisOpen,
  setIsDetailedAnalysisOpen,
  closedTradesLength,
  winRate,
  winningTradesLength,
  losingTradesLength,
  netPnL,
  profitFactor,
  expectancy,
  peakPnL,
  currentDrawdown,
  maxDrawdown,
  lowestPoint,
  availablePhases,
  selectedPhases,
  onPhaseSelectionChange,
}: PerformanceMetricsOverviewProps) {
  return (
    <div className="space-y-10">
      {/* Redesigned KPI Section - Multi-row Layout with Grouping */}
      {closedTrades.length > 0 && (
        <div>
          {/* Row 1: Performance (Primary) */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
            {/* Net P&L - Dominant Card with Enhanced Emphasis */}
            <div className={`rounded-xl p-5 shadow-sm ${isDark ? 'bg-zinc-900 border-2 border-zinc-800' : 'bg-white border-2 border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Net P&L
              </p>
              <p className={`text-[36px] font-bold leading-none ${netPnL >= 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                {netPnL >= 0 ? '+' : '-'}₹{formatIndianCurrency(Math.abs(netPnL))}
              </p>
              <p className={`text-[11px] mt-2 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                Across {closedTradesLength} {closedTradesLength === 1 ? 'trade' : 'trades'}
              </p>
            </div>

            {/* Win Rate */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Win Rate
              </p>
              <p className={`text-2xl font-bold leading-none ${winRate >= 50 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : 'text-orange-600'}`}>
                {winRate.toFixed(1)}%
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className={`text-[11px] font-medium ${isDark ? 'text-green-500' : 'text-[#16A34A]'}`}>{winningTradesLength}W</span>
                <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>/</span>
                <span className={`text-[11px] font-medium ${isDark ? 'text-red-500' : 'text-[#DC2626]'}`}>{losingTradesLength}L</span>
              </div>
            </div>

            {/* Profit Factor */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Profit Factor
              </p>
              <p className={`text-2xl font-bold leading-none ${profitFactor >= 1 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
              </p>
            </div>

            {/* Expectancy */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Expectancy
              </p>
              <p className={`text-2xl font-bold leading-none ${expectancy >= 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                {expectancy >= 0 ? '+' : '-'}₹{formatIndianCurrency(Math.abs(expectancy))}
              </p>
            </div>
          </div>

          {/* Row 2: Risk (Secondary) */}
          <div className="grid grid-cols-3 gap-5 mb-8">
            {/* Current Drawdown */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Current Drawdown
              </p>
              <p className={`text-2xl font-bold leading-none ${currentDrawdown === 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : 'text-[#F59E0B]'}`}>
                {currentDrawdown === 0 ? '₹0' : `-₹${formatIndianCurrency(currentDrawdown)}`}
              </p>
            </div>

            {/* Max Drawdown */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Max Drawdown
              </p>
              <p className={`text-2xl font-bold leading-none ${isDark ? 'text-red-400' : 'text-[#EF4444]'}`}>
                -₹{formatIndianCurrency(maxDrawdown)}
              </p>
            </div>

            {/* Lowest Point */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Lowest Point
              </p>
              <p className={`text-2xl font-bold leading-none ${lowestPoint >= 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                {lowestPoint >= 0 ? '+' : '-'}₹{formatIndianCurrency(Math.abs(lowestPoint))}
              </p>
            </div>
          </div>

          {/* Row 3: Context (Tertiary) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Trades */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Total Trades
              </p>
              <p className={`text-2xl font-bold leading-none ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                {closedTradesLength}
              </p>
            </div>

            {/* Peak P&L */}
            <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'}`}>
              <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-500'}`}>
                Peak P&L
              </p>
              <p className={`text-2xl font-bold leading-none ${peakPnL >= 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                {peakPnL >= 0 ? '+' : '-'}₹{formatIndianCurrency(Math.abs(peakPnL))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION: Equity & Drawdown */}
      {closedTrades.length > 0 && (
        <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border border-neutral-200'}`}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Equity Curve
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {/* Phase Filter */}
                {availablePhases.length > 0 && (
                  <PhaseFilter
                    phases={availablePhases}
                    selectedPhases={selectedPhases}
                    onSelectionChange={onPhaseSelectionChange}
                    isDark={isDark}
                  />
                )}
                
                {/* Time Frame Controls */}
                <Button
                  variant={equityPnlTimeFrame === 'trades' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEquityPnlTimeFrame('trades')}
                  className="text-xs"
                >
                  Trades
                </Button>
                <Button
                  variant={equityPnlTimeFrame === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEquityPnlTimeFrame('daily')}
                  className="text-xs"
                >
                  Daily
                </Button>
                <Button
                  variant={equityPnlTimeFrame === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEquityPnlTimeFrame('weekly')}
                  className="text-xs"
                >
                  Weekly
                </Button>
                <Button
                  variant={equityPnlTimeFrame === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEquityPnlTimeFrame('monthly')}
                  className="text-xs"
                >
                  Monthly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Compact Context Stats Row */}
            <div className="grid grid-cols-4 gap-6 px-2">
              <div>
                <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mb-1`}>
                  Peak Equity
                </p>
                <p className={`text-lg font-bold ${equityStats.peakEquity >= 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                  {equityStats.peakEquity >= 0 ? '+' : ''}₹{formatIndianCurrency(Math.abs(equityStats.peakEquity))}
                </p>
              </div>
              <div>
                <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mb-1`}>
                  Current Equity
                </p>
                <p className={`text-lg font-bold ${equityStats.currentEquity >= 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                  ₹{formatIndianCurrency(equityStats.currentEquity)}
                </p>
              </div>
              <div>
                <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mb-1`}>
                  Max Drawdown
                </p>
                <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-[#EF4444]'}`}>
                  ₹{formatIndianCurrency(equityStats.maxDrawdown)}
                </p>
              </div>
              <div>
                <p className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mb-1`}>
                  {bestWorstLabels.best}
                </p>
                <p className={`text-lg font-bold ${bestValue >= 0 ? (isDark ? 'text-green-500' : 'text-[#16A34A]') : (isDark ? 'text-red-500' : 'text-[#DC2626]')}`}>
                  {bestValue >= 0 ? '+' : ''}₹{formatIndianCurrency(Math.abs(bestValue))}
                </p>
              </div>
            </div>

            {/* Equity & Drawdown Chart - Enhanced Hero */}
            <div>
              <SynchronizedEquityDrawdownChart 
                trades={closedTrades} 
                isDark={isDark} 
                timeFrame={equityPnlTimeFrame}
                sharedHoverIndex={sharedHoverIndex}
                setSharedHoverIndex={setSharedHoverIndex}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* CORE PERFORMANCE: Always Visible */}
      {closedTrades.length > 0 && (
        <div className="space-y-4">
          {/* Row 1: P&L per Trade (Outcome Layer) - Primary */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
            <CardHeader>
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                {equityPnlTimeFrame === 'trades' ? 'P&L Per Trade' :
                 equityPnlTimeFrame === 'daily' ? 'P&L Per Day' : 
                 equityPnlTimeFrame === 'weekly' ? 'P&L Per Week' : 
                 'P&L Per Month'}
              </CardTitle>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mt-1`}>
                Outcome — influenced by position size
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <PnLPerTradeChart 
                  trades={closedTrades} 
                  isDark={isDark} 
                  timeFrame={equityPnlTimeFrame}
                  sharedHoverIndex={sharedHoverIndex}
                  setSharedHoverIndex={setSharedHoverIndex}
                />
              </div>
            </CardContent>
          </Card>

          {/* Row 2: Avg Points per Trade (Consistency Layer) - Secondary */}
          <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
            <CardHeader>
              <CardTitle className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                {equityPnlTimeFrame === 'trades' ? 'Avg Points Per Lot Per Trade' :
                 equityPnlTimeFrame === 'daily' ? 'Avg Points Per Lot Per Day' : 
                 equityPnlTimeFrame === 'weekly' ? 'Avg Points Per Lot Per Week' : 
                 'Avg Points Per Lot Per Month'}
              </CardTitle>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mt-1`}>
                Execution consistency — independent of size
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <AvgPointsPerLotChart 
                  trades={closedTrades} 
                  isDark={isDark} 
                  timeFrame={equityPnlTimeFrame}
                  sharedHoverIndex={sharedHoverIndex}
                  setSharedHoverIndex={setSharedHoverIndex}
                />
              </div>
            </CardContent>
          </Card>

          {/* Row 3: P&L Distribution (Full Width) */}
          <PnLDistributionChart trades={closedTrades} isDark={isDark} />
        </div>
      )}

      {/* COLLAPSIBLE SECTION: Detailed Analysis */}
      {closedTrades.length > 0 && (
        <div className={`rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}`}>
          {/* Collapsible Header */}
          <button
            onClick={() => setIsDetailedAnalysisOpen(!isDetailedAnalysisOpen)}
            className={`w-full p-4 flex items-center justify-between hover:${isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'} transition-colors rounded-xl`}
          >
            <div className="text-left">
              <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Detailed Analysis
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-500'} mt-0.5`}>
                {isDetailedAnalysisOpen ? 'Hide advanced performance insights' : 'Show 6 additional insights'}
              </p>
            </div>
            <ChevronDown 
              className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-neutral-500'} transition-transform duration-300 ${isDetailedAnalysisOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Collapsible Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isDetailedAnalysisOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-4 pt-0 space-y-4">
              {/* Group 1: Distribution Deep Dive */}
              <div className="flex gap-4">
                {/* Overall Gross Profit and Loss - 30% */}
                <div className="w-[30%]">
                  <OverallGrossProfitLossChart trades={closedTrades} isDark={isDark} />
                </div>
                
                {/* Daily Gross Profit vs Loss Distribution - 70% */}
                <div className="w-[70%]">
                  <GrossProfitLossDistributionChart trades={closedTrades} isDark={isDark} />
                </div>
              </div>

              {/* Group 2: Risk vs Reward */}
              <div className="flex gap-4">
                {/* Avg Winners vs Avg Losers - 30% */}
                <div className="w-[30%]">
                  <AvgWinnersVsLosersChart trades={closedTrades} isDark={isDark} />
                </div>
                
                {/* Average Profit vs Loss Distribution - 70% */}
                <div className="w-[70%]">
                  <AvgWinnersVsLosersDistributionChart trades={closedTrades} isDark={isDark} />
                </div>
              </div>

              {/* Group 3: Performance Trends */}
              <div className="space-y-4">
                {/* Expectancy Trend (full width) */}
                <ExpectancyTrendChart trades={closedTrades} isDark={isDark} />
                
                {/* Win Rate Trend (full width) */}
                <WinRateTrendChart trades={closedTrades} isDark={isDark} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}