import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight, Circle, X, ChevronDown, Target, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useTheme } from "../hooks/useTheme";
import { useRoutines } from "../hooks/useRoutines";

export function RoutineTracker() {
  const { theme } = useTheme();
  const { routines, addRoutine, updateRoutine, deleteRoutine, setRoutineStatus, clearAllRoutines, deduplicateRoutines } = useRoutines();
  const isDark = theme === 'dark';
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); // Format: "routineId-dateStr"
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [formData, setFormData] = useState({
    block: "",
    timeSlot: "",
    intent: ""
  });

  // Deduplicate routines on mount
  useEffect(() => {
    deduplicateRoutines();
  }, [deduplicateRoutines]);

  // Get all days in the current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const currentDay = new Date(year, month, date);
      days.push({
        date: date,
        dateStr: currentDay.toISOString().split('T')[0],
        dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' })[0],
        isToday: currentDay.toDateString() === new Date().toDateString()
      });
    }
    return days;
  };

  const days = getDaysInMonth();

  const handleSubmit = () => {
    if (formData.block.trim() && formData.timeSlot.trim() && formData.intent.trim()) {
      if (editingId) {
        updateRoutine(editingId, formData.block, formData.timeSlot, formData.intent);
        setEditingId(null);
      } else {
        const isDuplicate = routines.some(routine => 
          routine.block === formData.block && routine.timeSlot === formData.timeSlot
        );
        if (isDuplicate) {
          setDuplicateMessage("A routine with the same block and time slot already exists.");
          return;
        }
        addRoutine(formData.block, formData.timeSlot, formData.intent);
      }
      setFormData({ block: "", timeSlot: "", intent: "" });
      setIsAdding(false);
      setDuplicateMessage(null);
    }
  };

  const handleEdit = (routine: any) => {
    setEditingId(routine.id);
    setFormData({
      block: routine.block,
      timeSlot: routine.timeSlot,
      intent: routine.intent
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ block: "", timeSlot: "", intent: "" });
    setDuplicateMessage(null);
  };

  // Calculate adherence percentage for a routine
  const calculateRoutineAdherence = (routine: any) => {
    if (!routine.completedDates || typeof routine.completedDates !== 'object') {
      return 0;
    }
    let totalScore = 0;
    Object.values(routine.completedDates).forEach((status) => {
      if (status === 'done') totalScore += 1;
      else if (status === 'partial') totalScore += 0.5;
      // 'not-done' or missing adds 0
    });
    return days.length > 0 ? Math.round((totalScore / days.length) * 100) : 0;
  };

  // Calculate daily adherence (percentage of routines completed on a given day)
  const calculateDailyAdherence = (dateStr: string) => {
    if (routines.length === 0) return 0;
    let totalScore = 0;
    routines.forEach((routine) => {
      const status = routine.completedDates?.[dateStr];
      if (status === 'done') totalScore += 1;
      else if (status === 'partial') totalScore += 0.5;
      // 'not-done' or missing adds 0
    });
    return Math.round((totalScore / routines.length) * 100);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Parse time slot and convert to minutes for sorting
  const parseTimeSlot = (timeSlot: string): number => {
    // Handle formats like "4:30–5:00", "9:00–11:00", "By 22:30", "12:00–20:00"
    const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      return hours * 60 + minutes;
    }
    return 9999; // Put unparseable times at the end
  };

  // Sort routines by time slot
  const sortedRoutines = [...routines].sort((a, b) => {
    const timeA = parseTimeSlot(a.timeSlot);
    const timeB = parseTimeSlot(b.timeSlot);
    return timeA - timeB;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdown && !(e.target as Element).closest('.status-dropdown')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Get weeks in current month
  const getWeeksInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const weeks: { weekNum: number; dateRange: string; dates: string[] }[] = [];
    let currentWeek: string[] = [];
    let weekStart = 1;
    
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const currentDay = new Date(year, month, date);
      currentWeek.push(currentDay.toISOString().split('T')[0]);
      
      // Week ends on Sunday (0) or it's the last day of month
      if (currentDay.getDay() === 0 || date === lastDay.getDate()) {
        weeks.push({
          weekNum: weeks.length + 1,
          dateRange: `${weekStart}-${date}`,
          dates: [...currentWeek]
        });
        currentWeek = [];
        weekStart = date + 1;
      }
    }
    
    return weeks;
  };

  // Get last 6 months for monthly view
  const getLast6Months = () => {
    const months: { monthYear: string; month: number; year: number; dateRange: string; dates: string[] }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      
      const dates: string[] = [];
      for (let d = 1; d <= lastDay.getDate(); d++) {
        dates.push(new Date(year, month, d).toISOString().split('T')[0]);
      }
      
      months.push({
        monthYear: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        month,
        year,
        dateRange: `${dates[0]} to ${dates[dates.length - 1]}`,
        dates
      });
    }
    
    return months;
  };

  // Calculate adherence for a date range
  const calculateRangeAdherence = (routine: any, dates: string[]) => {
    if (!routine.completedDates || dates.length === 0) return 0;
    
    let totalScore = 0;
    dates.forEach(date => {
      const status = routine.completedDates[date];
      if (status === 'done') totalScore += 1;
      else if (status === 'partial') totalScore += 0.5;
    });
    
    return Math.round((totalScore / dates.length) * 100);
  };

  // Calculate overall adherence for date range (across all routines)
  const calculateOverallRangeAdherence = (dates: string[]) => {
    if (routines.length === 0 || dates.length === 0) return 0;
    
    let totalScore = 0;
    let totalPossible = dates.length * routines.length;
    
    dates.forEach(date => {
      routines.forEach(routine => {
        const status = routine.completedDates?.[date];
        if (status === 'done') totalScore += 1;
        else if (status === 'partial') totalScore += 0.5;
      });
    });
    
    return Math.round((totalScore / totalPossible) * 100);
  };

  // Calculate summary stats
  const getSummaryStats = () => {
    if (routines.length === 0) return null;
    
    // Overall adherence for current month
    const monthAdherence = calculateOverallRangeAdherence(days.map(d => d.dateStr));
    
    // Best and worst routines
    const routineAdherences = sortedRoutines.map(r => ({
      routine: r,
      adherence: calculateRoutineAdherence(r)
    }));
    
    const bestRoutine = routineAdherences.reduce((max, curr) => 
      curr.adherence > max.adherence ? curr : max, routineAdherences[0]
    );
    
    const worstRoutine = routineAdherences.reduce((min, curr) => 
      curr.adherence < min.adherence ? curr : min, routineAdherences[0]
    );
    
    // Calculate current streak (consecutive days with >50% adherence)
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const sortedDays = days.map(d => d.dateStr).sort().reverse();
    
    for (const date of sortedDays) {
      if (date > today) continue;
      const dayAdherence = calculateDailyAdherence(date);
      if (dayAdherence >= 50) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      monthAdherence,
      bestRoutine,
      worstRoutine,
      currentStreak,
      totalRoutines: routines.length
    };
  };

  const weeks = getWeeksInMonth();
  const months = getLast6Months();
  const summaryStats = getSummaryStats();

  const suggestedRoutines = [
    { block: "Morning Start", timeSlot: "4:30–5:00", intent: "Wake & freshen" },
    { block: "Physical", timeSlot: "5:00–6:00", intent: "Gym" },
    { block: "Reset", timeSlot: "6:00–6:30", intent: "Bath & prep" },
    { block: "Review", timeSlot: "6:30–7:30", intent: "Trade logging & learning" },
    { block: "Fuel", timeSlot: "7:30–8:00", intent: "Breakfast" },
    { block: "Mental Prep", timeSlot: "8:00–8:45", intent: "Meditation & market prep" },
    { block: "Break", timeSlot: "8:45–9:00", intent: "Buffer" },
    { block: "Trading", timeSlot: "9:00–11:00", intent: "Active trading" },
    { block: "Transition", timeSlot: "11:00–12:00", intent: "Office / Rest" },
    { block: "Work", timeSlot: "12:00–20:00", intent: "Office work" },
    { block: "Shutdown", timeSlot: "20:00–22:30", intent: "Wind down" },
    { block: "Sleep", timeSlot: "By 22:30", intent: "In bed" }
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-neutral-50'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-neutral-200 bg-white'}`}>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Routine Tracker
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                Structure your trading day with consistent routines
              </p>
            </div>
            <div className="flex gap-3">
              {routines.length > 0 && (
                <Button 
                  variant={isEditMode ? "default" : "outline"}
                  onClick={() => setIsEditMode(!isEditMode)} 
                  className="gap-2"
                >
                  <Edit2 className="size-4" />
                  {isEditMode ? 'Done' : 'Edit Routines'}
                </Button>
              )}
              <Button onClick={() => setIsAdding(true)} className="gap-2">
                <Plus className="size-4" />
                Add Routine
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-6">
        {/* Add/Edit Form */}
        {isAdding && (
          <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-6 mb-6`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              {editingId ? 'Edit Routine' : 'Add New Routine'}
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label className={`text-xs mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Block
                </Label>
                <Input
                  value={formData.block}
                  onChange={(e) => setFormData(prev => ({ ...prev, block: e.target.value }))}
                  placeholder="e.g., Morning Start"
                  autoFocus
                />
              </div>
              <div>
                <Label className={`text-xs mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Time Slot
                </Label>
                <Input
                  value={formData.timeSlot}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeSlot: e.target.value }))}
                  placeholder="e.g., 4:30–5:00"
                />
              </div>
              <div>
                <Label className={`text-xs mb-2 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Intent
                </Label>
                <Input
                  value={formData.intent}
                  onChange={(e) => setFormData(prev => ({ ...prev, intent: e.target.value }))}
                  placeholder="e.g., Wake & freshen"
                />
              </div>
            </div>
            {duplicateMessage && (
              <p className="text-sm text-red-500 mb-4">{duplicateMessage}</p>
            )}
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.block.trim() || !formData.timeSlot.trim() || !formData.intent.trim()}
              >
                {editingId ? 'Update' : 'Add'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Summary Stats Cards */}
        {routines.length > 0 && summaryStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* Month Adherence */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`size-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Month Adherence</span>
              </div>
              <div className={`text-2xl font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                {summaryStats.monthAdherence}%
              </div>
            </div>

            {/* Current Streak */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className={`size-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Current Streak</span>
              </div>
              <div className={`text-2xl font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                {summaryStats.currentStreak} {summaryStats.currentStreak === 1 ? 'day' : 'days'}
              </div>
            </div>

            {/* Best Routine */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`size-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Best Routine</span>
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'} truncate`}>
                {summaryStats.bestRoutine.routine.block}
              </div>
              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                {summaryStats.bestRoutine.adherence}% adherence
              </div>
            </div>

            {/* Worst Routine */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className={`size-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Needs Focus</span>
              </div>
              <div className={`text-sm font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'} truncate`}>
                {summaryStats.worstRoutine.routine.block}
              </div>
              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                {summaryStats.worstRoutine.adherence}% adherence
              </div>
            </div>
          </div>
        )}

        {/* View Selector Tabs */}
        {routines.length > 0 && (
          <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-2 mb-6 flex gap-2`}>
            <Button
              variant={viewMode === 'daily' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('daily')}
              className="flex-1"
            >
              Daily View
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('weekly')}
              className="flex-1"
            >
              Weekly Summary
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('monthly')}
              className="flex-1"
            >
              Monthly Summary
            </Button>
          </div>
        )}

        {/* Calendar Table */}
        {routines.length === 0 ? (
          <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-12 text-center`}>
            <CalendarIcon className={`size-12 mx-auto mb-4 ${isDark ? 'text-zinc-700' : 'text-neutral-300'}`} />
            <p className={`text-lg font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
              No routines yet
            </p>
            <p className={isDark ? 'text-zinc-500' : 'text-neutral-500'}>
              Start building your daily structure by adding your first routine
            </p>
            <Button onClick={() => setIsAdding(true)} className="mt-4 gap-2">
              <Plus className="size-4" />
              Add Your First Routine
            </Button>
          </div>
        ) : (
          <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg overflow-hidden`}>
            {/* Month Navigation */}
            <div className={`flex items-center justify-between px-6 py-3 ${isDark ? 'bg-zinc-800 border-b border-zinc-700' : 'bg-neutral-100 border-b border-neutral-200'}`}>
              <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>
                {monthName}
              </span>
              <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Scrollable Table Container */}
            <div className="overflow-x-auto">
              {viewMode === 'daily' && (
              <table className="w-full" style={{ minWidth: '1400px' }}>
                <thead className={`${isDark ? 'bg-blue-950 border-b border-blue-900' : 'bg-blue-900 border-b border-blue-800'}`}>
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white sticky left-0 z-10 bg-blue-950" style={{ minWidth: '120px' }}>
                      Block
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '100px' }}>
                      Time Slot
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '180px' }}>
                      Intent
                    </th>
                    {days.map((day) => (
                      <th key={day.date} className="text-center px-1 py-2 text-xs font-semibold text-white" style={{ minWidth: '32px' }}>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] mb-0.5">{day.date.toString().padStart(2, '0')}</span>
                          <span className="text-[10px] opacity-70">{day.dayName}</span>
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '60px' }}>
                      %
                    </th>
                    {isEditMode && (
                      <th className="text-center px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '80px' }}>
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-neutral-200'}`}>
                  {sortedRoutines.map((routine) => {
                    const adherence = calculateRoutineAdherence(routine);
                    return (
                      <tr 
                        key={routine.id} 
                        className={`${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-neutral-50'} transition-colors`}
                      >
                        <td className={`px-4 py-3 text-xs font-medium sticky left-0 z-10 ${isDark ? 'text-zinc-200 bg-zinc-900' : 'text-neutral-900 bg-white'}`}>
                          {routine.block}
                        </td>
                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                          {routine.timeSlot}
                        </td>
                        <td className={`px-4 py-3 text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                          {routine.intent}
                        </td>
                        {days.map((day) => {
                          const status = routine.completedDates?.[day.dateStr];
                          const dropdownKey = `${routine.id}-${day.dateStr}`;
                          const isOpen = openDropdown === dropdownKey;
                          
                          return (
                            <td 
                              key={day.date} 
                              className="px-1 py-2 text-center relative"
                            >
                              <div className="relative status-dropdown">
                                <button
                                  onClick={() => setOpenDropdown(isOpen ? null : dropdownKey)}
                                  className={`
                                    w-6 h-6 rounded transition-all flex items-center justify-center
                                    ${status === 'done'
                                      ? 'bg-emerald-500 border-2 border-emerald-500'
                                      : status === 'partial'
                                        ? 'bg-amber-500 border-2 border-amber-500'
                                        : status === 'not-done'
                                          ? 'bg-red-500 border-2 border-red-500'
                                          : isDark
                                            ? 'border-2 border-zinc-700 border-dashed hover:border-zinc-600'
                                            : 'border-2 border-neutral-300 border-dashed hover:border-neutral-400'
                                    }
                                    ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                                  `}
                                >
                                  {status === 'done' && (
                                    <Check className="size-4 text-white" strokeWidth={3} />
                                  )}
                                  {status === 'partial' && (
                                    <Circle className="size-3 text-white fill-amber-500" strokeWidth={2} />
                                  )}
                                  {status === 'not-done' && (
                                    <X className="size-4 text-white" strokeWidth={3} />
                                  )}
                                </button>
                                
                                {/* Dropdown Menu */}
                                {isOpen && (
                                  <div 
                                    className={`
                                      absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50
                                      ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} 
                                      border rounded-lg shadow-lg py-1 w-28
                                    `}
                                  >
                                    <button
                                      onClick={() => {
                                        setRoutineStatus(routine.id, day.dateStr, 'done');
                                        setOpenDropdown(null);
                                      }}
                                      className={`
                                        w-full px-3 py-2 flex items-center gap-2 text-xs
                                        ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-neutral-50'}
                                        transition-colors
                                      `}
                                    >
                                      <Check className="size-4 text-emerald-500" strokeWidth={3} />
                                      <span className={isDark ? 'text-zinc-200' : 'text-neutral-700'}>Done</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRoutineStatus(routine.id, day.dateStr, 'partial');
                                        setOpenDropdown(null);
                                      }}
                                      className={`
                                        w-full px-3 py-2 flex items-center gap-2 text-xs
                                        ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-neutral-50'}
                                        transition-colors
                                      `}
                                    >
                                      <Circle className="size-3 text-amber-500 fill-amber-500" strokeWidth={2} />
                                      <span className={isDark ? 'text-zinc-200' : 'text-neutral-700'}>Partial</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRoutineStatus(routine.id, day.dateStr, 'not-done');
                                        setOpenDropdown(null);
                                      }}
                                      className={`
                                        w-full px-3 py-2 flex items-center gap-2 text-xs
                                        ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-neutral-50'}
                                        transition-colors
                                      `}
                                    >
                                      <X className="size-4 text-red-500" strokeWidth={3} />
                                      <span className={isDark ? 'text-zinc-200' : 'text-neutral-700'}>Not Done</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className={`px-4 py-3 text-center text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                          {adherence}%
                        </td>
                        {isEditMode && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(routine)}
                                className={`h-7 w-7 p-0 ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-neutral-100'}`}
                              >
                                <Edit2 className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm(`Delete routine "${routine.block}"?`)) {
                                    deleteRoutine(routine.id);
                                  }
                                }}
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {/* Adherence Row */}
                  <tr className={`${isDark ? 'bg-blue-950 border-t-2 border-blue-900' : 'bg-blue-900 border-t-2 border-blue-800'}`}>
                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-white">
                      Adherence
                    </td>
                    {days.map((day) => {
                      const dailyAdherence = calculateDailyAdherence(day.dateStr);
                      return (
                        <td key={day.date} className="px-1 py-3 text-center text-xs font-semibold text-white">
                          {dailyAdherence}%
                        </td>
                      );
                    })}
                    <td colSpan={isEditMode ? 2 : 1} className="px-4 py-3"></td>
                  </tr>
                </tbody>
              </table>
              )}

              {/* Weekly Summary View */}
              {viewMode === 'weekly' && (
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-blue-950 border-b border-blue-900' : 'bg-blue-900 border-b border-blue-800'}`}>
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-white sticky left-0 z-10 bg-blue-950" style={{ minWidth: '120px' }}>
                        Block
                      </th>
                      {weeks.map((week) => (
                        <th key={week.weekNum} className="text-center px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '100px' }}>
                          <div className="flex flex-col items-center">
                            <span className="text-xs mb-1">Week {week.weekNum}</span>
                            <span className="text-[10px] opacity-70">{week.dateRange}</span>
                          </div>
                        </th>
                      ))}
                      <th className="text-center px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '80px' }}>
                        Avg %
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-neutral-200'}`}>
                    {sortedRoutines.map((routine) => {
                      const weeklyAdherence = weeks.map(week => calculateRangeAdherence(routine, week.dates));
                      const avgAdherence = Math.round(weeklyAdherence.reduce((a, b) => a + b, 0) / weeks.length);
                      
                      return (
                        <tr 
                          key={routine.id} 
                          className={`${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-neutral-50'} transition-colors`}
                        >
                          <td className={`px-4 py-3 text-xs font-medium sticky left-0 z-10 ${isDark ? 'text-zinc-200 bg-zinc-900' : 'text-neutral-900 bg-white'}`}>
                            {routine.block}
                          </td>
                          {weeklyAdherence.map((adherence, idx) => (
                            <td key={idx} className={`px-4 py-3 text-center text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                              <span className={`inline-block px-2 py-1 rounded ${
                                adherence >= 80 ? 'bg-emerald-500/20 text-emerald-600' :
                                adherence >= 50 ? 'bg-amber-500/20 text-amber-600' :
                                'bg-red-500/20 text-red-600'
                              }`}>
                                {adherence}%
                              </span>
                            </td>
                          ))}
                          <td className={`px-4 py-3 text-center text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                            {avgAdherence}%
                          </td>
                        </tr>
                      );
                    })}
                    {/* Overall Weekly Adherence Row */}
                    <tr className={`${isDark ? 'bg-blue-950 border-t-2 border-blue-900' : 'bg-blue-900 border-t-2 border-blue-800'}`}>
                      <td className="px-4 py-3 text-xs font-semibold text-white">
                        Overall Adherence
                      </td>
                      {weeks.map((week) => {
                        const weekAdherence = calculateOverallRangeAdherence(week.dates);
                        return (
                          <td key={week.weekNum} className="px-4 py-3 text-center text-xs font-semibold text-white">
                            {weekAdherence}%
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center text-xs font-semibold text-white">
                        {summaryStats?.monthAdherence}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Monthly Summary View */}
              {viewMode === 'monthly' && (
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-blue-950 border-b border-blue-900' : 'bg-blue-900 border-b border-blue-800'}`}>
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-white sticky left-0 z-10 bg-blue-950" style={{ minWidth: '120px' }}>
                        Block
                      </th>
                      {months.map((month) => (
                        <th key={month.monthYear} className="text-center px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '100px' }}>
                          {month.monthYear}
                        </th>
                      ))}
                      <th className="text-center px-4 py-3 text-xs font-semibold text-white" style={{ minWidth: '80px' }}>
                        Avg %
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-neutral-200'}`}>
                    {sortedRoutines.map((routine) => {
                      const monthlyAdherence = months.map(month => calculateRangeAdherence(routine, month.dates));
                      const avgAdherence = Math.round(monthlyAdherence.reduce((a, b) => a + b, 0) / months.length);
                      
                      return (
                        <tr 
                          key={routine.id} 
                          className={`${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-neutral-50'} transition-colors`}
                        >
                          <td className={`px-4 py-3 text-xs font-medium sticky left-0 z-10 ${isDark ? 'text-zinc-200 bg-zinc-900' : 'text-neutral-900 bg-white'}`}>
                            {routine.block}
                          </td>
                          {monthlyAdherence.map((adherence, idx) => (
                            <td key={idx} className={`px-4 py-3 text-center text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                              <span className={`inline-block px-2 py-1 rounded ${
                                adherence >= 80 ? 'bg-emerald-500/20 text-emerald-600' :
                                adherence >= 50 ? 'bg-amber-500/20 text-amber-600' :
                                'bg-red-500/20 text-red-600'
                              }`}>
                                {adherence}%
                              </span>
                            </td>
                          ))}
                          <td className={`px-4 py-3 text-center text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                            {avgAdherence}%
                          </td>
                        </tr>
                      );
                    })}
                    {/* Overall Monthly Adherence Row */}
                    <tr className={`${isDark ? 'bg-blue-950 border-t-2 border-blue-900' : 'bg-blue-900 border-t-2 border-blue-800'}`}>
                      <td className="px-4 py-3 text-xs font-semibold text-white">
                        Overall Adherence
                      </td>
                      {months.map((month) => {
                        const monthAdherence = calculateOverallRangeAdherence(month.dates);
                        return (
                          <td key={month.monthYear} className="px-4 py-3 text-center text-xs font-semibold text-white">
                            {monthAdherence}%
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center text-xs font-semibold text-white">
                        {Math.round(months.reduce((sum, month) => sum + calculateOverallRangeAdherence(month.dates), 0) / months.length)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Suggested Routines */}
        {routines.length === 0 && !isAdding && (
          <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'} border rounded-lg p-6 mt-6`}>
            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Suggested Trading Day Structure
            </h3>
            <div className="space-y-2">
              {suggestedRoutines.map((routine, index) => (
                <button
                  key={index}
                  onClick={() => {
                    addRoutine(routine.block, routine.timeSlot, routine.intent);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg border transition-colors
                    flex items-center justify-between
                    ${isDark 
                      ? 'border-zinc-800 bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-sm font-medium w-32">{routine.block}</span>
                    <span className={`text-sm w-28 ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                      {routine.timeSlot}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      {routine.intent}
                    </span>
                  </div>
                  <Plus className="size-4" />
                </button>
              ))}
            </div>
            <Button 
              onClick={() => {
                suggestedRoutines.forEach(routine => {
                  addRoutine(routine.block, routine.timeSlot, routine.intent);
                });
              }}
              variant="outline"
              className="w-full mt-4"
            >
              Add All Suggested Routines
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}