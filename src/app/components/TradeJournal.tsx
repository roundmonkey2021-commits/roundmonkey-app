import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useBlocker, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Plus, FileText, Settings as SettingsIcon, BarChart3, ArrowLeft, ChevronUp, ChevronDown, Moon, Sun, Eye, Edit2, Calendar, Info, RefreshCw } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { cn } from "./ui/utils";
import { useTrades } from "../hooks/useTrades";
import { useSettings } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";
import { getAllEmotions } from "../utils/emotionLookup";

// Format number in Indian numbering system
const formatIndianNumber = (num: number): string => {
  const numStr = Math.abs(num).toFixed(0);
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return lastThree;
};

// Format date without timezone issues (returns YYYY-MM-DD in local timezone)
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate time options from 9:15 AM to 3:30 PM based on user's timeframe preference
const generateTimeOptions = (intervalMinutes: number) => {
  const times: string[] = [];
  const startHour = 9;
  const startMinute = 15;
  const endHour = 15;
  const endMinute = 30;

  for (let hour = startHour; hour <= endHour; hour++) {
    const startMin = hour === startHour ? startMinute : 0;
    const endMin = hour === endHour ? endMinute : 59;

    for (let minute = startMin; minute <= endMin; minute += intervalMinutes) {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const timeStr = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      times.push(timeStr);
    }
  }

  return times;
};

interface TradeFormData {
  date: string;
  entryTime: string;
  exitTime?: string;
  exitDate?: string;
  exitDay?: string; // NEW: Auto-calculated day from exit date
  day: string;
  assetClass: string;
  instrument: string;
  symbol: string;
  optionType: "call" | "put";
  strikePrice: string;
  expiryDate: string;
  action: "buy" | "sell";
  quantity: string;
  entryPremium: string;
  exitPremium?: string;
  entryPrice: string;
  exitPrice?: string;
  totalInvested: string;
  symbolPrice?: string;
  planEntryPrice?: string;
  planExitPrice?: string;
  planStopLoss?: string;
  planLotSize?: string;
  planQuantity?: string;
  planAction?: "buy" | "sell";
  planLotUnitSize?: string; // NEW: Units per lot (e.g., 65 for NIFTY)
  setup?: string;
  notes?: string;
  isPlanned?: boolean;
  exitReason?: string;
  earlyExit?: boolean;
  slModified?: boolean; // NEW: Was SL modified? (Yes/No)
  modifiedSL?: string; // NEW: New stop loss value
  slModificationReason?: string; // NEW: Reason for SL modification
  modifiedSLReason?: string; // LEGACY: Keep for backward compatibility
  isTrailingSL?: boolean; // NEW: Trailing SL (Yes/No)
  entryEmotions?: string;
  entryEmotionNotes?: string;
  inTradeEmotions?: string;
  inTradeEmotionNotes?: string;
  exitEmotions?: string;
  exitEmotionNotes?: string;
  postExitEmotions?: string;
  postExitEmotionNotes?: string;
  entryOrderType?: "limit" | "market";
  exitOrderType?: "limit" | "market";
  lotSize?: string;
  lotUnitSize?: string; // NEW: Units per lot for actual entry (e.g., 65 for NIFTY)
  allowedLotSize?: string;
  phase?: string;
}

