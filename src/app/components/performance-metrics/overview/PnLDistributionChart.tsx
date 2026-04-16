import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Area, AreaChart } from "recharts";
import { calculatePnL } from "../../../utils/tradeCalculations";
import { ChevronDown } from "lucide-react";

interface Trade {
  id: string;
  pnl?: number;
  entryPremium: number;
  exitPremium?: number;
  action: 'buy' | 'sell';
  quantity: number;
  lotSize?: number;
  lotUnitSize?: number;
  entryDate?: string;
  exitDate?: string;
  phase?: string;
}

interface PnLDistributionChartProps {
  trades: Trade[];
  isDark: boolean;
}

type CompareBy = 'overall' | 'phase' | 'weekly' | 'monthly';

export function PnLDistributionChart({ trades, isDark }: PnLDistributionChartProps) {
  const [compareBy, setCompareBy] = useState<CompareBy>('overall');
  const [isCompareDropdownOpen, setIsCompareDropdownOpen] = useState(false);
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Calculate P&L for each trade with date and phase info
  const tradesWithPnL = trades
    .filter(t => t.exitPremium !== undefined && t.exitPremium !== null)
    .map(t => {
      const pnl = calculatePnL(t);
      
      return {
        pnl,
        date: t.exitDate || t.entryDate || new Date().toISOString(),
        phase: t.phase || 'Unknown'
      };
    });

  if (tradesWithPnL.length === 0) {
    return null;
  }

  // Helper function to get week number
  const getWeekKey = (dateStr: string) => {
    const date = new Date(dateStr);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  };

  // Helper function to get month key
  const getMonthKey = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Helper function to format period labels
  const formatPeriodLabel = (key: string, type: 'week' | 'month' | 'phase') => {
    if (type === 'phase') {
      return key;
    } else if (type === 'week') {
      const [year, week] = key.split('-W');
      return `W${week} '${year.slice(2)}`;
    } else {
      const [year, month] = key.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} '${year.slice(2)}`;
    }
  };

  // Group trades by comparison type
  const groupedTrades = useMemo(() => {
    if (compareBy === 'overall') {
      return { 'Overall': tradesWithPnL };
    } else if (compareBy === 'phase') {
      return tradesWithPnL.reduce((acc, t) => {
        const key = t.phase;
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {} as Record<string, typeof tradesWithPnL>);
    } else if (compareBy === 'weekly') {
      return tradesWithPnL.reduce((acc, t) => {
        const key = getWeekKey(t.date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {} as Record<string, typeof tradesWithPnL>);
    } else {
      return tradesWithPnL.reduce((acc, t) => {
        const key = getMonthKey(t.date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(t);
        return acc;
      }, {} as Record<string, typeof tradesWithPnL>);
    }
  }, [compareBy, tradesWithPnL]);

  // Get all available items for selection
  const availableItems = useMemo(() => {
    return Object.keys(groupedTrades).sort();
  }, [groupedTrades]);

  // Initialize selected items when compareBy changes
  useEffect(() => {
    if (compareBy === 'overall') {
      setSelectedItems(['Overall']);
    } else {
      const items = Object.keys(groupedTrades).sort();
      if (items.length > 0) {
        // Select first 3 items by default
        setSelectedItems(items.slice(0, Math.min(3, items.length)));
      }
    }
  }, [compareBy]); // Only depend on compareBy, not availableItems

  // Filter to only show selected items
  const displayedKeys = compareBy === 'overall' ? ['Overall'] : selectedItems.filter(item => availableItems.includes(item));

  // Toggle item selection (max 4 items)
  const toggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else if (selectedItems.length < 4) {
      setSelectedItems([...selectedItems, item]);
    }
  };

  // Calculate distribution data for smooth curves
  const calculateDistribution = (pnlValues: number[], binSize: number, globalMin: number, globalMax: number) => {
    const binStart = Math.floor(globalMin / binSize) * binSize;
    const binEnd = Math.ceil(globalMax / binSize) * binSize;
    
    const bins: { value: number; density: number }[] = [];
    
    for (let i = binStart; i <= binEnd; i += binSize) {
      const count = pnlValues.filter(pnl => pnl >= i && pnl < i + binSize).length;
      // Normalize by total trades to get density
      const density = count / pnlValues.length;
      bins.push({ value: i, density });
    }
    
    return bins;
  };

  // Get global min/max for consistent x-axis across all periods
  const allPnLValues = tradesWithPnL.map(t => t.pnl);
  const globalMin = Math.min(...allPnLValues);
  const globalMax = Math.max(...allPnLValues);
  const range = globalMax - globalMin;
  
  // Determine bin size
  let binSize = 500;
  if (range > 20000) {
    binSize = 2000;
  } else if (range > 10000) {
    binSize = 1000;
  } else if (range > 5000) {
    binSize = 500;
  } else if (range > 2000) {
    binSize = 200;
  } else {
    binSize = 100;
  }

  // Prepare chart data
  let chartData: any[] = [];
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  if (compareBy === 'overall') {
    const distribution = calculateDistribution(allPnLValues, binSize, globalMin, globalMax);
    chartData = distribution.map(d => ({
      pnl: d.value,
      Overall: d.density
    }));
  } else {
    // Create unified data structure with all periods
    const binStart = Math.floor(globalMin / binSize) * binSize;
    const binEnd = Math.ceil(globalMax / binSize) * binSize;
    
    // Initialize chart data with all bins
    const dataMap = new Map<number, any>();
    for (let i = binStart; i <= binEnd; i += binSize) {
      dataMap.set(i, { pnl: i });
    }
    
    // Calculate distribution for each period
    displayedKeys.forEach((periodKey) => {
      const periodPnL = groupedTrades[periodKey].map(t => t.pnl);
      const distribution = calculateDistribution(periodPnL, binSize, globalMin, globalMax);
      
      distribution.forEach(d => {
        const existing = dataMap.get(d.value) || { pnl: d.value };
        existing[periodKey] = d.density;
        dataMap.set(d.value, existing);
      });
    });
    
    chartData = Array.from(dataMap.values()).sort((a, b) => a.pnl - b.pnl);
  }

  // Format currency for axis
  const formatAxisCurrency = (value: number) => {
    if (Math.abs(value) >= 100000) {
      return `₹${(value / 100000).toFixed(0)}L`;
    } else if (Math.abs(value) >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg border p-3 shadow-lg"
          style={{
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            borderColor: isDark ? '#3f3f46' : '#e5e5e5',
          }}
        >
          <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            {formatAxisCurrency(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              <span style={{ color: entry.color }}>●</span> {entry.name}: {(entry.value * 100).toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
      <CardHeader>
        <div className="space-y-3">
          <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
            P&L Distribution
          </CardTitle>
          
          {/* Controls Row */}
          <div className="flex items-center gap-3">
            {/* Step 1: Compare By selector */}
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Compare By:</span>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCompareDropdownOpen(!isCompareDropdownOpen)}
                  className="text-xs min-w-[100px] justify-between"
                >
                  {compareBy.charAt(0).toUpperCase() + compareBy.slice(1)}
                  <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
                {isCompareDropdownOpen && (
                  <div
                    className={`absolute left-0 mt-2 w-[120px] rounded-md shadow-lg border z-50 ${
                      isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="py-1">
                      <button
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-opacity-80 ${
                          compareBy === 'overall'
                            ? isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-neutral-100 text-neutral-900'
                            : isDark ? 'text-zinc-300' : 'text-neutral-700'
                        }`}
                        onClick={() => {
                          setCompareBy('overall');
                          setIsCompareDropdownOpen(false);
                        }}
                      >
                        Overall
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-opacity-80 ${
                          compareBy === 'phase'
                            ? isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-neutral-100 text-neutral-900'
                            : isDark ? 'text-zinc-300' : 'text-neutral-700'
                        }`}
                        onClick={() => {
                          setCompareBy('phase');
                          setIsCompareDropdownOpen(false);
                        }}
                      >
                        Phase
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-opacity-80 ${
                          compareBy === 'weekly'
                            ? isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-neutral-100 text-neutral-900'
                            : isDark ? 'text-zinc-300' : 'text-neutral-700'
                        }`}
                        onClick={() => {
                          setCompareBy('weekly');
                          setIsCompareDropdownOpen(false);
                        }}
                      >
                        Weekly
                      </button>
                      <button
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-opacity-80 ${
                          compareBy === 'monthly'
                            ? isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-neutral-100 text-neutral-900'
                            : isDark ? 'text-zinc-300' : 'text-neutral-700'
                        }`}
                        onClick={() => {
                          setCompareBy('monthly');
                          setIsCompareDropdownOpen(false);
                        }}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Step 2: Item selection dropdown (only when not 'overall') */}
            {compareBy !== 'overall' && (
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Select (max 4):</span>
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsItemsDropdownOpen(!isItemsDropdownOpen)}
                    className="text-xs min-w-[100px] justify-between"
                  >
                    {selectedItems.length} Selected
                    <ChevronDown className="ml-2 h-3 w-3" />
                  </Button>
                  {isItemsDropdownOpen && (
                    <div
                      className={`absolute left-0 mt-2 w-[160px] rounded-md shadow-lg border z-50 max-h-[240px] overflow-y-auto ${
                        isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'
                      }`}
                    >
                      <div className="py-1">
                        {availableItems.map(item => (
                          <button
                            key={item}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-opacity-80 flex items-center gap-2 ${
                              selectedItems.includes(item)
                                ? isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-neutral-100 text-neutral-900'
                                : isDark ? 'text-zinc-300' : 'text-neutral-700'
                            } ${selectedItems.length >= 4 && !selectedItems.includes(item) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              toggleItem(item);
                            }}
                            disabled={selectedItems.length >= 4 && !selectedItems.includes(item)}
                          >
                            <span className="text-[10px]">{selectedItems.includes(item) ? '☑' : '☐'}</span>
                            {compareBy === 'phase' ? item : formatPeriodLabel(item, compareBy === 'weekly' ? 'week' : 'month')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ 
                top: 20, 
                right: 30, 
                left: 50, 
                bottom: 40 
              }}
            >
              <defs>
                {compareBy === 'overall' ? (
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                ) : (
                  displayedKeys.map((key, index) => (
                    <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.05}/>
                    </linearGradient>
                  ))
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e5e5e5'} opacity={0.3} />
              <XAxis
                dataKey="pnl"
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '10px' }}
                tickFormatter={formatAxisCurrency}
                opacity={0.6}
              />
              <YAxis
                stroke={isDark ? '#71717a' : '#737373'}
                style={{ fontSize: '10px' }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                width={45}
                opacity={0.6}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                x={0} 
                stroke={isDark ? '#71717a' : '#737373'} 
                strokeDasharray="3 3" 
                strokeWidth={1.5}
                opacity={0.7}
              />
              
              {compareBy === 'overall' ? (
                <Area
                  type="monotone"
                  dataKey="Overall"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#colorOverall)"
                  isAnimationActive={true}
                />
              ) : (
                displayedKeys.map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    fill={`url(#color${key})`}
                    isAnimationActive={true}
                  />
                ))
              )}
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Custom Legend Positioned Inside Chart Area */}
          <div className={`absolute top-4 right-8 flex flex-col gap-1.5 p-2 rounded-md ${
            isDark ? 'bg-zinc-900/80 border border-zinc-800' : 'bg-white/80 border border-neutral-200'
          }`}>
            {compareBy === 'overall' ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5" style={{ backgroundColor: '#3b82f6' }}></div>
                <span className={`text-[10px] ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                  Overall
                </span>
              </div>
            ) : (
              displayedKeys.map((key, index) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-6 h-0.5" style={{ backgroundColor: colors[index % colors.length] }}></div>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                    {compareBy === 'phase' ? key : formatPeriodLabel(key, compareBy === 'weekly' ? 'week' : 'month')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Summary Stats */}
        {/* Removed as requested by user */}
      </CardContent>
    </Card>
  );
}