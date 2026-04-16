import { useState, useRef, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Eye, Download, Upload, ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useTrades, Trade } from "../hooks/useTrades";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";
import { calculatePnL } from "../utils/tradeCalculations";
import { CSVValidationDialog, ValidationError, CSVValidationResult } from "./CSVValidationDialog";

export function TradeHistory() {
  const { trades: allTrades, deleteTrade } = useTrades();
  const { settings } = useSettings();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const TRADES_PER_PAGE = 50;
  
  // Filter to only show NIFTY trades (exclude BANKNIFTY, FINNIFTY, MIDCPNIFTY)
  const trades = useMemo(() => allTrades.filter(t => 
    t.symbol?.toUpperCase() === 'NIFTY' || 
    (t.instrument?.toUpperCase().includes('NIFTY') && 
     !t.instrument?.toUpperCase().includes('BANK') &&
     !t.instrument?.toUpperCase().includes('FINN') &&
     !t.instrument?.toUpperCase().includes('MIDCP'))
  ), [allTrades]);
  
  // Calculate total pages
  const totalPages = Math.ceil(trades.length / TRADES_PER_PAGE);
  
  // Reset to page 1 if current page is out of bounds (happens after deleting trades)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (trades.length === 0) {
      setCurrentPage(1);
    }
  }, [trades.length, currentPage, totalPages]);
  
  // State to track which symbols are expanded
  const [expandedSymbols, setExpandedSymbols] = useState<{ [key: string]: boolean }>({});
  // State to track which individual trades are expanded to show details
  const [expandedTrades, setExpandedTrades] = useState<{ [key: string]: boolean }>({});
  // State for sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  // State for image modal
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  // State for CSV validation
  const [showTradeValidation, setShowTradeValidation] = useState(false);
  const [tradeValidationResult, setTradeValidationResult] = useState<CSVValidationResult | null>(null);
  const [pendingTrades, setPendingTrades] = useState<Trade[]>([]);

  // Function to sort trades by entry date and time
  const sortTradesByDateTime = (tradesToSort: Trade[]) => {
    if (!sortOrder) return tradesToSort;
    
    return [...tradesToSort].sort((a, b) => {
      // Create comparable datetime strings
      const getDateTime = (trade: Trade) => {
        const dateStr = trade.timestamp || trade.day || '';
        const timeStr = trade.entryTime || '00:00';
        
        // Convert time to 24-hour format if needed
        const convertTo24Hour = (time: string): string => {
          if (time.includes('AM') || time.includes('PM')) {
            const [timeStr, period] = time.split(' ');
            let [hours, minutes] = timeStr.split(':').map(Number);
            
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }
            
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          return time;
        };
        
        const time24 = convertTo24Hour(timeStr);
        return `${dateStr} ${time24}`;
      };
      
      const dateTimeA = getDateTime(a);
      const dateTimeB = getDateTime(b);
      
      if (sortOrder === 'asc') {
        return dateTimeA.localeCompare(dateTimeB);
      } else {
        return dateTimeB.localeCompare(dateTimeA);
      }
    });
  };

  // Toggle sort order
  const toggleSort = () => {
    if (sortOrder === null) {
      setSortOrder('desc'); // First click: newest first
    } else if (sortOrder === 'desc') {
      setSortOrder('asc'); // Second click: oldest first
    } else {
      setSortOrder(null); // Third click: reset to default
    }
  };

  // Get sort icon
  const getSortIcon = () => {
    if (sortOrder === null) return <ArrowUpDown className="size-3 ml-1" />;
    if (sortOrder === 'asc') return <ArrowUp className="size-3 ml-1" />;
    return <ArrowDown className="size-3 ml-1" />;
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };
  
  // Calculate time duration in minutes
  const calculateDuration = (entryTime?: string, exitTime?: string): number | null => {
    if (!entryTime || !exitTime) return null;
    
    try {
      // Convert 12-hour format to 24-hour format if needed
      const convertTo24Hour = (time: string): string => {
        if (time.includes('AM') || time.includes('PM')) {
          const [timeStr, period] = time.split(' ');
          let [hours, minutes] = timeStr.split(':').map(Number);
          
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return time;
      };
      
      const entry24 = convertTo24Hour(entryTime);
      const exit24 = convertTo24Hour(exitTime);
      
      const [entryHour, entryMin] = entry24.split(':').map(Number);
      const [exitHour, exitMin] = exit24.split(':').map(Number);
      
      const entryMinutes = entryHour * 60 + entryMin;
      const exitMinutes = exitHour * 60 + exitMin;
      
      return exitMinutes - entryMinutes;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return null;
    }
  };
  
  // Format duration for display
  const formatDuration = (minutes: number | null): string => {
    if (minutes === null) return '—';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  // Calculate actual premium captured
  const calculatePremiumCaptured = (trade: Trade): number | null => {
    if (!trade.exitPremium) return null;
    
    // For BUY: Exit Premium - Entry Premium (positive when exit > entry)
    // For SELL: Entry Premium - Exit Premium (positive when entry > exit)
    return trade.action === 'buy' 
      ? trade.exitPremium - trade.entryPremium
      : trade.entryPremium - trade.exitPremium;
  };
  
  // Calculate moneyness
  const calculateMoneyness = (trade: Trade): string => {
    if (!trade.symbolPrice) return "N/A";
    
    const spotPrice = trade.symbolPrice;
    const strikePrice = trade.strikePrice;
    
    // Get strike interval for the symbol
    const strikeIntervals: { [key: string]: number } = {
      "NIFTY": 50,
    };
    
    const interval = strikeIntervals[trade.symbol] || 50;
    const diff = strikePrice - spotPrice;
    const strikeCount = Math.abs(Math.round(diff / interval));
    
    // Check if ATM (within half interval)
    if (Math.abs(diff) < interval / 2) {
      return "ATM";
    }
    
    // For Call options
    if (trade.optionType === "call") {
      if (diff > 0) {
        return `${strikeCount} OTM`;
      } else {
        return `${strikeCount} ITM`;
      }
    } else { // For Put options
      if (diff < 0) {
        return `${strikeCount} OTM`;
      } else {
        return `${strikeCount} ITM`;
      }
    }
  };
  
  const getMoneynessColor = (moneyness: string) => {
    if (moneyness.includes("ITM")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (moneyness === "ATM") return "text-amber-600 bg-amber-50 border-amber-200";
    if (moneyness.includes("OTM")) return "text-red-600 bg-red-50 border-red-200";
    return "text-neutral-600 bg-neutral-50 border-neutral-200";
  };

  const totalPnL = trades.reduce((sum, trade) => sum + (calculatePnL(trade) || 0), 0);
  const closedTrades = trades.filter(t => calculatePnL(t) !== undefined).length;
  const openTrades = trades.length - closedTrades;
  
  // Create a mapping from trade ID to trade number (chronological order)
  const tradeNumberMap = new Map<string, number>();
  const sortedByDate = [...trades].sort((a, b) => {
    const getDateTime = (trade: Trade) => {
      const dateStr = trade.timestamp || trade.day || '';
      const timeStr = trade.entryTime || '00:00';
      
      const convertTo24Hour = (time: string): string => {
        if (time.includes('AM') || time.includes('PM')) {
          const [timeStr, period] = time.split(' ');
          let [hours, minutes] = timeStr.split(':').map(Number);
          
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return time;
      };
      
      const time24 = convertTo24Hour(timeStr);
      return `${dateStr} ${time24}`;
    };
    
    return getDateTime(a).localeCompare(getDateTime(b));
  });
  
  sortedByDate.forEach((trade, index) => {
    tradeNumberMap.set(trade.id, index + 1);
  });
  
  // Calculate pagination - slice trades BEFORE grouping for performance
  const startIndex = (currentPage - 1) * TRADES_PER_PAGE;
  const endIndex = startIndex + TRADES_PER_PAGE;
  const paginatedTrades = useMemo(() => 
    sortTradesByDateTime(trades).slice(startIndex, endIndex),
    [trades, sortOrder, currentPage]
  );
  
  // Group paginated trades by symbol
  const groupedTrades = paginatedTrades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = [];
    }
    acc[trade.symbol].push(trade);
    return acc;
  }, {} as { [key: string]: Trade[] });
  
  // Sort symbols alphabetically
  const symbols = Object.keys(groupedTrades).sort();
  
  // Toggle symbol expansion
  const toggleSymbol = (symbol: string) => {
    setExpandedSymbols(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };
  
  // Toggle trade details expansion
  const toggleTradeDetails = (tradeId: string) => {
    setExpandedTrades(prev => ({
      ...prev,
      [tradeId]: !prev[tradeId]
    }));
  };
  
  // Toggle all symbols
  const expandAll = () => {
    const allExpanded = Object.fromEntries(symbols.map(s => [s, true]));
    setExpandedSymbols(allExpanded);
  };
  
  const collapseAll = () => {
    setExpandedSymbols({});
    setExpandedTrades({});
  };

  // Helper function to get phase details
  const getPhaseDetails = (phaseId: string | undefined) => {
    if (!phaseId || !settings.tradingPhases) return null;
    return settings.tradingPhases.find(p => p.id === phaseId);
  };

  // Clear all trades
  const handleClearAllTrades = () => {
    if (confirm('This will permanently delete all trades from your journal. This action cannot be undone. Continue?')) {
      // Clear existing trades from localStorage
      localStorage.removeItem('nifty-trades');
      
      // Reload the page to reflect changes
      window.location.reload();
    }
  };

  // Export to CSV - ONLY RAW INPUT FIELDS (No calculated values)
  const exportToCSV = () => {
    const headers = [
      // Trade identification
      'tradeId',
      'timestamp',
      'tradeNumber',
      // Trade context
      'entryDate',
      'entryTime',
      'exitDate',
      'exitTime',
      'assetClass',
      'symbol',
      'instrument',
      // Option details
      'optionType',
      'strikePrice',
      'expiryDate',
      'symbolPrice',
      // Trade entry
      'action',
      'quantity',
      'lotSize',
      'lotUnitSize',
      'entryPremium',
      'entryOrderType',
      // Trade exit
      'exitPremium',
      'exitOrderType',
      'exitReason',
      'earlyExit',
      // Planned trade
      'isPlanned',
      'planEntryPrice',
      'planExitPrice',
      'planStopLoss',
      'planLotSize',
      'planQuantity',
      'planAction',
      'planLotUnitSize',
      // Trade management
      'slModified',
      'modifiedSL',
      'slModificationReason',
      'isTrailingSL',
      // Psychology
      'entryEmotions',
      'entryEmotionNotes',
      'inTradeEmotions',
      'inTradeEmotionNotes',
      'exitEmotions',
      'exitEmotionNotes',
      'postExitEmotions',
      'postExitEmotionNotes',
      // Phase
      'phase',
      'allowedLotSize',
      // Other
      'setup',
      'totalInvested',
      'notes'
    ];

    const rows = trades.map(trade => {
      const phaseDetails = getPhaseDetails(trade.phase);
      
      return [
        // Trade identification
        trade.id,
        trade.timestamp,
        tradeNumberMap.get(trade.id) || '',
        // Trade context
        formatDate(trade.timestamp),
        trade.entryTime || '',
        trade.exitDate || '',
        trade.exitTime || '',
        trade.assetClass || '',
        trade.symbol,
        trade.instrument || '',
        // Option details
        trade.optionType || '',
        trade.strikePrice,
        trade.expiryDate,
        trade.symbolPrice || '',
        // Trade entry
        trade.action,
        trade.quantity,
        trade.lotSize || '',
        trade.lotUnitSize || '',
        trade.entryPremium,
        trade.entryOrderType || '',
        // Trade exit
        trade.exitPremium || '',
        trade.exitOrderType || '',
        trade.exitReason || '',
        trade.earlyExit ? 'Yes' : 'No',
        // Planned trade
        trade.isPlanned ? 'Yes' : 'No',
        trade.planEntryPrice || '',
        trade.planExitPrice || '',
        trade.planStopLoss || '',
        trade.planLotSize || '',
        trade.planQuantity || '',
        trade.planAction || '',
        trade.planLotUnitSize || '',
        // Trade management
        trade.slModified ? 'Yes' : 'No',
        trade.modifiedSL || '',
        trade.slModificationReason || trade.modifiedSLReason || '',
        trade.isTrailingSL ? 'Yes' : 'No',
        // Psychology
        trade.entryEmotions || '',
        trade.entryEmotionNotes || '',
        trade.inTradeEmotions || '',
        trade.inTradeEmotionNotes || '',
        trade.exitEmotions || '',
        trade.exitEmotionNotes || '',
        trade.postExitEmotions || '',
        trade.postExitEmotionNotes || '',
        // Phase
        trade.phase || '',
        trade.allowedLotSize || '',
        // Other
        trade.setup || '',
        trade.totalInvested || '',
        trade.notes || ''
      ].map(val => {
        // Escape quotes and wrap in quotes if contains comma or quotes
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trade-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import from CSV
  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          alert('CSV file is empty or invalid!');
          return;
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

        // Validate required columns
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const requiredColumns = ['symbol', 'strikePrice', 'entryPremium', 'action', 'optionType'];
        const missingRequired = requiredColumns.filter(col =>
          !headers.some(h => h.toLowerCase() === col.toLowerCase())
        );

        if (missingRequired.length > 0) {
          errors.push({
            row: 1,
            field: 'Headers',
            message: `Missing required columns: ${missingRequired.join(', ')}`,
            severity: 'error'
          });
        }
        
        // Parse rows
        const newTrades: Trade[] = [];
        const skippedTrades: string[] = [];
        let addedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;

          // Parse CSV line (handle quoted values)
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          // Create object from headers and values
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          // Check if trade already exists (skip duplicates)
          if (row.tradeId && allTrades.some(t => t.id === row.tradeId)) {
            skippedTrades.push(row.tradeId);
            continue;
          }

          // Validate required fields
          const rowErrors: ValidationError[] = [];
          const rowNumber = i + 1;

          if (!row.symbol || row.symbol.trim() === '') {
            rowErrors.push({ row: rowNumber, field: 'symbol', message: 'Required field is empty', severity: 'error' });
          }
          if (!row.strikePrice || isNaN(parseFloat(row.strikePrice))) {
            rowErrors.push({ row: rowNumber, field: 'strikePrice', message: 'Must be a valid number', severity: 'error' });
          }
          if (!row.entryPremium || isNaN(parseFloat(row.entryPremium))) {
            rowErrors.push({ row: rowNumber, field: 'entryPremium', message: 'Must be a valid number', severity: 'error' });
          }
          if (!row.action || !['buy', 'sell'].includes(row.action.toLowerCase())) {
            rowErrors.push({ row: rowNumber, field: 'action', message: 'Must be either "buy" or "sell"', severity: 'error' });
          }
          if (!row.optionType || !['call', 'put', 'ce', 'pe'].includes(row.optionType.toLowerCase())) {
            rowErrors.push({ row: rowNumber, field: 'optionType', message: 'Must be either "call"/"CE" or "put"/"PE"', severity: 'error' });
          }
          if (row.quantity && isNaN(parseInt(row.quantity))) {
            rowErrors.push({ row: rowNumber, field: 'quantity', message: 'Must be a valid number', severity: 'error' });
          }

          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
            continue; // Skip this row
          }

          // Helper to parse date from various formats
          const parseDate = (dateStr: string): string => {
            if (!dateStr) return new Date().toISOString().split('T')[0];
            
            // If already in ISO format (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
              return dateStr.split('T')[0];
            }
            
            // Parse "DD-MM-YYYY" format (e.g., "15-12-2025")
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
              const [day, month, year] = dateStr.split('-');
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            
            // Parse "23 Mar 2026" format
            try {
              const parts = dateStr.split(' ');
              if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const monthMap: {[key: string]: string} = {
                  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                  'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                  'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                };
                const month = monthMap[parts[1]];
                const year = parts[2];
                if (month && year) {
                  return `${year}-${month}-${day}`;
                }
              }
            } catch (error) {
              console.error('Error parsing date:', dateStr, error);
            }
            
            return new Date().toISOString().split('T')[0];
          };

          // Helper to derive day from date
          const getDayFromDate = (dateStr: string): string => {
            try {
              const date = new Date(dateStr);
              return date.toLocaleDateString('en-US', { weekday: 'long' });
            } catch {
              return '';
            }
          };

          // Smart timestamp handling
          let timestamp = row.timestamp?.trim();
          if (!timestamp || timestamp === '') {
            // Derive from entryDate + entryTime (match format from TradeJournal.tsx)
            const entryDate = parseDate(row.entryDate);
            const entryTime = row.entryTime?.trim() || '09:15';
            // Ensure time has seconds
            const timeWithSeconds = entryTime.includes(':') && entryTime.split(':').length === 2 
              ? `${entryTime}:00` 
              : entryTime;
            timestamp = new Date(`${entryDate}T${timeWithSeconds}`).toISOString();
          }

          // Derive day from timestamp if not provided
          const day = row.day?.trim() || getDayFromDate(timestamp);

          // Convert "Yes"/"No" to boolean
          const parseBoolean = (val: string) => val?.trim().toLowerCase() === 'yes';

          // Parse number or return undefined
          const parseNumber = (val: string) => {
            const parsed = parseFloat(val);
            return isNaN(parsed) ? undefined : parsed;
          };

          // Build trade object
          const trade: Trade = {
            id: row.tradeId || `trade-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timestamp,
            day,
            symbol: row.symbol || 'NIFTY',
            optionType: (row.optionType?.toLowerCase() as "call" | "put") || 'call',
            strikePrice: parseFloat(row.strikePrice) || 0,
            expiryDate: parseDate(row.expiryDate), // Parse and normalize expiry date
            action: (row.action?.toLowerCase() as "buy" | "sell") || 'buy',
            quantity: parseInt(row.quantity) || 0,
            entryPremium: parseFloat(row.entryPremium) || 0,
            exitPremium: parseNumber(row.exitPremium),
            entryTime: row.entryTime || '',
            exitTime: row.exitTime || '',
            exitDate: row.exitDate ? parseDate(row.exitDate) : '', // Parse and normalize exit date
            assetClass: row.assetClass || '',
            instrument: row.instrument || '',
            symbolPrice: parseNumber(row.symbolPrice),
            lotSize: parseNumber(row.lotSize),
            lotUnitSize: parseNumber(row.lotUnitSize),
            entryOrderType: row.entryOrderType as "limit" | "market" | undefined,
            exitOrderType: row.exitOrderType as "limit" | "market" | undefined,
            exitReason: row.exitReason || '',
            earlyExit: parseBoolean(row.earlyExit),
            isPlanned: parseBoolean(row.isPlanned),
            planEntryPrice: parseNumber(row.planEntryPrice),
            planExitPrice: parseNumber(row.planExitPrice),
            planStopLoss: parseNumber(row.planStopLoss),
            planLotSize: parseNumber(row.planLotSize),
            planQuantity: parseNumber(row.planQuantity),
            planAction: row.planAction as "buy" | "sell" | undefined,
            planLotUnitSize: parseNumber(row.planLotUnitSize),
            slModified: parseBoolean(row.slModified),
            modifiedSL: row.modifiedSL || '',
            slModificationReason: row.slModificationReason || '',
            isTrailingSL: parseBoolean(row.isTrailingSL),
            entryEmotions: row.entryEmotions || '',
            entryEmotionNotes: row.entryEmotionNotes || '',
            inTradeEmotions: row.inTradeEmotions || '',
            inTradeEmotionNotes: row.inTradeEmotionNotes || '',
            exitEmotions: row.exitEmotions || '',
            exitEmotionNotes: row.exitEmotionNotes || '',
            postExitEmotions: row.postExitEmotions || '',
            postExitEmotionNotes: row.postExitEmotionNotes || '',
            phase: row.phase || '',
            allowedLotSize: parseNumber(row.allowedLotSize),
            setup: row.setup || '',
            totalInvested: parseNumber(row.totalInvested),
            notes: row.notes || '',
          };

          newTrades.push(trade);
          addedCount++;
        }

        // Create preview data
        const preview = newTrades.slice(0, 5).map(t => ({
          'Symbol': t.symbol,
          'Strike': t.strikePrice,
          'Type': t.optionType,
          'Action': t.action,
          'Entry': t.entryPremium,
          'Exit': t.exitPremium || '-',
          'Date': new Date(t.timestamp).toLocaleDateString()
        }));

        // Show validation dialog
        const result: CSVValidationResult = {
          isValid: errors.length === 0,
          errors,
          warnings,
          validRowCount: newTrades.length,
          totalRowCount: lines.length - 1,
          preview
        };

        setTradeValidationResult(result);
        setPendingTrades(newTrades);
        setShowTradeValidation(true);

      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('❌ Error importing CSV file. Please check the file format and try again.');
      }
    };

    reader.readAsText(file);

    // Reset file input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirm trade import after validation
  const confirmTradeImport = () => {
    if (pendingTrades.length > 0) {
      const existingTrades = JSON.parse(localStorage.getItem('nifty-trades') || '[]');
      const updatedTrades = [...existingTrades, ...pendingTrades];
      localStorage.setItem('nifty-trades', JSON.stringify(updatedTrades));

      setShowTradeValidation(false);
      setPendingTrades([]);

      alert(`✅ Successfully imported ${pendingTrades.length} trades!`);
      window.location.reload();
    }
  };

  // TradeRow Component - Displays individual trade details
  const TradeRow = ({ trade }: { trade: Trade }) => {
    const isExpanded = expandedTrades[trade.id];
    const moneyness = calculateMoneyness(trade);
    const duration = calculateDuration(trade.entryTime, trade.exitTime);
    const premiumCaptured = calculatePremiumCaptured(trade);
    const phaseDetails = getPhaseDetails(trade.phase);
    
    const handleEdit = () => {
      // Navigate to journal page with trade ID for editing
      navigate(`/journal?edit=${trade.id}`);
    };
    
    const handleDelete = () => {
      if (confirm(`Are you sure you want to delete this trade (${formatDate(trade.timestamp)})?`)) {
        deleteTrade(trade.id);
      }
    };
    
    const pnl = calculatePnL(trade);
    
    return (
      <div className="border-b border-neutral-100 last:border-b-0">
        {/* Trading Context Badge */}
        {(trade.assetClass || trade.instrument || phaseDetails || trade.phase) && (
          <div className="px-4 pt-3 pb-2 bg-blue-50/30 border-b border-blue-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-blue-900">📍 Trading Context:</span>
              <div className="flex items-center gap-1.5 text-xs">
                {trade.assetClass && (
                  <>
                    <span className="font-medium text-blue-700">{trade.assetClass}</span>
                    <span className="text-blue-400">→</span>
                  </>
                )}
                <span className="font-medium text-blue-700">{trade.symbol}</span>
                {trade.instrument && (
                  <>
                    <span className="text-blue-400">→</span>
                    <span className="font-medium text-blue-700">{trade.instrument}</span>
                  </>
                )}
                {(phaseDetails || trade.phase) && (
                  <>
                    <span className="text-blue-400 mx-1">|</span>
                    {phaseDetails ? (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${phaseDetails.phaseType === 'Paper' ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'}`}
                      >
                        Phase {phaseDetails.phaseNumber} ({phaseDetails.phaseType})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-neutral-50 border-neutral-300 text-neutral-700">
                        Phase: {trade.phase}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Main row with horizontal scroll */}
        <div className="min-w-[1750px] grid grid-cols-[50px_100px_90px_90px_95px_95px_80px_95px_80px_95px_75px_75px_60px_70px_70px_85px_75px_100px_100px] gap-2 py-3 px-4 hover:bg-neutral-50 items-center">
          <div className="font-mono text-xs text-neutral-500">#{tradeNumberMap.get(trade.id)}</div>
          <div className="font-mono text-sm text-neutral-700">{formatDate(trade.timestamp)}</div>
          <div className="font-mono text-sm text-neutral-700">{trade.entryTime || '—'}</div>
          
          {/* Asset Class, Instrument, Phase Type */}
          <div className="text-xs text-neutral-600">{trade.assetClass || '—'}</div>
          <div className="text-xs text-neutral-600">{trade.instrument || '—'}</div>
          {phaseDetails ? (
            <Badge 
              variant="outline" 
              className={`text-xs ${phaseDetails.phaseType === 'Paper' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
            >
              {phaseDetails.phaseType}
            </Badge>
          ) : (
            <div className="text-xs text-neutral-400">—</div>
          )}

          <Badge 
            variant="outline" 
            className={`text-xs ${trade.optionType === 'call' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            {trade.strikePrice} {trade.optionType.toUpperCase()}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${moneyness.includes('ITM') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : moneyness === 'ATM' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            {moneyness}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${trade.action === 'buy' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'}`}
          >
            {trade.action.toUpperCase()}
          </Badge>
          <div className="text-sm text-neutral-700">{trade.lotSize || '—'}</div>
          <div className="text-sm font-medium text-neutral-900">₹{trade.entryPremium.toFixed(2)}</div>
          <div className="text-sm font-medium text-neutral-900">
            {trade.exitPremium ? `₹${trade.exitPremium.toFixed(2)}` : '—'}
          </div>
          <div className="text-xs text-neutral-600">{formatDuration(duration)}</div>
          <div className="text-sm font-medium text-neutral-900">
            {premiumCaptured !== null ? `${premiumCaptured >= 0 ? '+' : ''}${premiumCaptured.toFixed(2)} pts` : '—'}
          </div>
          <div className={`text-sm font-semibold ${pnl === undefined ? 'text-neutral-400' : pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {pnl !== undefined ? `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}` : 'Open'}
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              pnl === undefined 
                ? 'bg-neutral-50 border-neutral-200 text-neutral-600' 
                : pnl >= 0 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {pnl === undefined ? 'Open' : pnl >= 0 ? 'Win' : 'Loss'}
          </Badge>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleTradeDetails(trade.id)}
              className="h-7 px-2"
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-7 px-2"
            >
              <Edit2 className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-4 py-4 bg-neutral-50/50 border-t border-neutral-100 space-y-4">
            {/* Basic Trade Details */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="text-xs font-medium text-neutral-500">Symbol Price:</span>
                <p className="text-sm text-neutral-900">{trade.symbolPrice ? `₹${trade.symbolPrice}` : '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Expiry Date:</span>
                <p className="text-sm text-neutral-900">{trade.expiryDate || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Exit Date:</span>
                <p className="text-sm text-neutral-900">{trade.exitDate || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Exit Time:</span>
                <p className="text-sm text-neutral-900">{trade.exitTime || '—'}</p>
              </div>
            </div>

            {/* Order Types & Execution */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <span className="text-xs font-medium text-neutral-500">Entry Order Type:</span>
                <p className="text-sm text-neutral-900 capitalize">{trade.entryOrderType || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Exit Order Type:</span>
                <p className="text-sm text-neutral-900 capitalize">{trade.exitOrderType || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Quantity:</span>
                <p className="text-sm text-neutral-900">{trade.quantity || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">Lot Unit Size:</span>
                <p className="text-sm text-neutral-900">{trade.lotUnitSize || '—'}</p>
              </div>
            </div>

            {/* Setup & Exit Details */}
            {(trade.setup || trade.exitReason || trade.earlyExit) && (
              <div className="grid grid-cols-3 gap-4">
                {trade.setup && (
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Setup:</span>
                    <p className="text-sm text-neutral-900">{trade.setup}</p>
                  </div>
                )}
                {trade.exitReason && (
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Exit Reason:</span>
                    <p className="text-sm text-neutral-900">{trade.exitReason}</p>
                  </div>
                )}
                {trade.earlyExit && (
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Early Exit:</span>
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                      Yes
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* SL Modification Details */}
            {(trade.slModified || trade.modifiedSL || trade.isTrailingSL) && (
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">Stop Loss Management</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs font-medium text-neutral-500">SL Modified:</span>
                    <p className="text-sm text-neutral-900">{trade.slModified ? 'Yes' : 'No'}</p>
                  </div>
                  {trade.modifiedSL && (
                    <div>
                      <span className="text-xs font-medium text-neutral-500">Modified SL Value:</span>
                      <p className="text-sm text-neutral-900">{trade.modifiedSL}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Trailing SL:</span>
                    <p className="text-sm text-neutral-900">{trade.isTrailingSL ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                {(trade.slModificationReason || trade.modifiedSLReason) && (
                  <div className="mt-3">
                    <span className="text-xs font-medium text-neutral-500">SL Modification Reason:</span>
                    <p className="text-sm text-neutral-700 mt-1">{trade.slModificationReason || trade.modifiedSLReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Planned Trade Details */}
            {trade.isPlanned && (
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">📋 Planned Trade Details</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Planned Entry:</span>
                    <p className="text-sm text-neutral-900">{trade.planEntryPrice ? `₹${trade.planEntryPrice}` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Planned Exit:</span>
                    <p className="text-sm text-neutral-900">{trade.planExitPrice ? `₹${trade.planExitPrice}` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Planned SL:</span>
                    <p className="text-sm text-neutral-900">{trade.planStopLoss ? `₹${trade.planStopLoss}` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-neutral-500">Planned Lot Size:</span>
                    <p className="text-sm text-neutral-900">{trade.planLotSize || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Emotions Section */}
            {(trade.entryEmotions || trade.inTradeEmotions || trade.exitEmotions || trade.postExitEmotions) && (
              <div className="border-t border-neutral-200 pt-4">
                <h4 className="text-sm font-semibold text-neutral-700 mb-3">😊 Emotional Journey</h4>
                <div className="space-y-3">
                  {trade.entryEmotions && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-blue-900">Entry Emotions:</span>
                        <span className="text-sm text-blue-700">{trade.entryEmotions}</span>
                      </div>
                      {trade.entryEmotionNotes && (
                        <p className="text-xs text-blue-600 mt-1">{trade.entryEmotionNotes}</p>
                      )}
                    </div>
                  )}
                  {trade.inTradeEmotions && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-amber-900">In-Trade Emotions:</span>
                        <span className="text-sm text-amber-700">{trade.inTradeEmotions}</span>
                      </div>
                      {trade.inTradeEmotionNotes && (
                        <p className="text-xs text-amber-600 mt-1">{trade.inTradeEmotionNotes}</p>
                      )}
                    </div>
                  )}
                  {trade.exitEmotions && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-purple-900">Exit Emotions:</span>
                        <span className="text-sm text-purple-700">{trade.exitEmotions}</span>
                      </div>
                      {trade.exitEmotionNotes && (
                        <p className="text-xs text-purple-600 mt-1">{trade.exitEmotionNotes}</p>
                      )}
                    </div>
                  )}
                  {trade.postExitEmotions && (
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-emerald-900">Post-Exit Emotions:</span>
                        <span className="text-sm text-emerald-700">{trade.postExitEmotions}</span>
                      </div>
                      {trade.postExitEmotionNotes && (
                        <p className="text-xs text-emerald-600 mt-1">{trade.postExitEmotionNotes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {trade.notes && (
              <div className="border-t border-neutral-200 pt-4">
                <span className="text-xs font-medium text-neutral-500">Notes:</span>
                <p className="text-sm text-neutral-700 mt-1">{trade.notes}</p>
              </div>
            )}

            {/* Chart Images */}
            {(trade.symbolChart || trade.callChart || trade.putChart) && (
              <div className="border-t border-neutral-200 pt-4">
                <span className="text-xs font-medium text-neutral-500 mb-2 block">Chart Attachments:</span>
                <div className="grid grid-cols-3 gap-3">
                  {trade.symbolChart && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Symbol Chart</p>
                      <img 
                        src={trade.symbolChart} 
                        alt="Symbol Chart" 
                        className="w-full h-32 object-cover rounded border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewingImage(trade.symbolChart!)}
                      />
                    </div>
                  )}
                  {trade.callChart && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Call Chart</p>
                      <img 
                        src={trade.callChart} 
                        alt="Call Chart" 
                        className="w-full h-32 object-cover rounded border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewingImage(trade.callChart!)}
                      />
                    </div>
                  )}
                  {trade.putChart && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Put Chart</p>
                      <img 
                        src={trade.putChart} 
                        alt="Put Chart" 
                        className="w-full h-32 object-cover rounded border border-neutral-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewingImage(trade.putChart!)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Trade History</h1>
            <p className="text-sm text-neutral-600 mt-1">View and manage your trading journal</p>
          </div>
          <Link to="/journal">
            <Button>Add New Trade</Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="text-xs font-medium text-neutral-600 mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-neutral-900">{trades.length}</div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="text-xs font-medium text-neutral-600 mb-1">Closed Trades</div>
            <div className="text-2xl font-bold text-neutral-900">{closedTrades}</div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="text-xs font-medium text-neutral-600 mb-1">Open Trades</div>
            <div className="text-2xl font-bold text-neutral-900">{openTrades}</div>
          </div>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="text-xs font-medium text-neutral-600 mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalPnL)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="size-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportCSV}>
            <Upload className="size-4 mr-2" />
            Import CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="size-4 mr-2" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronUp className="size-4 mr-2" />
            Collapse All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAllTrades}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
          >
            <Trash2 className="size-4 mr-2" />
            Clear All Trades
          </Button>
        </div>
      </div>

      {/* Trades List */}
      {trades.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-neutral-600">No trades found. Start by adding your first trade!</p>
          <Link to="/journal">
            <Button className="mt-4">Add Trade</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {symbols.map(symbol => {
            const symbolTrades = groupedTrades[symbol];
            const symbolPnL = symbolTrades.reduce((sum, trade) => sum + (calculatePnL(trade) || 0), 0);
            const sortedTrades = sortTradesByDateTime(symbolTrades);
            
            return (
              <div key={symbol} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                {/* Symbol Header */}
                <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSymbol(symbol)}
                        className="h-8 w-8 p-0"
                      >
                        {expandedSymbols[symbol] ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </Button>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{symbol}</h3>
                        <p className="text-xs text-neutral-600">{symbolTrades.length} trades</p>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${symbolPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(symbolPnL)}
                    </div>
                  </div>
                </div>

                {/* Table with both horizontal and vertical scroll */}
                {expandedSymbols[symbol] && (
                  <div className="max-h-[600px] overflow-auto scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
                    <div className="min-w-[1750px]">
                      {/* Column headers */}
                      <div className="sticky top-0 z-10 grid grid-cols-[50px_100px_90px_90px_95px_95px_80px_95px_80px_95px_75px_75px_60px_70px_70px_85px_75px_100px_100px] gap-2 py-2 px-4 bg-neutral-50 border-b border-neutral-200">
                        <div className="text-xs font-medium text-neutral-600">No</div>
                        <button 
                          onClick={toggleSort}
                          className="text-xs font-medium text-neutral-600 flex items-center hover:text-neutral-900 transition-colors cursor-pointer"
                        >
                          Date {getSortIcon()}
                        </button>
                        <div className="text-xs font-medium text-neutral-600">Entry Time</div>
                        <div className="text-xs font-medium text-neutral-600">Asset Class</div>
                        <div className="text-xs font-medium text-neutral-600">Instrument</div>
                        <div className="text-xs font-medium text-neutral-600">Phase Type</div>
                        <div className="text-xs font-medium text-neutral-600">Strike</div>
                        <div className="text-xs font-medium text-neutral-600">Moneyness</div>
                        <div className="text-xs font-medium text-neutral-600">Action</div>
                        <div className="text-xs font-medium text-neutral-600">Lot Size</div>
                        <div className="text-xs font-medium text-neutral-600">Entry ₹</div>
                        <div className="text-xs font-medium text-neutral-600">Exit ₹</div>
                        <div className="text-xs font-medium text-neutral-600">Duration</div>
                        <div className="text-xs font-medium text-neutral-600">Premium</div>
                        <div className="text-xs font-medium text-neutral-600">P&L</div>
                        <div className="text-xs font-medium text-neutral-600">Status</div>
                        <div className="text-xs font-medium text-neutral-600">Actions</div>
                      </div>

                      {/* Trade rows */}
                      {sortedTrades.map(trade => (
                        <TradeRow key={trade.id} trade={trade} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {trades.length > TRADES_PER_PAGE && (
        <div className="mt-6 flex items-center justify-between bg-neutral-50 rounded-lg p-4 border border-neutral-200">
          <div className="text-sm text-neutral-600">
            Showing {startIndex + 1} - {Math.min(endIndex, trades.length)} of {trades.length} trades
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="h-8 w-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-neutral-400 px-1">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-8 w-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <img
              src={viewingImage}
              alt="Chart View"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Trade CSV Validation Dialog */}
      {tradeValidationResult && (
        <CSVValidationDialog
          isOpen={showTradeValidation}
          onClose={() => setShowTradeValidation(false)}
          onConfirm={confirmTradeImport}
          result={tradeValidationResult}
          title="Trade History Import Validation"
          isDark={isDark}
        />
      )}
    </div>
  );
}