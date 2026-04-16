import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useTheme } from "../hooks/useTheme";
import { useDailyJournal, TodoItem } from "../hooks/useDailyJournal";
import { ChevronLeft, ChevronRight, Plus, X, Check, Edit } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function DailyJournal() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [journalText, setJournalText] = useState<string>('');
  const [newTodoText, setNewTodoText] = useState<string>('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState<string>('');

  const entries = useDailyJournal((state) => state.entries);
  const getEntry = useDailyJournal.getState().getEntry;
  const saveEntry = useDailyJournal.getState().saveEntry;
  const addTodoItem = useDailyJournal.getState().addTodoItem;
  const toggleTodoItem = useDailyJournal.getState().toggleTodoItem;
  const deleteTodoItem = useDailyJournal.getState().deleteTodoItem;
  const updateTodoText = useDailyJournal.getState().updateTodoText;

  const datesWithEntries = useMemo(() => {
    return Object.keys(entries).filter((date) => entries[date].journalText.trim() !== '');
  }, [entries]);

  const datesWithTodos = useMemo(() => {
    return Object.keys(entries).filter((date) => entries[date].todoList.length > 0);
  }, [entries]);

  // Open modal and load entry when date is clicked
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = getEntry(dateStr);

    setSelectedDate(date);
    setJournalText(entry?.journalText || '');

    // If entry exists, default to read-only mode
    // If no entry, default to edit mode
    setIsEditMode(!entry || (!entry.journalText && entry.todoList.length === 0));
    setIsModalOpen(true);
  };

  // Get current entry
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const currentEntry = selectedDate ? getEntry(dateStr) : undefined;
  const todoList = currentEntry?.todoList || [];
  const hasExistingEntry = currentEntry && (currentEntry.journalText || currentEntry.todoList.length > 0);

  // Save and close modal
  const handleSave = () => {
    if (selectedDate) {
      saveEntry(dateStr, journalText, todoList);
      setIsModalOpen(false);
      setIsEditMode(false);
      setNewTodoText('');
    }
  };

  // Cancel and close modal
  const handleCancel = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setNewTodoText('');
    setEditingTodoId(null);
  };

  // Add new todo
  const handleAddTodo = () => {
    if (newTodoText.trim() && selectedDate) {
      addTodoItem(dateStr, newTodoText.trim());
      setNewTodoText('');
    }
  };

  // Start editing todo
  const handleStartEdit = (todo: TodoItem) => {
    if (isEditMode) {
      setEditingTodoId(todo.id);
      setEditingTodoText(todo.text);
    }
  };

  // Save edited todo
  const handleSaveEdit = (todoId: string) => {
    if (editingTodoText.trim() && selectedDate) {
      updateTodoText(dateStr, todoId, editingTodoText.trim());
    }
    setEditingTodoId(null);
    setEditingTodoText('');
  };

  // Calendar rendering
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const firstDayOfMonth = monthStart.getDay();

  // Create calendar grid
  const calendarDays: (Date | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days
  calendarDays.push(...daysInMonth);

  const hasJournalEntry = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return datesWithEntries.includes(dateStr);
  };

  const hasTodoItems = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return datesWithTodos.includes(dateStr);
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-neutral-50'}`}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className={`text-4xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            Daily Journal
          </h1>
          <p className={`mt-3 text-base ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Reflect on past trades and plan for future discipline
          </p>
        </div>

        <div className="flex justify-center">
          {/* Calendar - Full Width */}
          <Card className={`w-full max-w-4xl ${isDark ? 'bg-zinc-900 border-zinc-800' : ''}`}>
            <CardContent className="pt-8 pb-8">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-3">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className={`text-center text-sm font-semibold py-3 ${
                      isDark ? 'text-zinc-400' : 'text-neutral-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} />;
                  }

                  const isSelected = isSameDay(day, selectedDate);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const hasJournal = hasJournalEntry(day);
                  const hasTodo = hasTodoItems(day);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`
                        relative aspect-square rounded-lg text-base font-semibold transition-all hover:scale-105
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                        ${isToday
                          ? isDark
                            ? 'bg-zinc-800 text-zinc-100 border-2 border-blue-500 shadow-lg'
                            : 'bg-neutral-100 text-neutral-900 border-2 border-blue-500 shadow-lg'
                          : isDark
                            ? 'text-zinc-200 hover:bg-zinc-800 hover:shadow-md'
                            : 'text-neutral-800 hover:bg-neutral-100 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full p-2">
                        <span className="text-lg">{format(day, 'd')}</span>
                        <div className="flex gap-1.5 mt-2">
                          {hasJournal && (
                            <div className="size-1.5 rounded-full bg-green-500" />
                          )}
                          {hasTodo && (
                            <div className="size-1.5 rounded-full bg-orange-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-8 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-green-500" />
                  <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>Journal Entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-orange-500" />
                  <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>Plan Items</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal for Journal Entry */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className={`max-w-7xl w-[95vw] max-h-[75vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-800' : ''}`}>
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <DialogTitle className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </DialogTitle>
                  <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    {selectedDate && (isPast(selectedDate) ? 'Reflection' : isFuture(selectedDate) ? 'Planning' : 'Today')}
                  </p>
                </div>
                {hasExistingEntry && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    <Edit className="size-4 mr-2" />
                    {isEditMode ? 'View' : 'Edit'}
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Section 1: Journal Entry */}
              <div>
                <div className="mb-3">
                  <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    Journal Entry
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Write your thoughts, mistakes, learnings, emotions…
                  </p>
                </div>

                {isEditMode ? (
                  <textarea
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="Write your thoughts, mistakes, learnings, emotions…"
                    className={`w-full h-64 p-4 rounded-lg border resize-none text-base ${
                      isDark
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                        : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                ) : (
                  <div
                    className={`w-full min-h-[16rem] p-4 rounded-lg border text-base whitespace-pre-wrap ${
                      isDark
                        ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                    }`}
                  >
                    {journalText || (
                      <span className={isDark ? 'text-zinc-500' : 'text-neutral-400'}>
                        No journal entry yet
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: Plan for the Day */}
              <div>
                <div className="mb-3">
                  <h3 className={`text-base font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    Plan for this day
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                    Set your intentions and track completion
                  </p>
                </div>

                {/* Todo List */}
                <div className="space-y-2 mb-3">
                  {todoList.length > 0 ? (
                    todoList.map((todo) => (
                      <div
                        key={todo.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          isDark ? 'bg-zinc-800' : 'bg-neutral-50'
                        }`}
                      >
                        <button
                          onClick={() => selectedDate && toggleTodoItem(dateStr, todo.id)}
                          disabled={!isEditMode}
                          className={`flex-shrink-0 size-5 rounded border-2 flex items-center justify-center transition-colors ${
                            todo.isCompleted
                              ? 'bg-green-500 border-green-500'
                              : isDark
                                ? 'border-zinc-600 hover:border-zinc-500'
                                : 'border-neutral-300 hover:border-neutral-400'
                          } ${!isEditMode ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          {todo.isCompleted && <Check className="size-3 text-white" />}
                        </button>

                        {editingTodoId === todo.id && isEditMode ? (
                          <input
                            type="text"
                            value={editingTodoText}
                            onChange={(e) => setEditingTodoText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(todo.id);
                              if (e.key === 'Escape') setEditingTodoId(null);
                            }}
                            onBlur={() => handleSaveEdit(todo.id)}
                            className={`flex-1 px-2 py-1 rounded border ${
                              isDark
                                ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                                : 'bg-white border-neutral-200 text-neutral-900'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => isEditMode && handleStartEdit(todo)}
                            className={`flex-1 ${isEditMode ? 'cursor-pointer' : ''} ${
                              todo.isCompleted
                                ? `line-through ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`
                                : isDark
                                  ? 'text-zinc-100'
                                  : 'text-neutral-900'
                            }`}
                          >
                            {todo.text}
                          </span>
                        )}

                        {isEditMode && (
                          <button
                            onClick={() => selectedDate && deleteTodoItem(dateStr, todo.id)}
                            className={`flex-shrink-0 p-1 rounded hover:bg-red-500/10 transition-colors ${
                              isDark ? 'text-red-400' : 'text-red-600'
                            }`}
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div
                      className={`p-4 rounded-lg text-center ${
                        isDark ? 'bg-zinc-800/50 text-zinc-500' : 'bg-neutral-50 text-neutral-400'
                      }`}
                    >
                      No tasks yet
                    </div>
                  )}
                </div>

                {/* Add New Todo - Only in edit mode */}
                {isEditMode && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTodo();
                      }}
                      placeholder="Add a new task..."
                      className={`flex-1 px-4 py-2 rounded-lg border ${
                        isDark
                          ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <Button onClick={handleAddTodo} size="sm">
                      <Plus className="size-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className={`flex gap-4 pt-6 border-t ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
                <Button onClick={handleSave} className="flex-1 h-11 text-base font-semibold">
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1 h-11 text-base">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
