import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  DollarSign,
  Target,
  BookOpen,
  ShieldAlert,
  Brain,
  Database,
  Bell,
  Palette,
  Plus,
  Trash2,
  AlertTriangle,
  Download,
  Upload,
  Save,
  Edit2,
  Layers
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useSettings, Strategy, PsychologyTag, TradingPhase, generatePhaseId } from "../hooks/useSettings";
import { useTheme } from "../hooks/useTheme";
import { TradingPhasesForm } from "./settings/TradingPhasesForm";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { PsychologySettings } from "./settings/PsychologySettings";
import { CSVValidationDialog, ValidationError, CSVValidationResult } from "./CSVValidationDialog";

// Utility function for Indian number formatting
const formatIndianNumber = (value: number): string => {
  const numStr = Math.floor(value).toString();
  let result = '';
  let count = 0;
  
  // Process from right to left
  for (let i = numStr.length - 1; i >= 0; i--) {
    if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
      result = ',' + result;
    }
    result = numStr[i] + result;
    count++;
  }
  
  return result;
};

type SettingsCategory =
  | 'trading-phases'
  | 'trade-defaults'
  | 'strategy-library'
  | 'discipline-rules'
  | 'psychology-settings'
  | 'data-backup'
  | 'notifications'
  | 'customization';

