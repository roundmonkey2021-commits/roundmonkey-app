import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { parsePhaseLabel } from '../../utils/phaseUtils';

interface PhaseFilterProps {
  phases: string[];
  selectedPhases: string[];
  onSelectionChange: (selectedPhases: string[]) => void;
  isDark: boolean;
}

export function PhaseFilter({ phases, selectedPhases, onSelectionChange, isDark }: PhaseFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const togglePhase = (phase: string) => {
    if (selectedPhases.includes(phase)) {
      // Deselect
      const newSelection = selectedPhases.filter(p => p !== phase);
      onSelectionChange(newSelection.length === 0 ? phases : newSelection); // If all deselected, select all
    } else {
      // Select
      onSelectionChange([...selectedPhases, phase]);
    }
  };

  const selectAll = () => {
    onSelectionChange(phases);
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  const allSelected = selectedPhases.length === phases.length;
  const someSelected = selectedPhases.length > 0 && selectedPhases.length < phases.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 text-xs font-medium rounded-md border transition-colors flex items-center gap-2 ${
          isDark
            ? 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
            : 'bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50'
        }`}
      >
        <span>Phases</span>
        {someSelected && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
          }`}>
            {selectedPhases.length}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-2 w-80 rounded-lg border shadow-lg z-50 ${
            isDark
              ? 'bg-zinc-900 border-zinc-700'
              : 'bg-white border-neutral-300'
          }`}
        >
          {/* Header with Select/Deselect All */}
          <div className={`px-3 py-2 border-b ${isDark ? 'border-zinc-700' : 'border-neutral-200'}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                Filter by Phase
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    isDark
                      ? 'text-blue-400 hover:bg-zinc-800'
                      : 'text-blue-600 hover:bg-neutral-100'
                  }`}
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className={`text-[10px] px-2 py-1 rounded transition-colors ${
                    isDark
                      ? 'text-zinc-400 hover:bg-zinc-800'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Phase List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {phases.length === 0 ? (
              <div className={`px-3 py-6 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                No phases found
              </div>
            ) : (
              <div className="space-y-1">
                {phases.map(phase => {
                  const isSelected = selectedPhases.includes(phase);
                  const label = parsePhaseLabel(phase);

                  return (
                    <label
                      key={phase}
                      className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${
                        isDark
                          ? 'hover:bg-zinc-800'
                          : 'hover:bg-neutral-100'
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePhase(phase)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? isDark
                                ? 'bg-blue-500 border-blue-500'
                                : 'bg-blue-600 border-blue-600'
                              : isDark
                              ? 'border-zinc-600'
                              : 'border-neutral-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${
                          isDark ? 'text-zinc-200' : 'text-neutral-900'
                        }`}>
                          {label}
                        </p>
                        <p className={`text-[10px] truncate ${
                          isDark ? 'text-zinc-500' : 'text-neutral-500'
                        }`}>
                          {phase}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
