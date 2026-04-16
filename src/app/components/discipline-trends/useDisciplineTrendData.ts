import { Trade } from "../../hooks/useTrades";
import { calculatePnL } from "../../utils/tradeCalculations";

interface TimeGroupedTrades {
  date: string;
  trades: Trade[];
  startDate: Date;
  endDate: Date;
}

export function useDisciplineTrendData(
  trades: Trade[],
  granularity: 'daily' | 'weekly' | 'monthly',
  range: string,
  selectedPhases: string[]
) {
  // Filter trades by selected phases
  const filteredTrades = selectedPhases.length > 0
    ? trades.filter(t => t.phase && selectedPhases.includes(t.phase))
    : trades;

  if (filteredTrades.length === 0) {
    return [];
  }

  // Sort trades by timestamp
  const sortedTrades = [...filteredTrades].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get date range
  const now = new Date();
  const oldestTradeDate = new Date(sortedTrades[0].timestamp);
  const newestTradeDate = new Date(sortedTrades[sortedTrades.length - 1].timestamp);

  // Calculate start date based on range filter
  let startDate = oldestTradeDate;

  if (range !== 'All Time' && range !== 'All Weeks' && range !== 'All Months') {
    const rangeValue = parseInt(range.split(' ')[1]);

    switch (granularity) {
      case 'daily':
        startDate = new Date(newestTradeDate);
        startDate.setDate(startDate.getDate() - rangeValue + 1);
        break;
      case 'weekly':
        startDate = new Date(newestTradeDate);
        startDate.setDate(startDate.getDate() - (rangeValue * 7) + 1);
        break;
      case 'monthly':
        startDate = new Date(newestTradeDate);
        startDate.setMonth(startDate.getMonth() - rangeValue + 1);
        break;
    }
  }

  // Filter trades within the range
  const rangeFilteredTrades = sortedTrades.filter(t =>
    new Date(t.timestamp).getTime() >= startDate.getTime()
  );

  // Group trades by time period
  const groupedData = groupTradesByPeriod(rangeFilteredTrades, granularity, startDate, newestTradeDate);

  return groupedData;
}

function groupTradesByPeriod(
  trades: Trade[],
  granularity: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  endDate: Date
): TimeGroupedTrades[] {
  const groups: Map<string, TimeGroupedTrades> = new Map();

  // Helper to get period key and dates
  const getPeriodInfo = (date: Date): { key: string; label: string; start: Date; end: Date } => {
    switch (granularity) {
      case 'daily': {
        const dateStr = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return { key: dateStr, label, start, end };
      }
      case 'weekly': {
        // Get week start (Monday)
        const weekStart = new Date(date);
        const day = weekStart.getDay();
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        const key = weekStart.toISOString().split('T')[0];

        return { key, label, start: weekStart, end: weekEnd };
      }
      case 'monthly': {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        return { key, label, start: monthStart, end: monthEnd };
      }
    }
  };

  // Group trades
  trades.forEach(trade => {
    const tradeDate = new Date(trade.timestamp);
    const { key, label, start, end } = getPeriodInfo(tradeDate);

    if (!groups.has(key)) {
      groups.set(key, {
        date: label,
        trades: [],
        startDate: start,
        endDate: end,
      });
    }

    groups.get(key)!.trades.push(trade);
  });

  // Convert to array and sort by date
  return Array.from(groups.values()).sort((a, b) =>
    a.startDate.getTime() - b.startDate.getTime()
  );
}

// Helper function to check if a trade has a complete plan
export function hasCompletePlan(trade: Trade): boolean {
  return trade.isPlanned === true;
}

// Helper to calculate discipline score for a period
export function calculateDisciplineScore(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  // Use simple average of key metrics (0-100 scale converted to 0-10)
  let totalScore = 0;
  let metricCount = 0;

  // 1. Stop Loss Adherence
  const slNotModified = trades.filter(t => !t.slModified).length;
  const slScore = (slNotModified / trades.length) * 100;
  totalScore += slScore;
  metricCount++;

  // 2. Trade Planning
  const planned = trades.filter(t => hasCompletePlan(t)).length;
  const planningScore = (planned / trades.length) * 100;
  totalScore += planningScore;
  metricCount++;

  // 3. Early Exit (inverse)
  const notEarlyExit = trades.filter(t => !t.earlyExit).length;
  const earlyExitScore = (notEarlyExit / trades.length) * 100;
  totalScore += earlyExitScore;
  metricCount++;

  const avgScore = totalScore / metricCount;
  return Number((avgScore / 10).toFixed(1)); // Convert to 0-10 scale
}