export function Settings() {
  const { theme } = useTheme();
  const { settings, isLoading, updateCapitalRisk, updateTradeDefaults, updateDisciplineRules, updatePsychologyTags, updateDataBackup, addStrategy, deleteStrategy, addPsychologyTag, deletePsychologyTag, loadDefaultPsychologyTags, resetAllData, addTradingPhase, updateTradingPhase, deleteTradingPhase } = useSettings();
  
  // Debug: Log settings to see what we have
  console.log('Settings in Settings component:', settings);
  console.log('Emotional states:', settings.emotionalStates);
  console.log('Energy levels:', settings.energyLevels);
  console.log('Trading phases:', settings.tradingPhases);
  console.log('Is Loading:', isLoading);
  
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('trading-phases');
  const [saved, setSaved] = useState(false);
  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<TradingPhase | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPhaseValidation, setShowPhaseValidation] = useState(false);
  const [phaseValidationResult, setPhaseValidationResult] = useState<CSVValidationResult | null>(null);
  const [pendingPhases, setPendingPhases] = useState<TradingPhase[]>([]);
  
  const [newStrategy, setNewStrategy] = useState<Omit<Strategy, 'id'>>({
    name: '',
    setupType: '',
    entryRules: '',
    stopLossLogic: '',
    exitLogic: '',
    marketCondition: '',
    timeframe: '',
    expectedRR: '',
    riskGrade: 'Medium'
  });

  const [newPsychTag, setNewPsychTag] = useState('');
  const [newPsychCategory, setNewPsychCategory] = useState<'emotional' | 'energy' | 'entry' | 'inTrade' | 'exit' | 'postExit'>('entry');

  // State for inline tag addition in each emotion box
  const [showEntryInput, setShowEntryInput] = useState(false);
  const [showInTradeInput, setShowInTradeInput] = useState(false);
  const [showExitInput, setShowExitInput] = useState(false);
  const [showPostExitInput, setShowPostExitInput] = useState(false);
  const [entryTagInput, setEntryTagInput] = useState('');
  const [inTradeTagInput, setInTradeTagInput] = useState('');
  const [exitTagInput, setExitTagInput] = useState('');
  const [postExitTagInput, setPostExitTagInput] = useState('');

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddStrategy = () => {
    if (newStrategy.name && newStrategy.setupType) {
      addStrategy({
        ...newStrategy,
        id: Date.now().toString()
      });
      setNewStrategy({
        name: '',
        setupType: '',
        entryRules: '',
        stopLossLogic: '',
        exitLogic: '',
        marketCondition: '',
        timeframe: '',
        expectedRR: '',
        riskGrade: 'Medium'
      });
      setShowStrategyForm(false);
      showSaved();
    }
  };

  const handleAddPsychTag = () => {
    if (newPsychTag.trim()) {
      addPsychologyTag({
        id: Date.now().toString(),
        name: newPsychTag.trim(),
        category: newPsychCategory
      });
      setNewPsychTag('');
      showSaved();
    }
  };

  const handleExportCSV = () => {
    // Mock export functionality
    alert('Export to CSV functionality would be implemented here');
  };

  const handleExportExcel = () => {
    // Mock export functionality
    alert('Export to Excel functionality would be implemented here');
  };

  const handleImport = () => {
    // Mock import functionality
    alert('Import trades functionality would be implemented here');
  };

  const handleResetData = () => {
    if (showResetConfirm) {
      resetAllData();
      setShowResetConfirm(false);
      alert('All data has been reset to defaults');
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 5000);
    }
  };

  // CSV Export for Trading Phases (ID is auto-generated on import)
  const handleExportPhasesCSV = () => {
    const headers = [
      'Asset Class',
      'Symbol',
      'Instrument',
      'Phase Type',
      'Phase Number',
      'Starting Capital',
      'Ending Capital',
      'Max Lot Size',
      'Per Lot Loss (Points)',
      'Per Trade Loss (₹)',
      'Max Daily Loss (₹)',
      'Start Date',
      'End Date'
    ];

    const rows = settings.tradingPhases.map((phase) => [
      phase.assetClass,
      phase.symbol,
      phase.instrument,
      phase.phaseType,
      phase.phaseNumber,
      phase.startingCapital,
      phase.endingCapital || '',
      phase.maxLotSize,
      phase.perTradeLossPoints,
      phase.perTradeLossRupees,
      phase.maxDailyLoss,
      phase.startDate || '',
      phase.endDate || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trading-phases-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import for Trading Phases with Validation
  const handleImportPhasesCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Helper function to convert DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
    const convertDateFormat = (dateStr: string): string | undefined => {
      if (!dateStr || !dateStr.trim()) return undefined;

      const trimmed = dateStr.trim();

      // Check if already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      // Check if in DD-MM-YYYY or DD/MM/YYYY format
      const ddmmyyyyMatch = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
      if (ddmmyyyyMatch) {
        const [, day, month, year] = ddmmyyyyMatch;
        return `${year}-${month}-${day}`;
      }

      return undefined;
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          alert('CSV file is empty or invalid');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const expectedHeaders = [
          'Asset Class', 'Symbol', 'Instrument', 'Phase Type', 'Phase Number',
          'Starting Capital', 'Ending Capital', 'Max Lot Size',
          'Per Lot Loss (Points)', 'Per Trade Loss (₹)', 'Max Daily Loss (₹)',
          'Start Date', 'End Date'
        ];

        // Validate headers
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const importedPhases: TradingPhase[] = [];
        const preview: any[] = [];

        // Check for missing required columns (allowing for flexible header matching)
        const requiredFields = ['Asset Class', 'Symbol', 'Instrument', 'Phase Type', 'Starting Capital'];
        const missingRequired = requiredFields.filter(field =>
          !headers.some(h => h.toLowerCase().includes(field.toLowerCase()))
        );

        if (missingRequired.length > 0) {
          errors.push({
            row: 1,
            field: 'Headers',
            message: `Missing required columns: ${missingRequired.join(', ')}`,
            severity: 'error'
          });
        }

        // Parse data rows
        const dataLines = lines.slice(1);
        let validRowCount = 0;

        dataLines.forEach((line, index) => {
          const rowNumber = index + 2;

          try {
            // Parse CSV line (handle quoted values)
            const values: string[] = [];
            let currentValue = '';
            let insideQuotes = false;

            for (let i = 0; i < line.length; i++) {
              const char = line[i];

              if (char === '"') {
                insideQuotes = !insideQuotes;
              } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            values.push(currentValue.trim());

            // Validate row has enough columns
            if (values.length < 13) {
              errors.push({
                row: rowNumber,
                field: 'Row',
                message: `Insufficient columns (expected 13, got ${values.length})`,
                severity: 'error'
              });
              return;
            }

            // Validate required fields
            const rowErrors: ValidationError[] = [];

            if (!values[0]) {
              rowErrors.push({ row: rowNumber, field: 'Asset Class', message: 'Required field is empty', severity: 'error' });
            }
            if (!values[1]) {
              rowErrors.push({ row: rowNumber, field: 'Symbol', message: 'Required field is empty', severity: 'error' });
            }
            if (!values[2]) {
              rowErrors.push({ row: rowNumber, field: 'Instrument', message: 'Required field is empty', severity: 'error' });
            }
            if (!values[3]) {
              rowErrors.push({ row: rowNumber, field: 'Phase Type', message: 'Required field is empty', severity: 'error' });
            }

            // Validate numeric fields
            const phaseNumber = parseInt(values[4]);
            if (values[4] && isNaN(phaseNumber)) {
              rowErrors.push({ row: rowNumber, field: 'Phase Number', message: 'Must be a valid number', severity: 'error' });
            }

            const startingCapital = parseFloat(values[5]);
            if (!values[5] || isNaN(startingCapital)) {
              rowErrors.push({ row: rowNumber, field: 'Starting Capital', message: 'Must be a valid number', severity: 'error' });
            }

            const maxLotSize = parseInt(values[7]);
            if (values[7] && isNaN(maxLotSize)) {
              rowErrors.push({ row: rowNumber, field: 'Max Lot Size', message: 'Must be a valid number', severity: 'error' });
            }

            const perTradeLossPoints = parseFloat(values[8]);
            if (values[8] && isNaN(perTradeLossPoints)) {
              rowErrors.push({ row: rowNumber, field: 'Per Lot Loss (Points)', message: 'Must be a valid number', severity: 'error' });
            }

            const perTradeLossRupees = parseFloat(values[9]);
            if (values[9] && isNaN(perTradeLossRupees)) {
              rowErrors.push({ row: rowNumber, field: 'Per Trade Loss', message: 'Must be a valid number', severity: 'error' });
            }

            const maxDailyLoss = parseFloat(values[10]);
            if (values[10] && isNaN(maxDailyLoss)) {
              rowErrors.push({ row: rowNumber, field: 'Max Daily Loss', message: 'Must be a valid number', severity: 'error' });
            }

            // Validate dates
            if (values[11] && !convertDateFormat(values[11])) {
              warnings.push({ row: rowNumber, field: 'Start Date', message: 'Invalid date format (use YYYY-MM-DD or DD-MM-YYYY)', severity: 'warning' });
            }
            if (values[12] && !convertDateFormat(values[12])) {
              warnings.push({ row: rowNumber, field: 'End Date', message: 'Invalid date format (use YYYY-MM-DD or DD-MM-YYYY)', severity: 'warning' });
            }

            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              // Create phase object if no errors
              const phaseData: Partial<TradingPhase> = {
                assetClass: values[0],
                symbol: values[1],
                instrument: values[2],
                phaseType: values[3],
                phaseNumber: phaseNumber || 1,
                startingCapital: startingCapital || 0,
                endingCapital: values[6] ? parseFloat(values[6]) : undefined,
                maxLotSize: maxLotSize || 1,
                perTradeLossPoints: perTradeLossPoints || 0,
                perTradeLossRupees: perTradeLossRupees || 0,
                maxDailyLoss: maxDailyLoss || 0,
                startDate: convertDateFormat(values[11]),
                endDate: convertDateFormat(values[12])
              };

              const generatedId = generatePhaseId(phaseData);
              const phase: TradingPhase = {
                ...phaseData,
                id: generatedId
              } as TradingPhase;

              importedPhases.push(phase);
              validRowCount++;

              // Add to preview
              if (preview.length < 5) {
                preview.push({
                  'Asset Class': values[0],
                  'Symbol': values[1],
                  'Instrument': values[2],
                  'Phase Type': values[3],
                  'Phase #': phaseNumber,
                  'Start Capital': `₹${startingCapital.toLocaleString('en-IN')}`
                });
              }
            }
          } catch (err) {
            errors.push({
              row: rowNumber,
              field: 'Row',
              message: `Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`,
              severity: 'error'
            });
          }
        });

        // Show validation dialog
        const result: CSVValidationResult = {
          isValid: errors.length === 0,
          errors,
          warnings,
          validRowCount,
          totalRowCount: dataLines.length,
          preview
        };

        setPhaseValidationResult(result);
        setPendingPhases(importedPhases);
        setShowPhaseValidation(true);

      } catch (err) {
        console.error('Import error:', err);
        alert('Error reading CSV file. Please check the file format.');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  // Confirm phase import after validation
  const confirmPhaseImport = () => {
    pendingPhases.forEach(phase => {
      const existingPhase = settings.tradingPhases.find(p => p.id === phase.id);
      if (existingPhase) {
        updateTradingPhase(phase.id, phase);
      } else {
        addTradingPhase(phase);
      }
    });

    setShowPhaseValidation(false);
    setPendingPhases([]);
    alert(`Successfully imported ${pendingPhases.length} trading phase(s)`);
  };

  const isDark = theme === 'dark';

  const categories = [
    { id: 'trading-phases', label: 'Trading Phases', icon: Layers },
    { id: 'trade-defaults', label: 'Trade Defaults', icon: Target },
    { id: 'strategy-library', label: 'Strategy Library', icon: BookOpen },
    { id: 'discipline-rules', label: 'Discipline Rules', icon: ShieldAlert },
    { id: 'psychology-settings', label: 'Psychology Settings', icon: Brain },
    { id: 'data-backup', label: 'Data & Backup', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'customization', label: 'Customization', icon: Palette },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-900' : 'bg-neutral-50'}`}>
      {/* Header */}
      <header className={`border-b ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-neutral-200 bg-white'}`}>
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Settings
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                Configure your trading journal preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="text-sm text-emerald-600 font-medium">Saved ✓</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="px-8 py-6 flex gap-6">
        {/* Left Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg overflow-hidden sticky top-6`}>
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id as SettingsCategory)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? isDark
                        ? 'bg-zinc-700 text-zinc-100 border-l-2 border-zinc-400'
                        : 'bg-neutral-100 text-neutral-900 border-l-2 border-neutral-900'
                      : isDark
                        ? 'text-zinc-400 hover:bg-zinc-700/50'
                        : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="size-4" />
                  {category.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Trading Phases */}
          {activeCategory === 'trading-phases' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6 space-y-6`}>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-700">
                <div className="flex items-center gap-2">
                  <Layers className={`size-5 ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`} />
                  <h2 className={`text-base font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    Trading Phases
                  </h2>
                </div>
                {!showPhaseForm && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPhasesCSV}
                      disabled={settings.tradingPhases.length === 0}
                    >
                      <Download className="size-4 mr-2" />
                      Export CSV
                    </Button>
                    <label className="cursor-pointer">
                      <div className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-8 px-3 border ${isDark ? 'bg-zinc-800/30 border-zinc-700 hover:bg-zinc-700/50 text-zinc-100' : 'bg-white border-neutral-300 hover:bg-neutral-100 text-neutral-900'}`}>
                        <Upload className="size-4" />
                        Import CSV
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleImportPhasesCSV}
                        className="hidden"
                      />
                    </label>
                    <Button onClick={() => {
                      setShowPhaseForm(true);
                      setEditingPhase(null);
                    }}>
                      <Plus className="size-4 mr-2" />
                      Add New Phase
                    </Button>
                  </div>
                )}
              </div>

              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                Define and manage trading phases to track progression, capital evolution, and risk rules.
              </p>

              {/* Phase Form */}
              {showPhaseForm && (
                <TradingPhasesForm
                  phase={editingPhase}
                  onSave={(phase) => {
                    if (editingPhase) {
                      updateTradingPhase(editingPhase.id, phase);
                    } else {
                      addTradingPhase(phase);
                    }
                    setShowPhaseForm(false);
                    setEditingPhase(null);
                  }}
                  onCancel={() => {
                    setShowPhaseForm(false);
                    setEditingPhase(null);
                  }}
                  isDark={isDark}
                />
              )}

              {/* Phases List */}
              {isLoading ? (
                <div className={`text-center py-8 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                  Loading trading phases...
                </div>
              ) : settings.tradingPhases && settings.tradingPhases.length > 0 ? (
                <div className="space-y-3">
                  {settings.tradingPhases.map((phase) => (
                    <Card key={phase.id} className={isDark ? 'bg-zinc-900 border-zinc-700' : ''}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 grid grid-cols-5 gap-4">
                            {/* Asset Class → Symbol → Instrument */}
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Trading Context</div>
                              <div className={`text-sm font-mono ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                                {phase.assetClass} → {phase.symbol} → {phase.instrument}
                              </div>
                              <div className="mt-2 space-y-1">
                                <Badge variant={phase.phaseType === 'Live' ? 'default' : 'secondary'}>
                                  {phase.phaseType}
                                </Badge>
                                <div className={`text-xs font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                  ID: {phase.id}
                                </div>
                              </div>
                            </div>

                            {/* Phase Number */}
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Phase</div>
                              <div className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                                {phase.phaseNumber}
                              </div>
                            </div>

                            {/* Capital */}
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Capital</div>
                              <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                                Start: ₹{formatIndianNumber(phase.startingCapital)}
                              </div>
                              {phase.endingCapital && (
                                <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                                  End: ₹{formatIndianNumber(phase.endingCapital)}
                                </div>
                              )}
                            </div>

                            {/* Risk Parameters */}
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Risk Parameters</div>
                              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Max Lot: <strong>{phase.maxLotSize}</strong>
                              </div>
                              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Per Trade: <strong>{phase.perTradeLossPoints} pts / ₹{formatIndianNumber(phase.perTradeLossRupees)}</strong>
                              </div>
                              <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                Daily Max: <strong>₹{formatIndianNumber(phase.maxDailyLoss)}</strong>
                              </div>
                            </div>

                            {/* Dates */}
                            <div>
                              <div className="text-xs text-neutral-500 mb-1">Duration</div>
                              {phase.startDate && (
                                <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                  From: {new Date(phase.startDate).toLocaleDateString()}
                                </div>
                              )}
                              {phase.endDate && (
                                <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                                  To: {new Date(phase.endDate).toLocaleDateString()}
                                </div>
                              )}
                              {!phase.startDate && !phase.endDate && (
                                <div className={`text-xs italic ${isDark ? 'text-zinc-500' : 'text-neutral-400'}`}>
                                  No dates set
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPhase(phase);
                                setShowPhaseForm(true);
                              }}
                            >
                              <Edit2 className="size-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this phase?')) {
                                  deleteTradingPhase(phase.id);
                                }
                              }}
                            >
                              <Trash2 className="size-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                !showPhaseForm && (
                  <div className={`${isDark ? 'bg-zinc-900/50 border-zinc-700' : 'bg-neutral-50 border-neutral-200'} border rounded-lg p-8 text-center`}>
                    <Layers className={`size-12 mx-auto mb-3 ${isDark ? 'text-zinc-600' : 'text-neutral-300'}`} />
                    <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                      No trading phases defined yet. Add your first phase to get started.
                    </p>
                    <Button 
                      onClick={() => {
                        setShowPhaseForm(true);
                        setEditingPhase(null);
                      }}
                      className="mt-4"
                    >
                      <Plus className="size-4 mr-2" />
                      Add First Phase
                    </Button>
                  </div>
                )
              )}

              <div className={`${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mt-6`}>
                <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
                  <strong>Integration:</strong> Phases feed into the "Trading Phase" dropdown in your trade entry form, automatically populating allowed lot size and risk limits.
                </p>
              </div>
            </div>
          )}

          {/* Trade Defaults */}
          {activeCategory === 'trade-defaults' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6 space-y-6`}>
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-700">
                <Target className={`size-5 ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`} />
                <h2 className={`text-base font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                  Trade Defaults
                </h2>
              </div>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                These values will pre-fill new trade entries for faster data capture.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Default Instrument</Label>
                  <Select 
                    value={settings.defaultInstrument}
                    onValueChange={(value) => {
                      updateTradeDefaults({ defaultInstrument: value });
                      showSaved();
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NIFTY">NIFTY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Default Quantity / Lot Size</Label>
                  <Input
                    type="number"
                    value={settings.defaultQuantity}
                    onChange={(e) => updateTradeDefaults({ defaultQuantity: e.target.value })}
                    onBlur={showSaved}
                    className="mt-1.5 font-mono"
                  />
                </div>

                <div>
                  <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Default Stop Loss (%)</Label>
                  <Input
                    type="number"
                    value={settings.defaultStopLossPercent}
                    onChange={(e) => updateTradeDefaults({ defaultStopLossPercent: e.target.value })}
                    onBlur={showSaved}
                    placeholder="Optional"
                    className="mt-1.5 font-mono"
                  />
                </div>

                <div>
                  <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Default Risk-Reward Ratio</Label>
                  <Input
                    value={settings.defaultRiskRewardRatio}
                    onChange={(e) => updateTradeDefaults({ defaultRiskRewardRatio: e.target.value })}
                    onBlur={showSaved}
                    placeholder="e.g., 1:2"
                    className="mt-1.5 font-mono"
                  />
                </div>

                <div>
                  <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Default Market Trend</Label>
                  <Select 
                    value={settings.defaultMarketTrend || "none"}
                    onValueChange={(value) => {
                      updateTradeDefaults({ defaultMarketTrend: value === "none" ? "" : value });
                      showSaved();
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="bullish">Bullish</SelectItem>
                      <SelectItem value="bearish">Bearish</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Timeframe (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.timeframeMinutes}
                    onChange={(e) => updateTradeDefaults({ timeframeMinutes: parseInt(e.target.value) })}
                    onBlur={showSaved}
                    className="mt-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoCalcPosition"
                    checked={settings.autoCalculatePositionSize}
                    onCheckedChange={(checked) => {
                      updateTradeDefaults({ autoCalculatePositionSize: !!checked });
                      showSaved();
                    }}
                  />
                  <Label htmlFor="autoCalcPosition" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                    Auto-calculate Position Size based on risk settings
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quickEntry"
                    checked={settings.enableQuickEntryMode}
                    onCheckedChange={(checked) => {
                      updateTradeDefaults({ enableQuickEntryMode: !!checked });
                      showSaved();
                    }}
                  />
                  <Label htmlFor="quickEntry" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                    Enable Quick Entry Mode by default
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Library */}
          {activeCategory === 'strategy-library' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6 space-y-6`}>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-700">
                <div className="flex items-center gap-2">
                  <BookOpen className={`size-5 ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`} />
                  <h2 className={`text-base font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                    Strategy Library
                  </h2>
                </div>
                <Button size="sm" onClick={() => setShowStrategyForm(!showStrategyForm)} className="gap-2">
                  <Plus className="size-4" />
                  Add Strategy
                </Button>
              </div>

              {showStrategyForm && (
                <div className={`${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-neutral-50 border-neutral-200'} border rounded-lg p-4 space-y-4`}>
                  <h3 className={`font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>New Strategy Template</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Strategy Name *</Label>
                      <Input
                        value={newStrategy.name}
                        onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                        placeholder="e.g., Iron Condor"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Setup Type *</Label>
                      <Input
                        value={newStrategy.setupType}
                        onChange={(e) => setNewStrategy({ ...newStrategy, setupType: e.target.value })}
                        placeholder="e.g., Range Bound"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Entry Rules</Label>
                    <Textarea
                      value={newStrategy.entryRules}
                      onChange={(e) => setNewStrategy({ ...newStrategy, entryRules: e.target.value })}
                      placeholder="Describe entry conditions..."
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Stop Loss Logic</Label>
                      <Input
                        value={newStrategy.stopLossLogic}
                        onChange={(e) => setNewStrategy({ ...newStrategy, stopLossLogic: e.target.value })}
                        placeholder="e.g., 20% of premium"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Exit Logic</Label>
                      <Input
                        value={newStrategy.exitLogic}
                        onChange={(e) => setNewStrategy({ ...newStrategy, exitLogic: e.target.value })}
                        placeholder="e.g., 50% profit target"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Market Condition</Label>
                      <Input
                        value={newStrategy.marketCondition}
                        onChange={(e) => setNewStrategy({ ...newStrategy, marketCondition: e.target.value })}
                        placeholder="e.g., Low volatility"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Timeframe</Label>
                      <Input
                        value={newStrategy.timeframe}
                        onChange={(e) => setNewStrategy({ ...newStrategy, timeframe: e.target.value })}
                        placeholder="e.g., 5 min"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Expected R:R</Label>
                      <Input
                        value={newStrategy.expectedRR}
                        onChange={(e) => setNewStrategy({ ...newStrategy, expectedRR: e.target.value })}
                        placeholder="e.g., 1:2"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Risk Grade</Label>
                    <Select 
                      value={newStrategy.riskGrade}
                      onValueChange={(value: 'Low' | 'Medium' | 'High') => setNewStrategy({ ...newStrategy, riskGrade: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAddStrategy} className="gap-2">
                      <Save className="size-4" />
                      Save Strategy
                    </Button>
                    <Button variant="outline" onClick={() => setShowStrategyForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {settings.strategies.length === 0 ? (
                  <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'} text-center py-8`}>
                    No strategies defined yet. Click "Add Strategy" to create one.
                  </p>
                ) : (
                  settings.strategies.map((strategy) => (
                    <div key={strategy.id} className={`${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-neutral-50 border-neutral-200'} border rounded-lg p-4`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>
                              {strategy.name}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              strategy.riskGrade === 'Low' 
                                ? 'bg-green-900/30 text-green-400'
                                : strategy.riskGrade === 'Medium'
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-red-900/30 text-red-400'
                            }`}>
                              {strategy.riskGrade} Risk
                            </span>
                          </div>
                          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mb-2`}>
                            {strategy.setupType} • {strategy.timeframe} • {strategy.expectedRR}
                          </p>
                          {strategy.entryRules && (
                            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} line-clamp-2`}>
                              {strategy.entryRules}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStrategy(strategy.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-zinc-700">
                <Checkbox
                  id="requireStrategy"
                  checked={settings.requireStrategyTag}
                  onCheckedChange={(checked) => {
                    updateTradeDefaults({ requireStrategyTag: !!checked });
                    showSaved();
                  }}
                />
                <Label htmlFor="requireStrategy" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                  Only allow trades tagged to existing strategy
                </Label>
              </div>
            </div>
          )}

          {/* Discipline Rules */}
          {activeCategory === 'discipline-rules' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6 space-y-6`}>
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-700">
                <ShieldAlert className={`size-5 ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`} />
                <h2 className={`text-base font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                  Discipline Rules Engine
                </h2>
              </div>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
                Automatically detect and flag violations in trading discipline.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="flagSL"
                    checked={settings.flagMovedStopLoss}
                    onCheckedChange={(checked) => {
                      updateDisciplineRules({ flagMovedStopLoss: !!checked });
                      showSaved();
                    }}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="flagSL" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Flag if Stop Loss moved against plan
                    </Label>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-0.5`}>
                      Detects when you moved your SL to give more room to a losing trade
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="flagExit"
                    checked={settings.flagEarlyExit}
                    onCheckedChange={(checked) => {
                      updateDisciplineRules({ flagEarlyExit: !!checked });
                      showSaved();
                    }}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="flagExit" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Flag if exited before target without reason
                    </Label>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-0.5`}>
                      Highlights premature exits that weren't part of the plan
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="flagNoSL"
                    checked={settings.flagNoStopLoss}
                    onCheckedChange={(checked) => {
                      updateDisciplineRules({ flagNoStopLoss: !!checked });
                      showSaved();
                    }}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor="flagNoSL" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Flag if no predefined Stop Loss entered
                    </Label>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-0.5`}>
                      Warns when entering a trade without defining risk
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="flagTime"
                    checked={settings.flagOutsideTimeWindow}
                    onCheckedChange={(checked) => {
                      updateDisciplineRules({ flagOutsideTimeWindow: !!checked });
                      showSaved();
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="flagTime" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Flag if trade taken outside allowed time window
                    </Label>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-0.5 mb-2`}>
                      Only trade during your defined hours
                    </p>
                    {settings.flagOutsideTimeWindow && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div>
                          <Label className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>Start Time</Label>
                          <Input
                            type="time"
                            value={settings.tradingTimeStart}
                            onChange={(e) => updateDisciplineRules({ tradingTimeStart: e.target.value })}
                            onBlur={showSaved}
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                        <div>
                          <Label className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>End Time</Label>
                          <Input
                            type="time"
                            value={settings.tradingTimeEnd}
                            onChange={(e) => updateDisciplineRules({ tradingTimeEnd: e.target.value })}
                            onBlur={showSaved}
                            className="mt-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="flagOvertrade"
                    checked={settings.flagOvertrading}
                    onCheckedChange={(checked) => {
                      updateDisciplineRules({ flagOvertrading: !!checked });
                      showSaved();
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="flagOvertrade" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                      Flag overtrading (trades per day limit)
                    </Label>
                    {settings.flagOvertrading && (
                      <Input
                        type="number"
                        value={settings.maxTradesPerDay}
                        onChange={(e) => updateDisciplineRules({ maxTradesPerDay: e.target.value })}
                        onBlur={showSaved}
                        placeholder="Max trades per day"
                        className="mt-2 w-40 font-mono"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-zinc-700">
                <Checkbox
                  id="autoMark"
                  checked={settings.autoMarkDisciplineError}
                  onCheckedChange={(checked) => {
                    updateDisciplineRules({ autoMarkDisciplineError: !!checked });
                    showSaved();
                  }}
                />
                <Label htmlFor="autoMark" className={`font-medium cursor-pointer ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>
                  Auto-mark discipline error when rule violated
                </Label>
              </div>
            </div>
          )}

          {/* Psychology Settings */}
          {activeCategory === 'psychology-settings' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6`}>
              <PsychologySettings isDark={isDark} />
            </div>
          )}

          {/* Data & Backup */}
          {activeCategory === 'data-backup' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6 space-y-6`}>
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-700">
                <Database className={`size-5 ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`} />
                <h2 className={`text-base font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                  Data & Backup
                </h2>
              </div>

              <div>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>Export Data</h3>
                <div className="flex gap-3">
                  <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                    <Download className="size-4" />
                    Export to CSV
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline" className="gap-2">
                    <Download className="size-4" />
                    Export to Excel
                  </Button>
                </div>
              </div>

              <div>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-zinc-200' : 'text-neutral-800'}`}>Import Data</h3>
                <Button onClick={handleImport} variant="outline" className="gap-2">
                  <Upload className="size-4" />
                  Import Trades
                </Button>
                <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-2`}>
                  Import trades from CSV or Excel file
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-700">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoBackup"
                    checked={settings.autoBackup}
                    onCheckedChange={(checked) => {
                      updateDataBackup({ autoBackup: !!checked });
                      showSaved();
                    }}
                  />
                  <Label htmlFor="autoBackup" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                    Auto Backup (saves data locally every hour)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cloudSync"
                    checked={settings.cloudSync}
                    onCheckedChange={(checked) => {
                      updateDataBackup({ cloudSync: !!checked });
                      showSaved();
                    }}
                  />
                  <Label htmlFor="cloudSync" className={`font-normal cursor-pointer ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
                    Cloud Sync (requires account connection)
                  </Label>
                </div>
              </div>

              <div className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mt-6`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className={`font-medium mb-2 ${isDark ? 'text-red-200' : 'text-red-900'}`}>Danger Zone</h3>
                    <p className={`text-sm mb-3 ${isDark ? 'text-red-300' : 'text-red-800'}`}>
                      This will permanently delete all your trades, settings, and data. This action cannot be undone.
                    </p>
                    <Button 
                      onClick={handleResetData}
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                    >
                      {showResetConfirm ? 'Click Again to Confirm' : 'Reset All Data'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeCategory === 'notifications' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6`}>
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-700">
                <Bell className={`size-5 ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`} />
                <h2 className={`text-base font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                  Notifications
                </h2>
              </div>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-6 text-center py-12`}>
                Notification settings coming soon...
              </p>
            </div>
          )}

          {/* Customization */}
          {activeCategory === 'customization' && (
            <div className={`${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-neutral-200'} border rounded-lg p-6`}>
              <div className="flex items-center gap-2 pb-4 border-b border-zinc-700">
                <Palette className={`size-5 ${isDark ? 'text-zinc-400' : 'text-neutral-400'}`} />
                <h2 className={`text-base font-medium ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                  Customization
                </h2>
              </div>
              <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'} mt-6 text-center py-12`}>
                Theme and customization options coming soon...
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Phase CSV Validation Dialog */}
      {phaseValidationResult && (
        <CSVValidationDialog
          isOpen={showPhaseValidation}
          onClose={() => setShowPhaseValidation(false)}
          onConfirm={confirmPhaseImport}
          result={phaseValidationResult}
          title="Trading Phases Import Validation"
          isDark={isDark}
        />
      )}
    </div>
  );
}