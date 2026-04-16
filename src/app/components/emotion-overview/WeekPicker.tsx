import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeekPickerProps {
  selectedWeekStart: Date;
  onWeekSelect: (weekStart: Date) => void;
  isDark: boolean;
  onClose: () => void;
}

export function WeekPicker({ selectedWeekStart, onWeekSelect, isDark, onClose }: WeekPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedWeekStart));

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  const isSameWeek = (date1: Date, date2: Date) => {
    const week1 = getWeekStart(date1);
    const week2 = getWeekStart(date2);
    return week1.toDateString() === week2.toDateString();
  };

  const weeks = useMemo(() => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Get the Monday of the week containing the first day
    let startDate = getWeekStart(firstDayOfMonth);
    
    // Get the Sunday of the week containing the last day
    const endDate = new Date(lastDayOfMonth);
    const endDay = endDate.getDay();
    const daysToAdd = endDay === 0 ? 0 : 7 - endDay;
    endDate.setDate(endDate.getDate() + daysToAdd);

    const weeksArray: Date[][] = [];
    let currentWeek: Date[] = [];
    
    const current = new Date(startDate);
    while (current <= endDate) {
      currentWeek.push(new Date(current));
      
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
    }

    return weeksArray;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleWeekClick = (weekStart: Date) => {
    onWeekSelect(weekStart);
    onClose();
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className={`w-[400px] rounded-lg shadow-xl ${
          isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-neutral-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              Select Week
            </h3>
            <button
              onClick={onClose}
              className={`text-sm px-3 py-1 rounded ${
                isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Close
            </button>
          </div>
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
            Click on any week to view data for that week (Monday - Sunday)
          </p>
        </div>

        {/* Calendar */}
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className={`p-2 rounded-md transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className={`p-2 rounded-md transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-neutral-100 text-neutral-600'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-2 ${
                  isDark ? 'text-zinc-500' : 'text-neutral-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => {
              const weekStart = week[0];
              const isSelected = isSameWeek(weekStart, selectedWeekStart);
              const isCurrentMonth = week.some(
                (day) => day.getMonth() === currentMonth.getMonth()
              );

              return (
                <button
                  key={weekIndex}
                  onClick={() => handleWeekClick(weekStart)}
                  className={`w-full grid grid-cols-7 gap-1 rounded-md transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-600 ring-2 ring-blue-500'
                        : 'bg-blue-500 ring-2 ring-blue-400'
                      : isDark
                        ? 'hover:bg-zinc-800'
                        : 'hover:bg-neutral-100'
                  }`}
                >
                  {week.map((day, dayIndex) => {
                    const isCurrentMonthDay = day.getMonth() === currentMonth.getMonth();
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`text-center text-sm py-2 transition-colors ${
                          isSelected
                            ? 'text-white font-semibold'
                            : isCurrentMonthDay
                              ? isDark
                                ? 'text-zinc-300'
                                : 'text-neutral-900'
                              : isDark
                                ? 'text-zinc-700'
                                : 'text-neutral-400'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDark ? 'border-zinc-800' : 'border-neutral-200'}`}>
          <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
            Currently selected:{' '}
            <span className={`font-semibold ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
              {selectedWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(selectedWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
