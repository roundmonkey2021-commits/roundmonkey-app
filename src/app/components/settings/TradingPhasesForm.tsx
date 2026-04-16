import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { TradingPhase, generatePhaseId } from "../../hooks/useSettings";
import { X, Plus } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";

// Utility functions for Indian number formatting
const formatIndianNumber = (value: number | string): string => {
  if (value === '' || value === undefined || value === null) return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  
  // Convert to string and split into parts
  const numStr = Math.floor(num).toString();
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

const parseIndianNumber = (formattedValue: string): number => {
  // Remove all commas and parse
  const cleaned = formattedValue.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

interface TradingPhasesFormProps {
  phase: TradingPhase | null;
  onSave: (phase: TradingPhase) => void;
  onCancel: () => void;
  isDark: boolean;
}

// Default symbol configuration by asset class
const DEFAULT_SYMBOLS = {
  Index: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'],
  Equity: [],
  Commodity: ['CRUDE', 'GOLD', 'SILVER', 'COPPER', 'NATURALGAS']
};

// Default instrument options by asset class
const DEFAULT_INSTRUMENTS = {
  Index: ['Options', 'Futures'],
  Equity: ['Options', 'Futures', 'Cash'],
  Commodity: ['Options', 'Futures']
};

export function TradingPhasesForm({ phase, onSave, onCancel, isDark }: TradingPhasesFormProps) {
  const { settings, addCustomSymbol, addCustomAssetClass, addCustomInstrument, addCustomPhaseType } = useSettings();
  const [formData, setFormData] = useState<Partial<TradingPhase>>({
    assetClass: phase?.assetClass || 'Index',
    symbol: phase?.symbol || 'NIFTY',
    instrument: phase?.instrument || 'Options',
    phaseType: phase?.phaseType || 'Paper',
    phaseNumber: phase?.phaseNumber || 1,
    startingCapital: phase?.startingCapital || 0,
    endingCapital: phase?.endingCapital,
    maxLotSize: phase?.maxLotSize || 1,
    perTradeLossPoints: phase?.perTradeLossPoints || 0,
    perTradeLossRupees: phase?.perTradeLossRupees || 0,
    maxDailyLoss: phase?.maxDailyLoss || 0,
    startDate: phase?.startDate || '',
    endDate: phase?.endDate || '',
  });

  const [showAddAssetClass, setShowAddAssetClass] = useState(false);
  const [showAddSymbol, setShowAddSymbol] = useState(false);
  const [showAddInstrument, setShowAddInstrument] = useState(false);
  const [showAddPhaseType, setShowAddPhaseType] = useState(false);
  const [newAssetClass, setNewAssetClass] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newInstrument, setNewInstrument] = useState('');
  const [newPhaseType, setNewPhaseType] = useState('');

  // Generate preview of Phase ID based on current form data
  const previewPhaseId = generatePhaseId(formData);

  // Get all available asset classes
  const getAvailableAssetClasses = () => {
    const defaultAssetClasses = ['Index', 'Equity', 'Commodity'];
    return [...defaultAssetClasses, ...(settings.customAssetClasses || [])];
  };

  // Get available symbols based on asset class
  const getAvailableSymbols = () => {
    const assetClass = formData.assetClass || 'Index';
    const baseSymbols = DEFAULT_SYMBOLS[assetClass as keyof typeof DEFAULT_SYMBOLS] || [];
    
    // Add custom symbols
    const customSymbols = settings.customSymbols || [];
    
    return [...baseSymbols, ...customSymbols];
  };

  // Get available instruments based on asset class
  const getAvailableInstruments = () => {
    const assetClass = formData.assetClass || 'Index';
    const baseInstruments = DEFAULT_INSTRUMENTS[assetClass as keyof typeof DEFAULT_INSTRUMENTS] || ['Options'];
    
    // Add custom instruments
    const customInstruments = settings.customInstruments || [];
    
    return [...baseInstruments, ...customInstruments];
  };

  // Get available phase types
  const getAvailablePhaseTypes = () => {
    const defaultPhaseTypes = ['Paper', 'Live'];
    const customPhaseTypes = settings.customPhaseTypes || [];
    return [...defaultPhaseTypes, ...customPhaseTypes];
  };

  // Reset symbol and instrument when asset class changes
  useEffect(() => {
    const availableSymbols = getAvailableSymbols();
    const availableInstruments = getAvailableInstruments();
    
    // Set default symbol if current symbol is not available
    if (!availableSymbols.includes(formData.symbol || '')) {
      setFormData(prev => ({
        ...prev,
        symbol: availableSymbols[0] || ''
      }));
    }
    
    // Set default instrument if current instrument is not available
    if (!availableInstruments.includes(formData.instrument || '')) {
      setFormData(prev => ({
        ...prev,
        instrument: availableInstruments[0] || 'Options'
      }));
    }
  }, [formData.assetClass]);

  const handleAddAssetClass = () => {
    if (newAssetClass.trim()) {
      const formattedAssetClass = newAssetClass.trim();
      addCustomAssetClass(formattedAssetClass);
      setFormData({ ...formData, assetClass: formattedAssetClass });
      setNewAssetClass('');
      setShowAddAssetClass(false);
    }
  };

  const handleAddSymbol = () => {
    if (newSymbol.trim()) {
      const upperSymbol = newSymbol.trim().toUpperCase();
      addCustomSymbol(upperSymbol);
      setFormData({ ...formData, symbol: upperSymbol });
      setNewSymbol('');
      setShowAddSymbol(false);
    }
  };

  const handleAddInstrument = () => {
    if (newInstrument.trim()) {
      const formattedInstrument = newInstrument.trim();
      addCustomInstrument(formattedInstrument);
      setFormData({ ...formData, instrument: formattedInstrument });
      setNewInstrument('');
      setShowAddInstrument(false);
    }
  };

  const handleAddPhaseType = () => {
    if (newPhaseType.trim()) {
      const formattedPhaseType = newPhaseType.trim();
      addCustomPhaseType(formattedPhaseType);
      setFormData({ ...formData, phaseType: formattedPhaseType });
      setNewPhaseType('');
      setShowAddPhaseType(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Always generate phase ID based on current form data (even when editing)
    const phaseId = generatePhaseId(formData);
    onSave({ ...formData, id: phaseId } as TradingPhase);
  };

  const availableAssetClasses = getAvailableAssetClasses();
  const availableSymbols = getAvailableSymbols();
  const availableInstruments = getAvailableInstruments();
  const availablePhaseTypes = getAvailablePhaseTypes();

  return (
    <div className={`${isDark ? 'bg-zinc-900/50' : 'bg-neutral-100'} border ${isDark ? 'border-zinc-700' : 'border-neutral-300'} rounded-lg p-6 mb-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          {phase ? 'Edit Phase' : 'Add New Phase'}
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Three-Level Hierarchy: Asset Class → Symbol → Instrument */}
        <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="grid grid-cols-3 gap-4">
            {/* Asset Class */}
            <div>
              <Label className={isDark ? 'text-blue-200' : 'text-blue-900'}>Asset Class</Label>
              {!showAddAssetClass ? (
                <Select 
                  value={formData.assetClass} 
                  onValueChange={(value) => {
                    if (value === 'ADD_NEW') {
                      setShowAddAssetClass(true);
                    } else {
                      setFormData({ ...formData, assetClass: value });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAssetClasses.map((ac) => (
                      <SelectItem key={ac} value={ac}>{ac}</SelectItem>
                    ))}
                    <SelectItem value="ADD_NEW">
                      <div className="flex items-center gap-2">
                        <Plus className="size-3" />
                        Add Custom Asset Class
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder="e.g., Forex"
                    value={newAssetClass}
                    onChange={(e) => setNewAssetClass(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="button" size="sm" onClick={handleAddAssetClass}>
                    Add
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setShowAddAssetClass(false);
                      setNewAssetClass('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>

            {/* Symbol */}
            <div>
              <Label className={isDark ? 'text-blue-200' : 'text-blue-900'}>Symbol</Label>
              {!showAddSymbol ? (
                <Select 
                  value={formData.symbol} 
                  onValueChange={(value) => {
                    if (value === 'ADD_NEW') {
                      setShowAddSymbol(true);
                    } else {
                      setFormData({ ...formData, symbol: value });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSymbols.length > 0 ? (
                      availableSymbols.map((sym) => (
                        <SelectItem key={sym} value={sym}>{sym}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="PLACEHOLDER" disabled>No symbols available</SelectItem>
                    )}
                    <SelectItem value="ADD_NEW">
                      <div className="flex items-center gap-2">
                        <Plus className="size-3" />
                        Add Custom Symbol
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder={`e.g., ${formData.assetClass === 'Equity' ? 'RELIANCE' : 'SYMBOL'}`}
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="button" size="sm" onClick={handleAddSymbol}>
                    Add
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setShowAddSymbol(false);
                      setNewSymbol('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>

            {/* Instrument */}
            <div>
              <Label className={isDark ? 'text-blue-200' : 'text-blue-900'}>Instrument</Label>
              {!showAddInstrument ? (
                <Select 
                  value={formData.instrument} 
                  onValueChange={(value) => {
                    if (value === 'ADD_NEW') {
                      setShowAddInstrument(true);
                    } else {
                      setFormData({ ...formData, instrument: value });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstruments.map((inst) => (
                      <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                    ))}
                    <SelectItem value="ADD_NEW">
                      <div className="flex items-center gap-2">
                        <Plus className="size-3" />
                        Add Custom Instrument
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder="e.g., Spreads"
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="button" size="sm" onClick={handleAddInstrument}>
                    Add
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setShowAddInstrument(false);
                      setNewInstrument('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Hierarchy Display */}
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-blue-800' : 'border-blue-300'}`}>
            <div className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'} space-y-1`}>
              <div>
                <strong>Trading Context:</strong>{' '}
                <span className="font-mono">
                  {formData.assetClass} → {formData.symbol} → {formData.instrument}
                </span>
              </div>
              <div>
                <strong>Phase ID:</strong>{' '}
                <span className="font-mono font-semibold text-lg">
                  {previewPhaseId}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Phase Type */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Phase Type</Label>
            {!showAddPhaseType ? (
              <Select 
                value={formData.phaseType} 
                onValueChange={(value) => {
                  if (value === 'ADD_NEW') {
                    setShowAddPhaseType(true);
                  } else {
                    setFormData({ ...formData, phaseType: value });
                  }
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePhaseTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                  <SelectItem value="ADD_NEW">
                    <div className="flex items-center gap-2">
                      <Plus className="size-3" />
                      Add Custom Phase Type
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="e.g., Demo"
                  value={newPhaseType}
                  onChange={(e) => setNewPhaseType(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={handleAddPhaseType}>
                  Add
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAddPhaseType(false);
                    setNewPhaseType('');
                  }}
                >
                  ✕
                </Button>
              </div>
            )}
          </div>

          {/* Phase Number */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Phase Number</Label>
            <Input
              type="number"
              value={formData.phaseNumber}
              onChange={(e) => setFormData({ ...formData, phaseNumber: parseInt(e.target.value) || 1 })}
              className="mt-1.5"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Starting Capital */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Starting Capital (₹)</Label>
            <Input
              type="text"
              value={formatIndianNumber(formData.startingCapital)}
              onChange={(e) => setFormData({ ...formData, startingCapital: parseIndianNumber(e.target.value) || 0 })}
              className="mt-1.5 font-mono"
              required
            />
          </div>

          {/* Ending Capital */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Ending Capital (₹) <span className="text-neutral-400">(Optional)</span></Label>
            <Input
              type="text"
              value={formatIndianNumber(formData.endingCapital || '')}
              onChange={(e) => setFormData({ ...formData, endingCapital: parseIndianNumber(e.target.value) || undefined })}
              className="mt-1.5 font-mono"
              placeholder="Leave blank if ongoing"
            />
          </div>

          {/* Max Lot Size */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Max Lot Size</Label>
            <Input
              type="number"
              value={formData.maxLotSize}
              onChange={(e) => setFormData({ ...formData, maxLotSize: parseInt(e.target.value) || 1 })}
              className="mt-1.5"
              min="1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Per Lot Loss (Points) */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Per Lot Loss (Points)</Label>
            <Input
              type="number"
              value={formData.perTradeLossPoints}
              onChange={(e) => setFormData({ ...formData, perTradeLossPoints: parseFloat(e.target.value) || 0 })}
              className="mt-1.5 font-mono"
              required
            />
          </div>

          {/* Per Trade Loss (₹) */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Per Trade Loss (₹)</Label>
            <Input
              type="text"
              value={formatIndianNumber(formData.perTradeLossRupees)}
              onChange={(e) => setFormData({ ...formData, perTradeLossRupees: parseIndianNumber(e.target.value) || 0 })}
              className="mt-1.5 font-mono"
              required
            />
          </div>

          {/* Max Daily Loss */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Max Daily Loss (₹)</Label>
            <Input
              type="text"
              value={formatIndianNumber(formData.maxDailyLoss)}
              onChange={(e) => setFormData({ ...formData, maxDailyLoss: parseIndianNumber(e.target.value) || 0 })}
              className="mt-1.5 font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>Start Date <span className="text-neutral-400">(Optional)</span></Label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={`mt-1.5 flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors outline-none
                ${isDark 
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-white border-neutral-300 text-neutral-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              style={{ colorScheme: isDark ? 'dark' : 'light' }}
            />
          </div>

          {/* End Date */}
          <div>
            <Label className={isDark ? 'text-zinc-300' : 'text-neutral-700'}>End Date <span className="text-neutral-400">(Optional)</span></Label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={`mt-1.5 flex h-9 w-full rounded-md border px-3 py-1 text-sm transition-colors outline-none
                ${isDark 
                  ? 'bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-white border-neutral-300 text-neutral-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              style={{ colorScheme: isDark ? 'dark' : 'light' }}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {phase ? 'Update Phase' : 'Add Phase'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}