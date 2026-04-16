import { useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";

interface EmotionTableData {
  emotion: string;
  trades: number;
  percentage: number;
  winRate: number;
  avgPoints: number;
  avgPointsWin: number;
  avgPointsLoss: number;
  avgWin: number;
  avgLoss: number;
  avgPnL: number;
}

interface EmotionPhaseTableProps {
  phase: string;
  insight: string;
  data: EmotionTableData[];
  isDark: boolean;
  formatIndianCurrency: (num: number) => string;
}

export function EmotionPhaseTable({
  phase,
  insight,
  data,
  isDark,
  formatIndianCurrency
}: EmotionPhaseTableProps) {
  const [sortColumn, setSortColumn] = useState<keyof EmotionTableData>('trades');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSort = (column: keyof EmotionTableData) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc'
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  // Find extreme values for arrow indicators and bar chart scaling
  const maxPnL = Math.max(...data.map(d => d.avgPnL));
  const minPnL = Math.min(...data.map(d => d.avgPnL));
  const maxAbsPoints = Math.max(...data.map(d => Math.abs(d.avgPoints)));

  const getSortIcon = (column: keyof EmotionTableData) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Get bar width percentage for points visualization
  const getBarWidth = (points: number) => {
    if (maxAbsPoints === 0) return 0;
    return (Math.abs(points) / maxAbsPoints) * 100;
  };

  return (
    <Card className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} shadow-sm`}>
      <CardHeader className="pb-3">
        {/* Phase Title */}
        <h3 className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'} mb-2`}>
          {phase}
        </h3>
        
        {/* Insight Line with Info Icon */}
        <div className="flex items-start gap-2 relative">
          <p className={`text-sm flex-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            {insight}
          </p>
          <div 
            className="relative flex-shrink-0"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info 
              className={`w-4 h-4 cursor-help ${isDark ? 'text-zinc-500 hover:text-zinc-400' : 'text-neutral-400 hover:text-neutral-500'}`} 
            />
            {showTooltip && (
              <div 
                className={`absolute z-10 right-0 top-6 w-72 p-3 rounded-md shadow-lg text-xs leading-relaxed ${
                  isDark ? 'bg-zinc-800 border border-zinc-700 text-zinc-300' : 'bg-white border border-neutral-200 text-neutral-700'
                }`}
              >
                <p className="font-medium mb-2">Insight Explanation:</p>
                <p className="mb-1">• <strong>Dominating</strong> = highest trade frequency</p>
                <p className="mb-1">• <strong>Best performing</strong> = highest Avg PnL / Expectancy</p>
                <p className="mb-1">• <strong>Worst performing</strong> = lowest Avg PnL / Expectancy</p>
                <p className="mt-2 text-[11px] opacity-80">
                  These may differ across metrics, so the same emotion can appear in different roles.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b-2 ${isDark ? 'border-zinc-700' : 'border-neutral-300'}`}>
                <th 
                  className={`text-left py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('emotion')}
                >
                  Emotion {getSortIcon('emotion') && <span className="ml-1">{getSortIcon('emotion')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('trades')}
                >
                  Trades {getSortIcon('trades') && <span className="ml-1">{getSortIcon('trades')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('percentage')}
                >
                  % {getSortIcon('percentage') && <span className="ml-1">{getSortIcon('percentage')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('winRate')}
                >
                  Win Rate {getSortIcon('winRate') && <span className="ml-1">{getSortIcon('winRate')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('avgPoints')}
                >
                  Avg Pts (Net) {getSortIcon('avgPoints') && <span className="ml-1">{getSortIcon('avgPoints')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('avgPointsWin')}
                >
                  Avg Pts (Win) {getSortIcon('avgPointsWin') && <span className="ml-1">{getSortIcon('avgPointsWin')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('avgPointsLoss')}
                >
                  Avg Pts (Loss) {getSortIcon('avgPointsLoss') && <span className="ml-1">{getSortIcon('avgPointsLoss')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('avgWin')}
                >
                  Avg Win {getSortIcon('avgWin') && <span className="ml-1">{getSortIcon('avgWin')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('avgLoss')}
                >
                  Avg Loss {getSortIcon('avgLoss') && <span className="ml-1">{getSortIcon('avgLoss')}</span>}
                </th>
                <th 
                  className={`text-right py-3 px-3 text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-zinc-400' : 'text-neutral-600'} cursor-pointer hover:${isDark ? 'text-zinc-300' : 'text-neutral-700'} transition-colors`}
                  onClick={() => handleSort('avgPnL')}
                >
                  Avg PnL {getSortIcon('avgPnL') && <span className="ml-1">{getSortIcon('avgPnL')}</span>}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={11} 
                    className={`text-center py-8 text-sm ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}
                  >
                    No data available for this phase
                  </td>
                </tr>
              ) : (
                sortedData.map((row, idx) => (
                  <tr 
                    key={`${phase}-${row.emotion}-${idx}`}
                    className={`border-b ${isDark ? 'border-zinc-800' : 'border-neutral-100'} ${
                      idx % 2 === 0 
                        ? isDark ? 'bg-zinc-900/50' : 'bg-neutral-50/50' 
                        : ''
                    } hover:${isDark ? 'bg-zinc-800/50' : 'bg-neutral-100/50'} transition-colors`}
                  >
                    <td className={`py-2.5 px-3 text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                      {row.emotion}
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      {row.trades}
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      {row.percentage.toFixed(1)}%
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      {row.winRate.toFixed(1)}%
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right relative`}>
                      <div className="flex items-center justify-end gap-2">
                        <span className={`relative z-10 ${row.avgPoints >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'} tabular-nums font-medium`}>
                          {row.avgPoints >= 0 ? '+' : ''}{row.avgPoints.toFixed(1)}
                        </span>
                        <div className="w-16 h-5 bg-neutral-200 dark:bg-zinc-800 rounded-sm overflow-hidden">
                          <div 
                            className={`h-full ${row.avgPoints >= 0 ? 'bg-[#16A34A]' : 'bg-[#DC2626]'} transition-all`}
                            style={{ width: `${getBarWidth(row.avgPoints)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums font-medium`}>
                      <span className="text-[#16A34A]">+{row.avgPointsWin.toFixed(1)}</span>
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums font-medium`}>
                      <span className="text-[#DC2626]">{row.avgPointsLoss >= 0 ? '+' : ''}{row.avgPointsLoss.toFixed(1)}</span>
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums font-medium`}>
                      <span className="text-[#16A34A]">+{formatIndianCurrency(row.avgWin)}</span>
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums font-medium`}>
                      <span className="text-[#DC2626]">{formatIndianCurrency(row.avgLoss)}</span>
                    </td>
                    <td className={`py-2.5 px-3 text-xs text-right tabular-nums font-medium`}>
                      <span className={row.avgPnL >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {formatIndianCurrency(row.avgPnL)}
                      </span>
                      {data.length > 1 && row.avgPnL === maxPnL && maxPnL !== minPnL && (
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>↑</span>
                      )}
                      {data.length > 1 && row.avgPnL === minPnL && maxPnL !== minPnL && (
                        <span className={`text-[10px] ml-1 ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>↓</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}