export function TradeJournal() {
  const [searchParams] = useSearchParams();
  const editTradeId = searchParams.get('edit');
  const navigate = useNavigate();

  // Store the edit ID in a ref to preserve it even if URL changes
  const editTradeIdRef = useRef<string | null>(null);

  // Update ref when editTradeId changes
  useEffect(() => {
    if (editTradeId) {
      editTradeIdRef.current = editTradeId;
    }
  }, [editTradeId]);

  const { register, handleSubmit, reset, setValue, watch } = useForm<TradeFormData>({
    defaultValues: (() => {
      const today = new Date();
      return {
        date: formatDateLocal(today),
        day: today.toLocaleDateString('en-US', { weekday: 'long' }),
        entryTime: "09:15",
        assetClass: "Index",
        instrument: "Options",
        symbol: "NIFTY",
        optionType: "call",
        phase: "", // Will be set from trading phases
        allowedLotSize: "1",
        action: "buy", // Default action
        planAction: "buy", // Default plan action
      };
    })()
  });
  const { addTrade, updateTrade, trades } = useTrades();
  const { settings } = useSettings();
  const { isDark, toggleTheme } = useTheme();
  
  // Track if form has unsaved changes
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Store trade display info for edit mode
  const [editTradeDisplayInfo, setEditTradeDisplayInfo] = useState<string>('');
  
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [assetClass, setAssetClass] = useState<string>("Index");
  const [instrument, setInstrument] = useState<string>("Options");
  const [symbol, setSymbol] = useState<string>("NIFTY");
  const [phase, setPhase] = useState<string>("");

  // Load emotions from Psychology Settings for dropdowns
  const [entryEmotions, setEntryEmotions] = useState<any[]>([]);
  const [inTradeEmotions, setInTradeEmotions] = useState<any[]>([]);
  const [exitEmotions, setExitEmotions] = useState<any[]>([]);
  const [postExitEmotions, setPostExitEmotions] = useState<any[]>([]);

  // Load emotions once on mount
  useEffect(() => {
    const loadedEntryEmotions = getAllEmotions('entry');
    const loadedInTradeEmotions = getAllEmotions('inTrade');
    const loadedExitEmotions = getAllEmotions('exit');
    const loadedPostExitEmotions = getAllEmotions('postExit');

    setEntryEmotions(loadedEntryEmotions);
    setInTradeEmotions(loadedInTradeEmotions);
    setExitEmotions(loadedExitEmotions);
    setPostExitEmotions(loadedPostExitEmotions);
  }, []);

  // Current allowed lot size based on trading phase
  const currentAllowedLotSize = phase && settings.tradingPhases
    ? settings.tradingPhases.find(p => p.id === phase)?.maxLotSize || 1
    : 1;
  
  // Update allowed lot size, asset class, symbol, and instrument based on selected phase
  useEffect(() => {
    if (phase && settings.tradingPhases) {
      const selectedPhase = settings.tradingPhases.find(p => p.id === phase);
      if (selectedPhase) {
        setValue("allowedLotSize", selectedPhase.maxLotSize.toString());
        setValue("assetClass", selectedPhase.assetClass);
        setValue("symbol", selectedPhase.symbol);
        setValue("instrument", selectedPhase.instrument);
        setAssetClass(selectedPhase.assetClass);
        setSymbol(selectedPhase.symbol);
        setInstrument(selectedPhase.instrument);
      }
    }
  }, [phase, setValue, settings.tradingPhases]);
  
  // Chart attachments state
  const [symbolChart, setSymbolChart] = useState<string>("");
  const [callChart, setCallChart] = useState<string>("");
  const [putChart, setPutChart] = useState<string>("");
  
  // Block navigation if form has unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isFormDirty && !isSubmitting && currentLocation.pathname !== nextLocation.pathname
  );
  
  // Warn user before closing/refreshing page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty, isSubmitting]);
  
  // Track form changes
  useEffect(() => {
    const subscription = watch(() => {
      // Only mark as dirty if not currently submitting or resetting
      if (!isFormDirty && !isSubmitting && !isResetting) {
        setIsFormDirty(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isFormDirty, isSubmitting, isResetting]);
  
  // Load trade data when editing
  useEffect(() => {
    if (editTradeId) {
      setIsResetting(true);

      const tradeToEdit = trades.find(t => t.id === editTradeId);
      if (tradeToEdit) {
        console.log('=== EDITING TRADE ===');
        console.log('Trade emotions:', {
          entry: tradeToEdit.entryEmotions,
          inTrade: tradeToEdit.inTradeEmotions,
          exit: tradeToEdit.exitEmotions,
          postExit: tradeToEdit.postExitEmotions
        });
        console.log('Available emotion arrays:', {
          entryCount: entryEmotions.length,
          inTradeCount: inTradeEmotions.length,
          exitCount: exitEmotions.length,
          postExitCount: postExitEmotions.length
        });
        if (exitEmotions.length > 0) {
          console.log('Exit emotions available:', exitEmotions.map(e => e.type));
        }

        const tradeDate = new Date(tradeToEdit.timestamp);
        const formattedDate = formatDateLocal(tradeDate);

        const displayParts = [];
        if (tradeToEdit.date) displayParts.push(tradeToEdit.date);
        if (tradeToEdit.symbol) displayParts.push(tradeToEdit.symbol);
        if (tradeToEdit.strikePrice) displayParts.push(`${tradeToEdit.strikePrice} ${tradeToEdit.optionType.toUpperCase()}`);
        setEditTradeDisplayInfo(displayParts.join(' • '));

        // Set state variables first
        setAssetClass(tradeToEdit.assetClass || 'Index');
        setInstrument(tradeToEdit.instrument || 'Options');
        setSymbol(tradeToEdit.symbol);
        setOptionType(tradeToEdit.optionType);
        setAction(tradeToEdit.action);
        setPhase(tradeToEdit.phase || 'Phase 3');

        // Set all form values
        setTimeout(() => {
          setValue('date', formattedDate);
          setValue('entryTime', tradeToEdit.entryTime || '09:15');
          setValue('exitTime', tradeToEdit.exitTime || '');
          setValue('exitDate', tradeToEdit.exitDate || '');
          setValue('day', tradeToEdit.day || 'Monday');
          setValue('assetClass', tradeToEdit.assetClass || 'Index');
          setValue('instrument', tradeToEdit.instrument || 'Options');
          setValue('symbol', tradeToEdit.symbol);
          setValue('symbolPrice', tradeToEdit.symbolPrice?.toString() || '');
          setValue('optionType', tradeToEdit.optionType);
          setValue('strikePrice', tradeToEdit.strikePrice.toString());
          setValue('expiryDate', tradeToEdit.expiryDate);
          setValue('action', tradeToEdit.action);
          setValue('quantity', tradeToEdit.quantity.toString());
          setValue('entryPremium', tradeToEdit.entryPremium.toString());
          setValue('exitPremium', tradeToEdit.exitPremium?.toString() || '');
          setValue('entryPrice', tradeToEdit.entryPremium.toString());
          setValue('exitPrice', tradeToEdit.exitPremium?.toString() || '');
          setValue('totalInvested', tradeToEdit.totalInvested?.toString() || '');
          setValue('planEntryPrice', tradeToEdit.planEntryPrice?.toString() || '');
          setValue('planExitPrice', tradeToEdit.planExitPrice?.toString() || '');
          setValue('planStopLoss', tradeToEdit.planStopLoss?.toString() || '');
          setValue('planLotSize', tradeToEdit.planLotSize?.toString() || '');
          setValue('planLotUnitSize', tradeToEdit.planLotUnitSize?.toString() || '');
          setValue('planQuantity', tradeToEdit.planQuantity?.toString() || '');
          setValue('planAction', tradeToEdit.planAction);
          setValue('setup', tradeToEdit.setup || '');
          setValue('notes', tradeToEdit.notes || '');
          setValue('isPlanned', tradeToEdit.isPlanned || false);
          setValue('exitReason', tradeToEdit.exitReason || '');
          setValue('earlyExit', tradeToEdit.earlyExit || false);
          setValue('slModified', tradeToEdit.slModified || false);
          setValue('modifiedSL', tradeToEdit.modifiedSL || '');
          setValue('slModificationReason', tradeToEdit.slModificationReason || '');
          setValue('modifiedSLReason', tradeToEdit.modifiedSLReason || '');
          setValue('isTrailingSL', tradeToEdit.isTrailingSL || false);
          setValue('entryEmotions', tradeToEdit.entryEmotions || '');
          setValue('entryEmotionNotes', tradeToEdit.entryEmotionNotes || '');
          setValue('inTradeEmotions', tradeToEdit.inTradeEmotions || '');
          setValue('inTradeEmotionNotes', tradeToEdit.inTradeEmotionNotes || '');
          setValue('exitEmotions', tradeToEdit.exitEmotions || '');
          setValue('exitEmotionNotes', tradeToEdit.exitEmotionNotes || '');
          setValue('postExitEmotions', tradeToEdit.postExitEmotions || '');
          setValue('postExitEmotionNotes', tradeToEdit.postExitEmotionNotes || '');
          setValue('entryOrderType', tradeToEdit.entryOrderType || undefined);
          setValue('exitOrderType', tradeToEdit.exitOrderType || undefined);
          setValue('lotSize', tradeToEdit.lotSize?.toString() || '');
          setValue('lotUnitSize', tradeToEdit.lotUnitSize?.toString() || '');
          setValue('phase', tradeToEdit.phase || 'Phase 3');
          setValue('allowedLotSize', tradeToEdit.allowedLotSize?.toString() || currentAllowedLotSize.toString());

          console.log('After setting values, exitEmotions value is:', watch('exitEmotions'));

          // Load chart attachments
          if (tradeToEdit.symbolChart) setSymbolChart(tradeToEdit.symbolChart);
          if (tradeToEdit.callChart) setCallChart(tradeToEdit.callChart);
          if (tradeToEdit.putChart) setPutChart(tradeToEdit.putChart);

          setIsFormDirty(false);
          setIsResetting(false);
        }, 100);
      }
    }
  }, [editTradeId, trades, setValue, currentAllowedLotSize]);
  
  // Handle file upload for charts
  const handleChartUpload = (file: File, chartType: 'symbol' | 'call' | 'put') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (chartType === 'symbol') setSymbolChart(base64String);
      else if (chartType === 'call') setCallChart(base64String);
      else if (chartType === 'put') setPutChart(base64String);
    };
    reader.readAsDataURL(file);
  };
  
  // Remove chart
  const removeChart = (chartType: 'symbol' | 'call' | 'put') => {
    if (chartType === 'symbol') setSymbolChart("");
    else if (chartType === 'call') setCallChart("");
    else if (chartType === 'put') setPutChart("");
  };

  // Generate time options based on user's timeframe preference
  const timeOptions = generateTimeOptions(settings.timeframeMinutes);

  // Generate expiry dates based on symbol (weekly and monthly expiries)
  const generateExpiryDates = (symbol: string) => {
    const expiryConfig: { [key: string]: { weekly: number | null, monthlyDay: number, hasQuarterly?: boolean } } = {
      "NIFTY": { weekly: 2, monthlyDay: 2, hasQuarterly: true },        // Tuesday weekly, Last Tuesday monthly
    };

    const config = expiryConfig[symbol] || { weekly: 2, monthlyDay: 2 };
    const dates: string[] = [];
    const today = new Date();

    // Helper function to check if a date is the last occurrence of that day in the month
    const isLastDayOfMonth = (date: Date, targetDay: number) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const lastDayOfWeek = lastDay.getDay();
      const diff = (lastDayOfWeek - targetDay + 7) % 7;
      const lastOccurrence = new Date(year, month, lastDay.getDate() - diff);
      return date.getDate() === lastOccurrence.getDate();
    };

    // Helper function to check if a month is a quarterly month (March, June, Sep, Dec)
    const isQuarterlyMonth = (month: number) => {
      return [2, 5, 8, 11].includes(month); // 0-indexed
    };

    // Generate weekly expiries if available
    if (config.weekly !== null) {
      for (let week = 0; week < 12; week++) {
        const date = new Date(today);
        const currentDay = date.getDay();
        const daysUntilExpiry = (config.weekly - currentDay + 7) % 7 || 7;
        
        date.setDate(date.getDate() + daysUntilExpiry + (week * 7));
        
        const dateStr = date.toISOString().split('T')[0];
        let displayStr = `${dateStr} (${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`;
        
        // Check if this is the last occurrence of this day in the month
        if (isLastDayOfMonth(date, config.weekly)) {
          // Check if it's also a quarterly month
          if (config.hasQuarterly && isQuarterlyMonth(date.getMonth())) {
            displayStr += ' - Quarterly';
          } else {
            displayStr += ' - Monthly';
          }
        }
        
        dates.push(dateStr + '|' + displayStr);
      }
    } else {
      // For symbols without weekly expiries, generate monthly expiries only
      for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const lastDayOfWeek = lastDay.getDay();
        const diff = (lastDayOfWeek - config.monthlyDay + 7) % 7;
        const lastDayExpiry = new Date(date.getFullYear(), date.getMonth(), lastDay.getDate() - diff);
        
        // Only add if it's in the future
        if (lastDayExpiry >= today) {
          const dateStr = lastDayExpiry.toISOString().split('T')[0];
          const displayStr = `${dateStr} (${lastDayExpiry.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}) - Monthly`;
          dates.push(dateStr + '|' + displayStr);
        }
      }
    }

    // Sort dates chronologically
    dates.sort((a, b) => {
      const dateA = a.split('|')[0];
      const dateB = b.split('|')[0];
      return dateA.localeCompare(dateB);
    });

    return dates;
  };

  const expiryOptions = generateExpiryDates(symbol);

  // Helper function to convert time to 24-hour format (handles both 12-hour and 24-hour inputs)
  const convertTo24Hour = (timeStr: string): string => {
    // If already in 24-hour format (HH:MM), just add seconds
    if (!timeStr.includes(' ')) {
      const [hours, minutes] = timeStr.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
    }
    
    // Convert from 12-hour format (HH:MM AM/PM)
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (period === 'PM' && hours !== '12') {
      hours = String(parseInt(hours) + 12);
    } else if (period === 'AM' && hours === '12') {
      hours = '00';
    }
    
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  const onSubmit = (data: TradeFormData) => {
    setIsSubmitting(true); // Mark as submitting to prevent navigation warnings
    
    const entryTime24 = convertTo24Hour(data.entryTime);
    const exitTime24 = data.exitTime ? convertTo24Hour(data.exitTime) : null;
    
    // Auto-populate exitDate if exitPremium is provided but exitDate is not
    let exitDate = data.exitDate;
    if (data.exitPremium && !exitDate) {
      exitDate = data.date; // Default to entry date if not specified
    }
    
    const tradeData = {
      timestamp: new Date(`${data.date}T${entryTime24}`).toISOString(),
      symbol: data.symbol,
      optionType: data.optionType,
      strikePrice: parseFloat(data.strikePrice),
      expiryDate: data.expiryDate,
      action: data.action,
      quantity: parseInt(data.quantity),
      entryPremium: parseFloat(data.entryPremium),
      exitPremium: data.exitPremium ? parseFloat(data.exitPremium) : undefined,
      entryPrice: parseFloat(data.entryPrice),
      exitPrice: data.exitPrice ? parseFloat(data.exitPrice) : undefined,
      entryTime: data.entryTime,
      exitTime: data.exitTime,
      exitDate: exitDate,
      exitReason: data.exitReason,
      earlyExit: data.earlyExit,
      slModified: data.slModified, // FIXED: Add "Was SL Modified?" radio value
      modifiedSL: data.modifiedSL, // New SL value (text input)
      slModificationReason: data.slModificationReason, // Reason for SL modification
      modifiedSLReason: data.modifiedSLReason, // LEGACY compatibility
      isTrailingSL: data.isTrailingSL, // FIXED: Add "Trailing SL" radio value
      entryEmotions: data.entryEmotions,
      entryEmotionNotes: data.entryEmotionNotes,
      inTradeEmotions: data.inTradeEmotions,
      inTradeEmotionNotes: data.inTradeEmotionNotes,
      exitEmotions: data.exitEmotions,
      exitEmotionNotes: data.exitEmotionNotes,
      postExitEmotions: data.postExitEmotions,
      postExitEmotionNotes: data.postExitEmotionNotes,
      totalInvested: parseFloat(data.totalInvested),
      symbolPrice: data.symbolPrice ? parseFloat(data.symbolPrice) : undefined,
      planEntryPrice: data.planEntryPrice ? parseFloat(data.planEntryPrice) : undefined,
      planExitPrice: data.planExitPrice ? parseFloat(data.planExitPrice) : undefined,
      planStopLoss: data.planStopLoss ? parseFloat(data.planStopLoss) : undefined,
      planLotSize: data.planLotSize ? parseFloat(data.planLotSize) : undefined,
      planQuantity: data.planQuantity ? parseInt(data.planQuantity) : undefined,
      planAction: data.planAction,
      planLotUnitSize: data.planLotUnitSize ? parseInt(data.planLotUnitSize) : undefined,
      setup: data.setup,
      notes: data.notes,
      isPlanned: data.isPlanned,
      assetClass: data.assetClass,
      instrument: data.instrument,
      day: data.day,
      symbolChart: symbolChart || undefined,
      callChart: callChart || undefined,
      putChart: putChart || undefined,
      entryOrderType: data.entryOrderType,
      exitOrderType: data.exitOrderType,
      lotSize: data.lotSize ? parseInt(data.lotSize) : undefined,
      lotUnitSize: data.lotUnitSize ? parseInt(data.lotUnitSize) : undefined,
      allowedLotSize: data.allowedLotSize ? parseInt(data.allowedLotSize) : currentAllowedLotSize,
      phase: data.phase,
    };
    
    // Use the ref value which is preserved even if URL changes
    const currentEditId = editTradeIdRef.current;

    if (currentEditId) {
      // Update existing trade
      updateTrade(currentEditId, tradeData);
      alert('Trade updated successfully!');
    } else {
      // Create new trade
      const trade = {
        id: Date.now().toString(),
        ...tradeData
      };
      addTrade(trade);
      alert('Trade added successfully!');
    }

    // Reset form and navigate back to history
    setIsResetting(true); // Prevent dirty flag during reset
    reset({
      date: formatDateLocal(new Date()),
      entryTime: "9:15 AM",
      assetClass: "Index",
      instrument: "Options",
      symbol: "NIFTY",
      optionType: "call",
      day: "Monday",
      phase: "",
      allowedLotSize: "1",
      action: "buy",
      planAction: "buy",
    });
    setOptionType("call");
    setAction("buy");
    setAssetClass("Index");
    setInstrument("Options");
    setSymbol("NIFTY");
    setPhase("");
    setSymbolChart("");
    setCallChart("");
    setPutChart("");

    // Mark form as clean after successful submission
    setIsFormDirty(false);
    setIsSubmitting(false);
    setTimeout(() => setIsResetting(false), 100); // Reset flag after React processes updates

    // Navigate back to history if editing (use saved value)
    if (currentEditId) {
      editTradeIdRef.current = null; // Clear the ref
      window.location.href = '/history';
    }
  };
  
  // Function to reset form to initial state
  const handleNewTrade = () => {
    if (isFormDirty) {
      const confirmReset = window.confirm(
        "You have unsaved changes. Are you sure you want to start a new trade? All current data will be lost."
      );
      if (!confirmReset) return;
    }
    
    setIsResetting(true); // Prevent dirty flag during reset
    const today = new Date();
    reset({
      date: formatDateLocal(today),
      day: today.toLocaleDateString('en-US', { weekday: 'long' }),
      entryTime: "09:15",
      assetClass: "Index",
      instrument: "Options",
      symbol: "NIFTY",
      optionType: "call",
      phase: "",
      allowedLotSize: "1",
      action: "buy",
      planAction: "buy",
    });
    setOptionType("call");
    setAction("buy");
    setAssetClass("Index");
    setInstrument("Options");
    setSymbol("NIFTY");
    setPhase("");
    setSymbolChart("");
    setCallChart("");
    setPutChart("");
    setIsFormDirty(false);
    setIsSubmitting(false);
    setTimeout(() => setIsResetting(false), 100); // Reset flag after React processes updates
  };

  // Handle Cancel Edit - discard changes and go back to history
  const handleCancelEdit = () => {
    setIsResetting(true); // Prevent dirty flag during cancel
    setIsFormDirty(false); // Clear dirty flag BEFORE navigation to prevent blocker
    setTimeout(() => {
      navigate('/history');
      setIsResetting(false);
    }, 0);
  };

  return (
    <div className={`${isDark ? 'bg-zinc-950' : 'bg-neutral-50'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}`}>
        <div className="px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              {editTradeId && (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-2 ${
                  isDark ? 'bg-blue-900/50 text-blue-300 border border-blue-700' : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Editing: {editTradeDisplayInfo || 'Trade'}
                </div>
              )}
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {editTradeId ? 'Edit Trade' : 'New Trade Entry'}
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                {editTradeId ? 'Update your trade details' : 'Record your trade details for analysis'}
              </p>
            </div>
            {!editTradeId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleNewTrade}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                New Trade
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-6 pb-12">
        <form onSubmit={handleSubmit(onSubmit)} className={`border rounded-lg p-6 transition-colors duration-200 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'
        }`}>
          <div className="space-y-6">
            {/* ========================================
                TRADE CONTEXT SECTION
                ======================================== */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-300">
                <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                  Trade Context
                </h3>
              </div>

              {/* 1. PHASE - Primary Field (Mandatory) */}
              <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                <div className="space-y-2">
                  <Label htmlFor="phase" className="text-sm font-semibold text-blue-900">
                    Trading Phase <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={phase}
                    onValueChange={(value: string) => {
                      setPhase(value);
                      setValue("phase", value);
                    }}
                  >
                    <SelectTrigger id="phase" className="bg-white border-blue-300">
                      <SelectValue placeholder="Select a trading phase to continue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {settings.tradingPhases && settings.tradingPhases.length > 0 ? (
                        settings.tradingPhases.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            Phase {p.phaseNumber} ({p.phaseType}) - {p.assetClass} → {p.symbol} → {p.instrument} ({p.maxLotSize} lot max)
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No phases defined - Go to Settings</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {!phase && (
                    <p className="text-xs text-blue-700 mt-1">
                      ⚠️ All other fields will be enabled after selecting a phase
                    </p>
                  )}
                </div>
              </div>

              {/* 2. AUTO-POPULATED FIELDS - Read-only after Phase selection */}
              <div className="grid grid-cols-3 gap-4 p-4 border border-neutral-300 rounded-lg bg-neutral-100">
                <div className="space-y-2">
                  <Label htmlFor="assetClass-display" className="text-sm text-neutral-600">
                    Asset Class
                  </Label>
                  <Input
                    id="assetClass-display"
                    value={assetClass || '—'}
                    disabled
                    className="bg-neutral-50 text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="symbol-display" className="text-sm text-neutral-600">
                    Symbol
                  </Label>
                  <Input
                    id="symbol-display"
                    value={symbol || '—'}
                    disabled
                    className="bg-neutral-50 text-neutral-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instrument-display" className="text-sm text-neutral-600">
                    Instrument
                  </Label>
                  <Input
                    id="instrument-display"
                    value={instrument || '—'}
                    disabled
                    className="bg-neutral-50 text-neutral-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* 3. OPTION DETAILS */}
              {instrument === "Options" && (
                <div className="p-4 border border-neutral-200 rounded-lg space-y-4">
                  {/* Row 1: Spot Price, Option Type, Strike Price */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbolPrice" className="text-sm text-neutral-700">Spot Price</Label>
                      <Input
                        id="symbolPrice"
                        type="number"
                        step="0.05"
                        {...register("symbolPrice")}
                        placeholder="24500.50"
                        className="font-mono"
                        disabled={!phase}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="optionType" className="text-sm text-neutral-700">Option Type</Label>
                      <Select
                        value={optionType}
                        onValueChange={(value: "call" | "put") => {
                          setOptionType(value);
                          setValue("optionType", value);
                        }}
                        disabled={!phase}
                      >
                        <SelectTrigger id="optionType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Call</SelectItem>
                          <SelectItem value="put">Put</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="strikePrice" className="text-sm text-neutral-700">Strike Price</Label>
                      <Input
                        id="strikePrice"
                        type="number"
                        step="0.05"
                        {...register("strikePrice", { required: "Strike price is required" })}
                        placeholder="24500"
                        className="font-mono"
                        disabled={!phase}
                      />
                    </div>
                  </div>

                  {/* Row 2: Moneyness, Expiry Date, Days to Expiry */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-neutral-700">
                        Moneyness
                        <span className="text-xs text-neutral-500 ml-2">(Auto-calculated from strike & spot)</span>
                      </Label>
                      <div className="h-11 px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50 flex items-center justify-center cursor-not-allowed">
                        {(() => {
                          const symbolPrice = watch("symbolPrice");
                          const strikePrice = watch("strikePrice");
                          
                          if (!symbolPrice || !strikePrice) {
                            return <span className="text-sm text-neutral-400">
                              {!symbolPrice ? "Enter spot price" : "—"}
                            </span>;
                          }

                          const spot = parseFloat(symbolPrice);
                          const strike = parseFloat(strikePrice);
                          
                          // Get strike interval for the symbol
                          const strikeIntervals: { [key: string]: number } = {
                            "NIFTY": 50,
                          };
                          
                          const interval = strikeIntervals[symbol] || 50;
                          const diff = strike - spot;
                          const strikeCount = Math.abs(Math.round(diff / interval));
                          
                          let moneyness = "";
                          let colorClass = "";
                          
                          if (Math.abs(diff) < interval / 2) {
                            moneyness = "ATM";
                            colorClass = "text-blue-700 font-medium";
                          } else if (optionType === "call") {
                            if (diff > 0) {
                              moneyness = `${strikeCount} OTM`;
                              colorClass = "text-orange-700 font-medium";
                            } else {
                              moneyness = `${strikeCount} ITM`;
                              colorClass = "text-green-700 font-medium";
                            }
                          } else { // put
                            if (diff < 0) {
                              moneyness = `${strikeCount} OTM`;
                              colorClass = "text-orange-700 font-medium";
                            } else {
                              moneyness = `${strikeCount} ITM`;
                              colorClass = "text-green-700 font-medium";
                            }
                          }
                          
                          return <span className={`text-sm ${colorClass}`}>{moneyness}</span>;
                        })()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiryDate" className="text-sm text-neutral-700">Expiry Date</Label>
                      <Popover>
                        <PopoverTrigger
                          type="button"
                          className={cn(
                            "flex h-11 w-full items-center justify-start rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            !watch("expiryDate") && "text-neutral-400",
                            !phase && "opacity-50 cursor-not-allowed"
                          )}
                          disabled={!phase}
                        >
                          <Calendar className="mr-2 size-4" />
                          {watch("expiryDate") ? new Date(watch("expiryDate")).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Select expiry"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={watch("expiryDate") ? new Date(watch("expiryDate")) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = formatDateLocal(date);
                                setValue("expiryDate", formattedDate);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-neutral-700">
                        Days to Expiry
                        <span className="text-xs text-neutral-500 ml-2">(Auto-calculated from entry & expiry)</span>
                      </Label>
                      <div className="h-11 px-3 py-2 border border-neutral-200 rounded-md bg-neutral-50 flex items-center justify-center cursor-not-allowed">
                        {(() => {
                          const entryDate = watch("date");
                          const expiryDate = watch("expiryDate");
                          
                          if (!entryDate || !expiryDate) {
                            return <span className="text-sm text-neutral-400">—</span>;
                          }

                          const entry = new Date(entryDate);
                          const expiry = new Date(expiryDate);
                          
                          // Calculate difference in days
                          const diffTime = expiry.getTime() - entry.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          let colorClass = "text-neutral-700 font-medium";
                          if (diffDays <= 0) {
                            colorClass = "text-red-700 font-medium";
                          } else if (diffDays <= 7) {
                            colorClass = "text-orange-700 font-medium";
                          } else {
                            colorClass = "text-green-700 font-medium";
                          }
                          
                          return <span className={`text-sm ${colorClass}`}>
                            {diffDays} {diffDays === 1 ? 'day' : 'days'}
                          </span>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. TRADE ACTION */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="action" className="text-sm text-neutral-700">Action</Label>
                  <Select
                    value={action}
                    onValueChange={(value: "buy" | "sell") => {
                      setAction(value);
                      setValue("action", value);
                    }}
                    disabled={!phase}
                  >
                    <SelectTrigger id="action" className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 5. SETUP */}
              <div className="p-4 border border-neutral-200 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="setup" className="text-sm text-neutral-700">Setup/Strategy</Label>
                  <Input
                    id="setup"
                    type="text"
                    {...register("setup")}
                    placeholder="Enter strategy name (e.g., Breakout, Reversal)"
                    disabled={!phase}
                    className="font-mono"
                  />
                  <p className="text-xs text-neutral-500">Type a custom strategy name or link with Settings in future updates</p>
                </div>
              </div>

              {/* 6. PHASE INFO PANEL - Display only */}
              {phase && settings.tradingPhases && (
                <div className="p-4 border border-green-300 rounded-lg bg-green-50">
                  <h4 className="text-sm font-semibold text-green-900 mb-3">Phase Information</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(() => {
                      const selectedPhase = settings.tradingPhases.find(p => p.id === phase);
                      return selectedPhase ? (
                        <>
                          <div>
                            <p className="text-xs text-green-700">Allowed Lot Size</p>
                            <p className="text-lg font-semibold text-green-900">{selectedPhase.maxLotSize}</p>
                          </div>
                          <div>
                            <p className="text-xs text-green-700">Phase Type</p>
                            <p className="text-lg font-semibold text-green-900">{selectedPhase.phaseType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-green-700">Starting Capital</p>
                            <p className="text-lg font-semibold text-green-900">
                              ₹{formatIndianNumber(selectedPhase.startingCapital)}
                            </p>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* 7. TRADE NUMBER - Display only */}
              <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-600">Trade Number</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    #{editTradeId ? trades.findIndex(t => t.id === editTradeId) + 1 : trades.length + 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Planned Trade Header - Always visible */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-5">
              {/* Header with inline radio buttons */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-blue-900">Planned Trade</h3>
                  <RadioGroup 
                    value={watch("isPlanned") ? "yes" : "no"}
                    onValueChange={(value) => setValue("isPlanned", value === "yes")}
                    disabled={!phase}
                    className="flex gap-6"
                  >
                    <label htmlFor="planned-yes" className="flex items-center gap-2.5 cursor-pointer">
                      <RadioGroupItem 
                        value="yes" 
                        id="planned-yes" 
                        disabled={!phase}
                        className="size-5 border-2 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                      />
                      <span className="text-sm font-medium text-neutral-700 select-none">
                        Yes
                      </span>
                    </label>
                    <label htmlFor="planned-no" className="flex items-center gap-2.5 cursor-pointer">
                      <RadioGroupItem 
                        value="no" 
                        id="planned-no" 
                        disabled={!phase}
                        className="size-5 border-2 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                      />
                      <span className="text-sm font-medium text-neutral-700 select-none">
                        No
                      </span>
                    </label>
                  </RadioGroup>
                </div>
                <div className="border-b border-blue-300 mb-4"></div>
              </div>

              {/* Planned Trade Section - Shows when Planned = Yes */}
              {watch("isPlanned") && (
                <>
                {/* 1. PRICE PLAN */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-blue-800">Price Plan</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Planned Entry Premium */}
                    <div className="space-y-1.5">
                      <Label htmlFor="planEntryPrice" className="text-xs text-neutral-700">Planned Entry Premium</Label>
                      <Input
                        id="planEntryPrice"
                        type="number"
                        step="1"
                        {...register("planEntryPrice")}
                        placeholder="150"
                        className="font-mono h-9 text-sm"
                      />
                    </div>

                    {/* Planned Target Premium */}
                    <div className="space-y-1.5">
                      <Label htmlFor="planExitPrice" className="text-xs text-neutral-700">Planned Target Premium</Label>
                      <Input
                        id="planExitPrice"
                        type="number"
                        step="1"
                        {...register("planExitPrice")}
                        placeholder="175"
                        className="font-mono h-9 text-sm"
                      />
                    </div>

                    {/* Planned Stop Loss */}
                    <div className="space-y-1.5">
                      <Label htmlFor="planStopLoss" className="text-xs text-neutral-700">Planned Stop Loss</Label>
                      <Input
                        id="planStopLoss"
                        type="number"
                        step="1"
                        {...register("planStopLoss")}
                        placeholder="140"
                        className="font-mono h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. POSITION PLAN */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-blue-800">Position Plan</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Plan No of Lots */}
                    <div className="space-y-1.5">
                      <Label htmlFor="planLotSize" className="text-xs text-neutral-700">Plan No of Lots</Label>
                      <Input
                        id="planLotSize"
                        type="number"
                        {...register("planLotSize")}
                        placeholder="1"
                        className="font-mono h-9 text-sm"
                      />
                    </div>

                    {/* Plan Lot Size */}
                    <div className="space-y-1.5">
                      <Label htmlFor="planLotUnitSize" className="text-xs text-neutral-700">
                        Plan Lot Size <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="planLotUnitSize"
                        type="number"
                        {...register("planLotUnitSize")}
                        placeholder="65"
                        className="font-mono h-9 text-sm"
                      />
                      <p className="text-xs text-neutral-500">Units per lot (e.g., 65 for NIFTY)</p>
                    </div>

                    {/* Plan Quantity (AUTO-CALCULATED) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="planQuantity" className="text-xs text-neutral-700">Plan Quantity</Label>
                      <Input
                        id="planQuantity"
                        type="number"
                        value={(() => {
                          const lots = watch("planLotSize");
                          const lotUnitSize = watch("planLotUnitSize");
                          if (lots && lotUnitSize) {
                            const qty = parseInt(lots) * parseInt(lotUnitSize);
                            if (watch("planQuantity") !== qty.toString()) {
                              setValue("planQuantity", qty.toString());
                            }
                            return qty;
                          }
                          return watch("planQuantity") || "";
                        })()}
                        placeholder="Auto"
                        className="font-mono h-9 text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed border-neutral-200"
                        readOnly
                        disabled
                      />
                      <p className="text-[10px] text-neutral-400">Auto-calculated</p>
                    </div>
                  </div>
                </div>

                {/* 3. PLAN ACTION */}
                <div className="space-y-2.5 pt-2 border-t border-blue-200/50">
                  <h4 className="text-sm font-medium text-blue-800">Plan Action</h4>
                  <RadioGroup 
                    value={watch("planAction") || "buy"}
                    onValueChange={(value) => setValue("planAction", value as "buy" | "sell")}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="buy" id="plan-action-buy" />
                      <Label htmlFor="plan-action-buy" className="text-sm text-neutral-700 cursor-pointer">
                        Buy
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="sell" id="plan-action-sell" />
                      <Label htmlFor="plan-action-sell" className="text-sm text-neutral-700 cursor-pointer">
                        Sell
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                  
                {/* 4. CAPITAL */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-blue-800">Capital</h4>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-700">Planned Capital Required</Label>
                    <div className="px-3 py-2.5 rounded-md bg-neutral-50/70 border border-neutral-200">
                      {(() => {
                        const entry = watch("planEntryPrice");
                        const quantity = watch("planQuantity");
                        if (entry && quantity) {
                          const capital = parseFloat(entry) * parseInt(quantity);
                          return (
                            <span className="text-lg font-mono font-bold text-blue-700">
                              ₹{formatIndianNumber(capital)}
                            </span>
                          );
                        }
                        return <span className="text-sm text-neutral-400">Enter Entry Price and Quantity</span>;
                      })()}
                    </div>
                  </div>
                </div>
                  
                {/* 5. RISK:REWARD ANALYSIS */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-blue-800">Risk:Reward Analysis</h4>
                  <div className="px-4 py-4 border border-blue-200 rounded-md bg-white">
                    {(() => {
                      const entryPrice = watch("planEntryPrice");
                      const exitPrice = watch("planExitPrice");
                      const stopLoss = watch("planStopLoss");
                      const quantity = watch("planQuantity");
                      const tradeAction = watch("planAction") || "buy";
                      
                      if (entryPrice && exitPrice && stopLoss) {
                        const entry = parseFloat(entryPrice);
                        const exit = parseFloat(exitPrice);
                        const stop = parseFloat(stopLoss);
                        const qty = quantity ? parseInt(quantity) : 1;
                        
                        // Calculate risk and reward based on Buy or Sell
                        let rewardPoints, riskPoints;
                        if (tradeAction === "buy") {
                          rewardPoints = exit - entry;  // Target - Entry
                          riskPoints = entry - stop;    // Entry - SL
                        } else {
                          rewardPoints = entry - exit;  // Entry - Target (inverted for sell)
                          riskPoints = stop - entry;    // SL - Entry (inverted for sell)
                        }
                        
                        // Show error messages for invalid setups
                        if (riskPoints <= 0) {
                          return (
                            <div className="text-sm text-red-600 text-center py-2 space-y-1">
                              <div className="font-semibold">⚠️ Invalid Stop Loss</div>
                              <div className="text-xs">
                                {tradeAction === "buy" 
                                  ? "For BUY trades: Stop Loss must be BELOW Entry Price" 
                                  : "For SELL trades: Stop Loss must be ABOVE Entry Price"}
                              </div>
                            </div>
                          );
                        }
                        
                        if (rewardPoints <= 0) {
                          return (
                            <div className="text-sm text-amber-600 text-center py-2 space-y-1">
                              <div className="font-semibold">⚠️ Invalid Target</div>
                              <div className="text-xs">
                                {tradeAction === "buy" 
                                  ? "For BUY trades: Target must be ABOVE Entry Price" 
                                  : "For SELL trades: Target must be BELOW Entry Price"}
                              </div>
                            </div>
                          );
                        }
                        
                        const ratio = rewardPoints / riskPoints;
                        const isPositiveRR = ratio > 0;
                        
                        const riskMoney = Math.abs(riskPoints * qty);
                        const rewardMoney = Math.abs(rewardPoints * qty);
                        
                        // Calculate ROI percentages
                        const riskROI = (Math.abs(riskPoints) / entry) * 100;
                        const rewardROI = (Math.abs(rewardPoints) / entry) * 100;
                        
                        return (
                          <div className="space-y-3.5">
                            {/* Group 1: Ratio (highlighted) */}
                            <div className="flex items-center justify-center pb-3 border-b border-blue-100/60">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-600">Ratio:</span>
                                <span className={`text-2xl font-mono font-bold ${isPositiveRR ? 'text-green-600' : 'text-red-600'}`}>
                                  1:{ratio.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Group 2: Points */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">Risk (pts):</span>
                                <span className="text-sm font-mono font-semibold text-red-600">{Math.abs(riskPoints).toFixed(1)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">Reward (pts):</span>
                                <span className="text-sm font-mono font-semibold text-green-600">{Math.abs(rewardPoints).toFixed(1)}</span>
                              </div>
                            </div>
                            
                            {/* Group 3: Money */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-100/60">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">Risk (₹):</span>
                                <span className="text-base font-mono font-bold text-red-600">₹{formatIndianNumber(riskMoney)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">Reward (₹):</span>
                                <span className="text-base font-mono font-bold text-green-600">₹{formatIndianNumber(rewardMoney)}</span>
                              </div>
                            </div>
                            
                            {/* Group 4: ROI */}
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-100/60">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">Risk ROI:</span>
                                <span className="text-sm font-mono font-semibold text-red-600">{riskROI.toFixed(1)}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-neutral-500">Reward ROI:</span>
                                <span className="text-sm font-mono font-semibold text-green-600">{rewardROI.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return <div className="text-sm text-neutral-400 text-center py-2">Enter Entry, Target, and SL to see Risk:Reward analysis</div>;
                    })()}
                  </div>
                </div>
                </>
              )}
            </div>

            {/* STEP 3: TRADE ENTRY */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-5">
              {/* Header */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Trade Entry</h3>
                <div className="border-b border-neutral-300 mb-4"></div>
              </div>
              
              <div className="space-y-5">
                {/* 1. ENTRY DETAILS */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Entry Details</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {/* Entry Date */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-neutral-700">Entry Date</Label>
                      <Popover>
                        <PopoverTrigger
                          type="button"
                          className={cn(
                            "flex h-9 w-full items-center justify-start rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            !watch("date") && "text-neutral-400"
                          )}
                        >
                          <Calendar className="mr-2 size-4" />
                          {watch("date") ? new Date(watch("date")).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Select date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={watch("date") ? new Date(watch("date")) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = formatDateLocal(date);
                                setValue("date", formattedDate);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                                setValue("day", dayName);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Day (Auto-calculated) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="day" className="text-xs text-neutral-700">Day</Label>
                      <Input
                        id="day"
                        type="text"
                        value={watch("day")}
                        readOnly
                        disabled
                        className="h-9 text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed border-neutral-200"
                      />
                      <p className="text-[10px] text-neutral-400">Auto-calculated from date</p>
                    </div>

                    {/* Entry Time */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="entryTime" className="text-xs text-neutral-700">Entry Time</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex items-center">
                              <Info className="size-3 text-neutral-400 hover:text-neutral-600 transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] bg-neutral-800 text-white">
                            <div className="text-xs space-y-1">
                              <p className="font-medium">Select hours and minutes</p>
                              <p className="text-neutral-300">24-hour format</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={watch("entryTime")?.includes(":") ? watch("entryTime").split(":")[0] : undefined}
                          onValueChange={(hour) => {
                            const currentMinute = watch("entryTime")?.includes(":") ? watch("entryTime").split(":")[1] : "00";
                            setValue("entryTime", `${hour}:${currentMinute}`, { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm font-mono">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={hour} value={hour}>
                                  {hour}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Select
                          value={watch("entryTime")?.includes(":") ? watch("entryTime").split(":")[1] : undefined}
                          onValueChange={(minute) => {
                            const currentHour = watch("entryTime")?.includes(":") ? watch("entryTime").split(":")[0] : "09";
                            setValue("entryTime", `${currentHour}:${minute}`, { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm font-mono">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => {
                              const minute = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Entry Premium */}
                    <div className="space-y-1.5">
                      <Label htmlFor="entryPremium" className="text-xs text-neutral-700">Entry Premium</Label>
                      <Input
                        id="entryPremium"
                        type="number"
                        step="0.05"
                        {...register("entryPremium", { required: true })}
                        onChange={(e) => {
                          setValue("entryPremium", e.target.value);
                          setValue("entryPrice", e.target.value); // Sync with entryPrice
                        }}
                        placeholder="150.50"
                        className="h-9 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. POSITION */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Position</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* No of Lots */}
                    <div className="space-y-1.5">
                      <Label htmlFor="lotSize" className="text-xs text-neutral-700">No of Lots</Label>
                      <Input
                        id="lotSize"
                        type="number"
                        {...register("lotSize")}
                        placeholder="1"
                        className="h-9 text-sm font-mono"
                      />
                    </div>

                    {/* Lot Size (NEW - mandatory) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="lotUnitSize" className="text-xs text-neutral-700">
                        Lot Size <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lotUnitSize"
                        type="number"
                        {...register("lotUnitSize")}
                        placeholder="65"
                        className="h-9 text-sm font-mono"
                      />
                      <p className="text-xs text-neutral-500">Units per lot (e.g., 65 for NIFTY)</p>
                    </div>

                    {/* Quantity (Auto-calculated) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="quantity" className="text-xs text-neutral-700">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={(() => {
                          const lots = watch("lotSize");
                          const lotUnitSize = watch("lotUnitSize");
                          if (lots && lotUnitSize) {
                            const qty = parseInt(lots) * parseInt(lotUnitSize);
                            if (watch("quantity") !== qty.toString()) {
                              setValue("quantity", qty.toString());
                            }
                            return qty;
                          }
                          return watch("quantity") || "";
                        })()}
                        placeholder="Auto"
                        className="h-9 text-sm font-mono bg-neutral-50 text-neutral-500 cursor-not-allowed border-neutral-200"
                        readOnly
                        disabled
                      />
                      <p className="text-[10px] text-neutral-400">Auto-calculated</p>
                    </div>
                  </div>
                </div>

                {/* 3. CAPITAL */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Capital</h4>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-700">Total Invested</Label>
                    <div className="px-3 py-2.5 rounded-md bg-neutral-50/70 border border-neutral-200">
                      {(() => {
                        const premium = watch("entryPremium");
                        const quantity = watch("quantity");
                        if (premium && quantity) {
                          const capital = parseFloat(premium) * parseInt(quantity);
                          // Also update the totalInvested field
                          if (watch("totalInvested") !== capital.toString()) {
                            setValue("totalInvested", capital.toString());
                          }
                          return (
                            <span className="text-lg font-mono font-bold text-neutral-700">
                              ₹{formatIndianNumber(capital)}
                            </span>
                          );
                        }
                        return <span className="text-sm text-neutral-400">Enter Entry Premium and Quantity</span>;
                      })()}
                    </div>
                  </div>
                </div>

                {/* 4. ENTRY ORDER TYPE */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Entry Order Type</h4>
                  <RadioGroup 
                    value={watch("entryOrderType") || ""}
                    onValueChange={(value) => setValue("entryOrderType", value as "limit" | "market")}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="market" id="entry-order-market" />
                      <Label htmlFor="entry-order-market" className="text-sm text-neutral-700 cursor-pointer">
                        Market
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="limit" id="entry-order-limit" />
                      <Label htmlFor="entry-order-limit" className="text-sm text-neutral-700 cursor-pointer">
                        Limit
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* STEP 4: TRADE EXIT */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-5">
              {/* Header */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Trade Exit</h3>
                <div className="border-b border-neutral-300 mb-4"></div>
              </div>
              
              <div className="space-y-5">
                {/* 1. EXIT DETAILS */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Exit Details</h4>
                  <div className="grid grid-cols-4 gap-3">
                    {/* Exit Date */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-neutral-700">Exit Date</Label>
                      <Popover>
                        <PopoverTrigger
                          type="button"
                          className={cn(
                            "flex h-9 w-full items-center justify-start rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            !watch("exitDate") && "text-neutral-400"
                          )}
                        >
                          <Calendar className="mr-2 size-4" />
                          {watch("exitDate") ? new Date(watch("exitDate")).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Select date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={watch("exitDate") ? new Date(watch("exitDate")) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = formatDateLocal(date);
                                setValue("exitDate", formattedDate);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                                setValue("exitDay", dayName);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Day (Auto-calculated) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="exitDay" className="text-xs text-neutral-700">Day</Label>
                      <Input
                        id="exitDay"
                        type="text"
                        value={watch("exitDay") || ""}
                        readOnly
                        disabled
                        className="h-9 text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed border-neutral-200"
                      />
                      <p className="text-[10px] text-neutral-400">Auto-calculated from date</p>
                    </div>

                    {/* Exit Time */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="exitTime" className="text-xs text-neutral-700">Exit Time</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex items-center">
                              <Info className="size-3 text-neutral-400 hover:text-neutral-600 transition-colors" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] bg-neutral-800 text-white">
                            <div className="text-xs space-y-1">
                              <p className="font-medium">Select hours and minutes</p>
                              <p className="text-neutral-300">24-hour format</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={watch("exitTime")?.includes(":") ? watch("exitTime").split(":")[0] : undefined}
                          onValueChange={(hour) => {
                            const currentMinute = watch("exitTime")?.includes(":") ? watch("exitTime").split(":")[1] : "00";
                            setValue("exitTime", `${hour}:${currentMinute}`, { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm font-mono">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={hour} value={hour}>
                                  {hour}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Select
                          value={watch("exitTime")?.includes(":") ? watch("exitTime").split(":")[1] : undefined}
                          onValueChange={(minute) => {
                            const currentHour = watch("exitTime")?.includes(":") ? watch("exitTime").split(":")[0] : "09";
                            setValue("exitTime", `${currentHour}:${minute}`, { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="h-9 text-sm font-mono">
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 60 }, (_, i) => {
                              const minute = i.toString().padStart(2, '0');
                              return (
                                <SelectItem key={minute} value={minute}>
                                  {minute}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Validation Error Message */}
                      {(() => {
                        const entryDate = watch("date");
                        const entryTime = watch("entryTime");
                        const exitDate = watch("exitDate");
                        const exitTime = watch("exitTime");
                        
                        if (entryDate && entryTime && exitDate && exitTime) {
                          // Ensure time is in HH:MM format
                          const entryTimeFormatted = entryTime.includes(':') ? entryTime : '09:15';
                          const exitTimeFormatted = exitTime.includes(':') ? exitTime : '09:15';
                          
                          const entryDateTime = new Date(`${entryDate}T${entryTimeFormatted}:00`);
                          const exitDateTime = new Date(`${exitDate}T${exitTimeFormatted}:00`);
                          
                          if (!isNaN(entryDateTime.getTime()) && !isNaN(exitDateTime.getTime()) && exitDateTime <= entryDateTime) {
                            return (
                              <p className="text-[10px] text-red-600 font-medium">
                                Exit time must be after entry time
                              </p>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>

                    {/* Exit Premium */}
                    <div className="space-y-1.5">
                      <Label htmlFor="exitPremium" className="text-xs text-neutral-700">Exit Premium</Label>
                      <Input
                        id="exitPremium"
                        type="number"
                        step="0.05"
                        {...register("exitPremium", { 
                          required: false,
                          min: { value: 0.05, message: "Exit premium must be greater than 0" }
                        })}
                        onChange={(e) => {
                          setValue("exitPremium", e.target.value);
                          setValue("exitPrice", e.target.value); // Sync with exitPrice
                        }}
                        placeholder="160.50"
                        className="h-9 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. EXIT ORDER TYPE */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Exit Order Type</h4>
                  <RadioGroup 
                    value={watch("exitOrderType") || ""}
                    onValueChange={(value) => setValue("exitOrderType", value as "limit" | "market")}
                    className="flex gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="market" id="exit-order-market" />
                      <Label htmlFor="exit-order-market" className="text-sm text-neutral-700 cursor-pointer">
                        Market
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="limit" id="exit-order-limit" />
                      <Label htmlFor="exit-order-limit" className="text-sm text-neutral-700 cursor-pointer">
                        Limit
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* 3. EXIT CONTEXT */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Exit Context</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Reason for Exit */}
                    <div className="space-y-1.5">
                      <Label htmlFor="exitReason" className="text-xs text-neutral-700">Reason for Exit</Label>
                      <Input
                        id="exitReason"
                        type="text"
                        {...register("exitReason")}
                        placeholder="e.g., Target hit, SL hit"
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Early Exit */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-neutral-700">Early Exit</Label>
                      <RadioGroup 
                        value={watch("earlyExit") === true ? "yes" : watch("earlyExit") === false ? "no" : ""}
                        onValueChange={(value) => setValue("earlyExit", value === "yes")}
                        className="flex gap-6 pt-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="early-exit-yes" />
                          <Label htmlFor="early-exit-yes" className="text-sm text-neutral-700 cursor-pointer">
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="early-exit-no" />
                          <Label htmlFor="early-exit-no" className="text-sm text-neutral-700 cursor-pointer">
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 5: TRADE MANAGEMENT */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-5">
              {/* Header */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Trade Management</h3>
                <div className="border-b border-neutral-300 mb-4"></div>
              </div>
              
              <div className="space-y-5">
                {/* 1. STOP LOSS MODIFICATION */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Stop Loss Modification</h4>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-700">Was SL Modified?</Label>
                    <RadioGroup 
                      value={watch("slModified") === true ? "yes" : watch("slModified") === false ? "no" : ""}
                      onValueChange={(value) => {
                        setValue("slModified", value === "yes");
                        // Clear conditional fields if "No" is selected
                        if (value === "no") {
                          setValue("modifiedSL", "");
                          setValue("slModificationReason", "");
                        }
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="sl-modified-yes" />
                        <Label htmlFor="sl-modified-yes" className="text-sm text-neutral-700 cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="sl-modified-no" />
                        <Label htmlFor="sl-modified-no" className="text-sm text-neutral-700 cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* 2. CONDITIONAL FIELDS - Show only if SL Modified = Yes */}
                {watch("slModified") === true && (
                  <div className="space-y-2.5 pl-4 border-l-2 border-blue-300 bg-blue-50/30 -ml-2 py-3 pr-2 rounded-r">
                    <h4 className="text-sm font-medium text-blue-900">Modification Details</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* New Stop Loss */}
                      <div className="space-y-1.5">
                        <Label htmlFor="modifiedSL" className="text-xs text-neutral-700">
                          New Stop Loss <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="modifiedSL"
                          type="number"
                          step="0.05"
                          {...register("modifiedSL", { 
                            required: watch("slModified") === true ? "New stop loss is required" : false
                          })}
                          placeholder="145.00"
                          className="h-9 text-sm font-mono"
                        />
                      </div>

                      {/* Reason for SL Modification */}
                      <div className="space-y-1.5">
                        <Label htmlFor="slModificationReason" className="text-xs text-neutral-700">
                          Reason for SL Modification <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="slModificationReason"
                          type="text"
                          {...register("slModificationReason", { 
                            required: watch("slModified") === true ? "Reason is required" : false
                          })}
                          placeholder="e.g., Price moved favorably"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TRAILING STOP LOSS */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Trailing Stop Loss</h4>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-700">Trailing SL</Label>
                    <RadioGroup 
                      value={watch("isTrailingSL") === true ? "yes" : watch("isTrailingSL") === false ? "no" : ""}
                      onValueChange={(value) => setValue("isTrailingSL", value === "yes")}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="trailing-sl-yes" />
                        <Label htmlFor="trailing-sl-yes" className="text-sm text-neutral-700 cursor-pointer">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="trailing-sl-no" />
                        <Label htmlFor="trailing-sl-no" className="text-sm text-neutral-700 cursor-pointer">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 6: TRADE PSYCHOLOGY */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-5">
              {/* Header */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Trade Psychology</h3>
                <div className="border-b border-neutral-300 mb-4"></div>
              </div>
              
              <div className="space-y-5">
                {/* 1. ENTRY PHASE */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Entry</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Entry Emotion */}
                    <div className="space-y-1.5">
                      <Label htmlFor="entryEmotions" className="text-xs text-neutral-700">Entry Emotion</Label>
                      <Select
                        key={`entry-${entryEmotions.length}-${watch("entryEmotions")}`}
                        value={watch("entryEmotions") || ""}
                        onValueChange={(value: string) => {
                          console.log('Entry emotion selected:', value);
                          setValue("entryEmotions", value);
                        }}
                      >
                        <SelectTrigger id="entryEmotions" className="h-9">
                          <SelectValue placeholder="Select emotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {entryEmotions.length === 0 ? (
                            <SelectItem value="none" disabled>No emotions configured</SelectItem>
                          ) : (
                            entryEmotions.map(emotion => (
                              <SelectItem key={emotion.id} value={emotion.type}>
                                {emotion.type}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Entry Emotion Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="entryEmotionNotes" className="text-xs text-neutral-700">Entry Emotion Notes</Label>
                      <Textarea
                        id="entryEmotionNotes"
                        {...register("entryEmotionNotes")}
                        placeholder="Additional context about your emotional state..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. IN-TRADE PHASE */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">In-Trade</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* In-Trade Emotion */}
                    <div className="space-y-1.5">
                      <Label htmlFor="inTradeEmotions" className="text-xs text-neutral-700">In-Trade Emotion</Label>
                      <Select
                        key={`intrade-${inTradeEmotions.length}-${watch("inTradeEmotions")}`}
                        value={watch("inTradeEmotions") || ""}
                        onValueChange={(value: string) => {
                          console.log('In-Trade emotion selected:', value);
                          setValue("inTradeEmotions", value);
                        }}
                      >
                        <SelectTrigger id="inTradeEmotions" className="h-9">
                          <SelectValue placeholder="Select emotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {inTradeEmotions.length === 0 ? (
                            <SelectItem value="none" disabled>No emotions configured</SelectItem>
                          ) : (
                            inTradeEmotions.map(emotion => (
                              <SelectItem key={emotion.id} value={emotion.type}>
                                {emotion.type}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* In-Trade Emotion Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="inTradeEmotionNotes" className="text-xs text-neutral-700">In-Trade Emotion Notes</Label>
                      <Textarea
                        id="inTradeEmotionNotes"
                        {...register("inTradeEmotionNotes")}
                        placeholder="Additional context during the trade..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. EXIT PHASE */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Exit</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Exit Emotion */}
                    <div className="space-y-1.5">
                      <Label htmlFor="exitEmotions" className="text-xs text-neutral-700">Exit Emotion</Label>
                      <Select
                        key={`exit-${exitEmotions.length}-${watch("exitEmotions")}`}
                        value={watch("exitEmotions") || ""}
                        onValueChange={(value: string) => {
                          console.log('Exit emotion selected:', value);
                          setValue("exitEmotions", value);
                        }}
                      >
                        <SelectTrigger id="exitEmotions" className="h-9">
                          <SelectValue placeholder="Select emotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {exitEmotions.length === 0 ? (
                            <SelectItem value="none" disabled>No emotions configured</SelectItem>
                          ) : (
                            exitEmotions.map(emotion => (
                              <SelectItem key={emotion.id} value={emotion.type}>
                                {emotion.type}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Exit Emotion Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="exitEmotionNotes" className="text-xs text-neutral-700">Exit Emotion Notes</Label>
                      <Textarea
                        id="exitEmotionNotes"
                        {...register("exitEmotionNotes")}
                        placeholder="Why did you feel this way at exit..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. POST-EXIT PHASE */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Post-Exit</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Post-Exit Emotion */}
                    <div className="space-y-1.5">
                      <Label htmlFor="postExitEmotions" className="text-xs text-neutral-700">Post-Exit Emotion</Label>
                      <Select
                        key={`postexit-${postExitEmotions.length}-${watch("postExitEmotions")}`}
                        value={watch("postExitEmotions") || ""}
                        onValueChange={(value: string) => {
                          console.log('Post-Exit emotion selected:', value);
                          setValue("postExitEmotions", value);
                        }}
                      >
                        <SelectTrigger id="postExitEmotions" className="h-9">
                          <SelectValue placeholder="Select emotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {postExitEmotions.length === 0 ? (
                            <SelectItem value="none" disabled>No emotions configured</SelectItem>
                          ) : (
                            postExitEmotions.map(emotion => (
                              <SelectItem key={emotion.id} value={emotion.type}>
                                {emotion.type}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Post-Exit Emotion Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="postExitEmotionNotes" className="text-xs text-neutral-700">Post-Exit Emotion Notes</Label>
                      <Textarea
                        id="postExitEmotionNotes"
                        {...register("postExitEmotionNotes")}
                        placeholder="Reflections after exiting the trade..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditional rendering based on instrument type */}
            {instrument === "Cash" ? (
              /* Equity specific fields */
              <>
                {/* Total Invested */}
                <div className="space-y-2">
                  <Label htmlFor="totalInvested" className="text-sm text-neutral-700">Total Invested Amount</Label>
                  <Input
                    id="totalInvested"
                    type="number"
                    step="0.01"
                    {...register("totalInvested", { required: true })}
                    placeholder="42757.50"
                    className="font-mono"
                  />
                </div>
              </>
            ) : (
              /* Options & Futures specific fields */
              <>
                {/* Entry & Exit Premium */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    
                    
                  </div>
                  <div className="space-y-2">
                    
                    
                  </div>
                </div>
              </>
            )}

            {/* STEP 7: TRADE REVIEW */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-5">
              {/* Header */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Trade Review</h3>
                <div className="border-b border-neutral-300 mb-4"></div>
              </div>
              
              <div className="space-y-5">
                {/* 1. PERFORMANCE SUMMARY */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Performance Summary</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Points Captured per Lot */}
                    {(() => {
                      const entryPremiumVal = watch("entryPremium");
                      const exitPremiumVal = watch("exitPremium");
                      const actionVal = watch("action");
                      
                      if (!entryPremiumVal || !exitPremiumVal) return null;
                      
                      const entryPremium = parseFloat(entryPremiumVal);
                      const exitPremium = parseFloat(exitPremiumVal);
                      
                      if (isNaN(entryPremium) || isNaN(exitPremium)) return null;
                      
                      const pointsPerLot = actionVal === "buy" 
                        ? exitPremium - entryPremium 
                        : entryPremium - exitPremium;
                      
                      return (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-700">Points Captured per Lot</Label>
                          <div className={`px-3 py-2 rounded-md border font-mono text-sm ${
                            pointsPerLot >= 0 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {pointsPerLot >= 0 ? '+' : ''}{pointsPerLot.toFixed(2)}
                          </div>
                        </div>
                      );
                    })()}

                    {/* PnL */}
                    {(() => {
                      const entryPremiumVal = watch("entryPremium");
                      const exitPremiumVal = watch("exitPremium");
                      const lotSizeVal = watch("lotSize");
                      const lotUnitSizeVal = watch("lotUnitSize");
                      const actionVal = watch("action");
                      
                      if (!entryPremiumVal || !exitPremiumVal || !lotSizeVal || !lotUnitSizeVal) return null;
                      
                      const entryPremium = parseFloat(entryPremiumVal);
                      const exitPremium = parseFloat(exitPremiumVal);
                      const noOfLots = parseFloat(lotSizeVal);
                      const lotUnitSize = parseFloat(lotUnitSizeVal);
                      
                      if (isNaN(entryPremium) || isNaN(exitPremium) || isNaN(noOfLots) || isNaN(lotUnitSize)) return null;
                      
                      const pointsPerLot = actionVal === "buy" 
                        ? exitPremium - entryPremium 
                        : entryPremium - exitPremium;
                      const pnl = pointsPerLot * noOfLots * lotUnitSize;
                      
                      return (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-700">PnL</Label>
                          <div className={`px-3 py-2 rounded-md border font-mono text-sm ${
                            pnl >= 0 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {pnl >= 0 ? '+' : ''}₹{formatIndianNumber(pnl)}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Return % */}
                    {(() => {
                      const entryPremiumVal = watch("entryPremium");
                      const exitPremiumVal = watch("exitPremium");
                      const lotSizeVal = watch("lotSize");
                      const lotUnitSizeVal = watch("lotUnitSize");
                      const actionVal = watch("action");
                      
                      if (!entryPremiumVal || !exitPremiumVal || !lotSizeVal || !lotUnitSizeVal) return null;
                      
                      const entryPremium = parseFloat(entryPremiumVal);
                      const exitPremium = parseFloat(exitPremiumVal);
                      const noOfLots = parseFloat(lotSizeVal);
                      const lotUnitSize = parseFloat(lotUnitSizeVal);
                      
                      if (isNaN(entryPremium) || isNaN(exitPremium) || isNaN(noOfLots) || isNaN(lotUnitSize)) return null;
                      
                      const pointsPerLot = actionVal === "buy" 
                        ? exitPremium - entryPremium 
                        : entryPremium - exitPremium;
                      const pnl = pointsPerLot * noOfLots * lotUnitSize;
                      const invested = entryPremium * noOfLots * lotUnitSize;
                      
                      if (invested === 0) return null;
                      
                      const returnPercent = (pnl / invested) * 100;
                      
                      return (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-700">Return %</Label>
                          <div className={`px-3 py-2 rounded-md border font-mono text-sm ${
                            returnPercent >= 0 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 2. CAPITAL */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Capital</h4>
                  {(() => {
                    const entryPremiumVal = watch("entryPremium");
                    const lotSizeVal = watch("lotSize");
                    const lotUnitSizeVal = watch("lotUnitSize");
                    
                    if (!entryPremiumVal || !lotSizeVal || !lotUnitSizeVal) return null;
                    
                    const entryPremium = parseFloat(entryPremiumVal);
                    const noOfLots = parseFloat(lotSizeVal);
                    const lotUnitSize = parseFloat(lotUnitSizeVal);
                    
                    if (isNaN(entryPremium) || isNaN(noOfLots) || isNaN(lotUnitSize)) return null;
                    
                    const invested = entryPremium * noOfLots * lotUnitSize;
                    
                    return (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-700">Invested Amount</Label>
                        <div className="px-3 py-2 rounded-md border bg-blue-50 border-blue-200 text-blue-900 font-mono text-sm">
                          ₹{formatIndianNumber(invested)}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. RISK ANALYSIS */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Risk Analysis</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Actual Risk */}
                    {(() => {
                      const entryPremiumVal = watch("entryPremium");
                      const planStopLossVal = watch("planStopLoss");
                      const actionVal = watch("action");
                      
                      if (!entryPremiumVal || !planStopLossVal) return null;
                      
                      const entryPremium = parseFloat(entryPremiumVal);
                      const stopLoss = parseFloat(planStopLossVal);
                      
                      if (isNaN(entryPremium) || isNaN(stopLoss)) return null;
                      
                      const actualRisk = actionVal === "buy" 
                        ? entryPremium - stopLoss 
                        : stopLoss - entryPremium;
                      
                      return (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-700">Actual Risk</Label>
                          <div className="px-3 py-2 rounded-md border bg-red-50 border-red-200 text-red-700 font-mono text-sm">
                            {actualRisk.toFixed(2)}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actual Reward */}
                    {(() => {
                      const entryPremiumVal = watch("entryPremium");
                      const exitPremiumVal = watch("exitPremium");
                      const actionVal = watch("action");
                      
                      if (!entryPremiumVal || !exitPremiumVal) return null;
                      
                      const entryPremium = parseFloat(entryPremiumVal);
                      const exitPremium = parseFloat(exitPremiumVal);
                      
                      if (isNaN(entryPremium) || isNaN(exitPremium)) return null;
                      
                      const actualReward = actionVal === "buy" 
                        ? exitPremium - entryPremium 
                        : entryPremium - exitPremium;
                      
                      return (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-700">Actual Reward</Label>
                          <div className={`px-3 py-2 rounded-md border font-mono text-sm ${
                            actualReward >= 0 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {actualReward >= 0 ? '+' : ''}{actualReward.toFixed(2)}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Actual R:R */}
                    {(() => {
                      const entryPremiumVal = watch("entryPremium");
                      const exitPremiumVal = watch("exitPremium");
                      const planStopLossVal = watch("planStopLoss");
                      const actionVal = watch("action");
                      
                      if (!entryPremiumVal || !exitPremiumVal || !planStopLossVal) return null;
                      
                      const entryPremium = parseFloat(entryPremiumVal);
                      const exitPremium = parseFloat(exitPremiumVal);
                      const stopLoss = parseFloat(planStopLossVal);
                      
                      if (isNaN(entryPremium) || isNaN(exitPremium) || isNaN(stopLoss)) return null;
                      
                      const actualRisk = actionVal === "buy" 
                        ? entryPremium - stopLoss 
                        : stopLoss - entryPremium;
                      
                      const actualReward = actionVal === "buy" 
                        ? exitPremium - entryPremium 
                        : entryPremium - exitPremium;
                      
                      if (actualRisk === 0) return null;
                      
                      const actualRR = actualReward / actualRisk;
                      
                      return (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-700">Actual R:R</Label>
                          <div className={`px-3 py-2 rounded-md border font-mono text-sm ${
                            actualRR >= 1 
                              ? 'bg-green-50 border-green-200 text-green-700' 
                              : actualRR > 0
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            1:{actualRR.toFixed(2)}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 4. PLAN VS ACTUAL - Only show if planned */}
                {watch("isPlanned") && (
                  <div className="space-y-2.5 pl-4 border-l-2 border-purple-300 bg-purple-50/30 -ml-2 py-3 pr-2 rounded-r">
                    <h4 className="text-sm font-medium text-purple-900">Plan vs Actual</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Planned Entry vs Actual Entry */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-700">Planned Entry vs Actual Entry</Label>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 px-3 py-2 rounded-md border bg-neutral-50 border-neutral-200 text-neutral-700 font-mono text-sm">
                            {watch("planEntryPrice") || "—"}
                          </div>
                          <span className="text-neutral-500">→</span>
                          <div className="flex-1 px-3 py-2 rounded-md border bg-blue-50 border-blue-200 text-blue-700 font-mono text-sm">
                            {watch("entryPremium") || "—"}
                          </div>
                        </div>
                      </div>

                      {/* Planned Exit vs Actual Exit */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-700">Planned Exit vs Actual Exit</Label>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 px-3 py-2 rounded-md border bg-neutral-50 border-neutral-200 text-neutral-700 font-mono text-sm">
                            {watch("planExitPrice") || "—"}
                          </div>
                          <span className="text-neutral-500">→</span>
                          <div className="flex-1 px-3 py-2 rounded-md border bg-blue-50 border-blue-200 text-blue-700 font-mono text-sm">
                            {watch("exitPremium") || "—"}
                          </div>
                        </div>
                      </div>

                      {/* Planned Quantity vs Actual Quantity */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-neutral-700">Planned Lots vs Actual Lots</Label>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 px-3 py-2 rounded-md border bg-neutral-50 border-neutral-200 text-neutral-700 font-mono text-sm">
                            {watch("planLotSize") || "—"}
                          </div>
                          <span className="text-neutral-500">→</span>
                          <div className="flex-1 px-3 py-2 rounded-md border bg-blue-50 border-blue-200 text-blue-700 font-mono text-sm">
                            {watch("lotSize") || "—"}
                          </div>
                        </div>
                      </div>

                      {/* Planned R:R vs Actual R:R */}
                      {(() => {
                        const planEntryVal = watch("planEntryPrice");
                        const planExitVal = watch("planExitPrice");
                        const planStopLossVal = watch("planStopLoss");
                        const planActionVal = watch("planAction") || watch("action");
                        
                        const entryPremiumVal = watch("entryPremium");
                        const exitPremiumVal = watch("exitPremium");
                        const actionVal = watch("action");
                        
                        if (!planEntryVal || !planExitVal || !planStopLossVal || !entryPremiumVal || !exitPremiumVal) return null;
                        
                        const planEntry = parseFloat(planEntryVal);
                        const planExit = parseFloat(planExitVal);
                        const planStop = parseFloat(planStopLossVal);
                        
                        const entryPremium = parseFloat(entryPremiumVal);
                        const exitPremium = parseFloat(exitPremiumVal);
                        
                        if (isNaN(planEntry) || isNaN(planExit) || isNaN(planStop) || isNaN(entryPremium) || isNaN(exitPremium)) return null;
                        
                        // Planned R:R
                        const planReward = planActionVal === "buy" ? planExit - planEntry : planEntry - planExit;
                        const planRisk = planActionVal === "buy" ? planEntry - planStop : planStop - planEntry;
                        const plannedRR = planRisk > 0 ? planReward / planRisk : 0;
                        
                        // Actual R:R
                        const actualReward = actionVal === "buy" ? exitPremium - entryPremium : entryPremium - exitPremium;
                        const actualRisk = actionVal === "buy" ? entryPremium - planStop : planStop - entryPremium;
                        const actualRR = actualRisk > 0 ? actualReward / actualRisk : 0;
                        
                        return (
                          <div className="space-y-1.5">
                            <Label className="text-xs text-neutral-700">Planned R:R vs Actual R:R</Label>
                            <div className="flex gap-2 items-center">
                              <div className="flex-1 px-3 py-2 rounded-md border bg-neutral-50 border-neutral-200 text-neutral-700 font-mono text-sm">
                                1:{plannedRR.toFixed(2)}
                              </div>
                              <span className="text-neutral-500">→</span>
                              <div className={`flex-1 px-3 py-2 rounded-md border font-mono text-sm ${
                                actualRR >= plannedRR
                                  ? 'bg-green-50 border-green-200 text-green-700'
                                  : 'bg-red-50 border-red-200 text-red-700'
                              }`}>
                                1:{actualRR.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* 5. NOTES */}
                <div className="space-y-2.5">
                  <h4 className="text-sm font-medium text-neutral-800">Notes</h4>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Trade rationale, market conditions, or other observations..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Chart Attachments (Optional) */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-5 space-y-5">
              {/* Header */}
              <div>
                <h3 className="text-base font-semibold text-neutral-900 mb-3">Chart Attachments (Optional)</h3>
                <div className="border-b border-neutral-300 mb-4"></div>
              </div>

              {/* 3-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Symbol Chart */}
                <div className="space-y-2">
                  <Label htmlFor="symbolChart" className="text-xs text-neutral-700">Symbol Chart</Label>
                  {symbolChart ? (
                    <div className="relative">
                      <img src={symbolChart} alt="Symbol Chart" className="w-full h-32 object-cover rounded border border-neutral-300" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeChart('symbol')}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="symbolChart"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleChartUpload(file, 'symbol');
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="symbolChart"
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-neutral-300 rounded cursor-pointer hover:bg-neutral-100 transition-colors"
                      >
                        <Plus className="size-6 text-neutral-400 mb-1" />
                        <span className="text-xs text-neutral-500">Upload Chart</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Call Chart */}
                <div className="space-y-2">
                  <Label htmlFor="callChart" className="text-xs text-neutral-700">Call Option Chart</Label>
                  {callChart ? (
                    <div className="relative">
                      <img src={callChart} alt="Call Chart" className="w-full h-32 object-cover rounded border border-neutral-300" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeChart('call')}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="callChart"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleChartUpload(file, 'call');
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="callChart"
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-neutral-300 rounded cursor-pointer hover:bg-neutral-100 transition-colors"
                      >
                        <Plus className="size-6 text-neutral-400 mb-1" />
                        <span className="text-xs text-neutral-500">Upload Chart</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Put Chart */}
                <div className="space-y-2">
                  <Label htmlFor="putChart" className="text-xs text-neutral-700">Put Option Chart</Label>
                  {putChart ? (
                    <div className="relative">
                      <img src={putChart} alt="Put Chart" className="w-full h-32 object-cover rounded border border-neutral-300" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeChart('put')}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="putChart"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleChartUpload(file, 'put');
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="putChart"
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-neutral-300 rounded cursor-pointer hover:bg-neutral-100 transition-colors"
                      >
                        <Plus className="size-6 text-neutral-400 mb-1" />
                        <span className="text-xs text-neutral-500">Upload Chart</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Helper Text */}
              <div className="space-y-1 text-center">
                <p className="text-xs text-neutral-600">Upload charts for trade review (optional)</p>
                <p className="text-xs text-neutral-500">Supports PNG, JPG formats</p>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-neutral-200">
              {editTradeId ? (
                // Edit Mode: Show Cancel and Update buttons
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                  >
                    Update Trade
                  </Button>
                </div>
              ) : (
                // New Trade Mode: Show only Save button
                <Button type="submit" className="w-full">
                  Save Trade
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
      
      {/* Navigation Warning Dialog */}
      {blocker.state === "blocked" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-xl max-w-md w-full p-6 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
            <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              Unsaved Changes
            </h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              You have unsaved changes. Are you sure you want to leave this page? All your current data will be lost.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => blocker.reset()}
              >
                Stay on Page
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsFormDirty(false);
                  blocker.proceed();
                }}
              >
                Leave Page
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeJournal;