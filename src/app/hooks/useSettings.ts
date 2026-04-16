import { create } from 'zustand';
import { toast } from 'sonner';

export interface Strategy {
  id: string;
  name: string;
  setupType: string;
  entryRules: string;
  stopLossLogic: string;
  exitLogic: string;
  marketCondition: string;
  timeframe: string;
  expectedRR: string;
  riskGrade: 'Low' | 'Medium' | 'High';
}

export interface PsychologyTag {
  id: string;
  name: string;
  category: 'emotional' | 'energy' | 'entry' | 'inTrade' | 'exit' | 'postExit';
}

export interface TradingPhase {
  id: string;
  assetClass: string; // Index, Equity, Commodity
  symbol: string; // e.g., NIFTY, BANKNIFTY, CRUDE, GOLD, etc.
  instrument: string; // e.g., Options, Futures, Equity
  phaseType: string; // Paper, Live, or custom
  phaseNumber: number;
  startingCapital: number;
  endingCapital?: number;
  maxLotSize: number;
  perTradeLossPoints: number;
  perTradeLossRupees: number;
  maxDailyLoss: number;
  startDate?: string;
  endDate?: string;
}

// Helper function to generate Phase ID in format: IN-NF-OP-PT-001
export const generatePhaseId = (phase: Partial<TradingPhase>): string => {
  // Asset Class abbreviation (2 chars)
  const assetClassMap: { [key: string]: string } = {
    'Index': 'IN',
    'Equity': 'EQ',
    'Commodity': 'CM',
  };
  const assetAbbr = assetClassMap[phase.assetClass || 'Index'] || phase.assetClass?.substring(0, 2).toUpperCase() || 'XX';
  
  // Symbol abbreviation (2 chars)
  const symbolMap: { [key: string]: string } = {
    'NIFTY': 'NF',
    'BANKNIFTY': 'BN',
    'FINNIFTY': 'FN',
    'MIDCPNIFTY': 'MC',
    'CRUDE': 'CR',
    'GOLD': 'GD',
    'SILVER': 'SL',
    'COPPER': 'CP',
    'NATURALGAS': 'NG',
  };
  const symbolAbbr = symbolMap[phase.symbol || ''] || phase.symbol?.substring(0, 2).toUpperCase() || 'XX';
  
  // Instrument abbreviation (2 chars)
  const instrumentMap: { [key: string]: string } = {
    'Options': 'OP',
    'Futures': 'FU',
    'Cash': 'CS',
  };
  const instrumentAbbr = instrumentMap[phase.instrument || 'Options'] || phase.instrument?.substring(0, 2).toUpperCase() || 'XX';
  
  // Phase Type abbreviation (2 chars)
  const phaseTypeMap: { [key: string]: string } = {
    'Paper': 'PT',
    'Live': 'LV',
  };
  const phaseTypeAbbr = phaseTypeMap[phase.phaseType || 'Paper'] || phase.phaseType?.substring(0, 2).toUpperCase() || 'XX';
  
  // Phase Number (3 digits)
  const phaseNum = (phase.phaseNumber || 1).toString().padStart(3, '0');
  
  return `${assetAbbr}-${symbolAbbr}-${instrumentAbbr}-${phaseTypeAbbr}-${phaseNum}`;
};

interface UserSettings {
  // Trade Defaults
  timeframeMinutes: number;
  defaultInstrument: string;
  defaultQuantity: string;
  defaultLotSize: string;
  defaultStopLossPercent: string;
  defaultRiskRewardRatio: string;
  defaultMarketTrend: string;
  autoCalculatePositionSize: boolean;
  enableQuickEntryMode: boolean;

  // Capital & Risk
  tradingCapital: string;
  maxRiskPerTrade: string;
  maxDailyLossLimit: string;
  maxDailyLossLimitType: 'rupees' | 'percent';
  maxDailyLossPoints: string;
  maxLosingTradesPerDay: string;
  maxOpenPositions: string;
  riskModelType: 'fixed-percent' | 'fixed-rupees' | 'volatility-based';
  lockPositionSize: boolean;

  // Strategy Library
  strategies: Strategy[];
  requireStrategyTag: boolean;

  // Discipline Rules
  flagMovedStopLoss: boolean;
  flagEarlyExit: boolean;
  flagNoStopLoss: boolean;
  flagOutsideTimeWindow: boolean;
  flagOvertrading: boolean;
  maxTradesPerDay: string;
  autoMarkDisciplineError: boolean;
  tradingTimeStart: string;
  tradingTimeEnd: string;

  // Psychology Tags
  emotionalStates: PsychologyTag[];
  energyLevels: PsychologyTag[];
  enableFocusRating: boolean;
  allowCustomTags: boolean;

  // Data & Backup
  autoBackup: boolean;
  cloudSync: boolean;

  // Trading Phases
  tradingPhases: TradingPhase[];
  customSymbols: string[];
  customAssetClasses: string[];
  customInstruments: string[];
  customPhaseTypes: string[];
}

interface SettingsStore {
  settings: UserSettings;
  isLoading: boolean;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  updateTimeframe: (minutes: number) => void;
  updateTradeDefaults: (updates: Partial<UserSettings>) => void;
  updateCapitalRisk: (updates: Partial<UserSettings>) => void;
  updateDisciplineRules: (updates: Partial<UserSettings>) => void;
  updatePsychologyTags: (updates: Partial<UserSettings>) => void;
  updateDataBackup: (updates: Partial<UserSettings>) => void;
  addStrategy: (strategy: Strategy) => void;
  updateStrategy: (id: string, strategy: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  addPsychologyTag: (tag: PsychologyTag) => void;
  deletePsychologyTag: (id: string) => void;
  loadDefaultPsychologyTags: () => void;
  resetAllData: () => void;
  addTradingPhase: (phase: TradingPhase) => void;
  updateTradingPhase: (id: string, phase: Partial<TradingPhase>) => void;
  deleteTradingPhase: (id: string) => void;
  addCustomSymbol: (symbol: string) => void;
  addCustomAssetClass: (assetClass: string) => void;
  addCustomInstrument: (instrument: string) => void;
  addCustomPhaseType: (phaseType: string) => void;
}

export const defaultEmotionalStates: PsychologyTag[] = [
  // Entry emotions (5 core categories)
  { id: '1', name: 'Confident', category: 'entry' },
  { id: '2', name: 'Anxious', category: 'entry' },
  { id: '3', name: 'Calm', category: 'entry' },
  { id: '4', name: 'Greedy', category: 'entry' },
  { id: '5', name: 'Fearful', category: 'entry' },
  
  // In-trade emotions (5 core categories)
  { id: '10', name: 'Confident', category: 'inTrade' },
  { id: '11', name: 'Anxious', category: 'inTrade' },
  { id: '12', name: 'Calm', category: 'inTrade' },
  { id: '13', name: 'Greedy', category: 'inTrade' },
  { id: '14', name: 'Fearful', category: 'inTrade' },
  
  // Exit emotions (5 core categories)
  { id: '20', name: 'Confident', category: 'exit' },
  { id: '21', name: 'Anxious', category: 'exit' },
  { id: '22', name: 'Calm', category: 'exit' },
  { id: '23', name: 'Greedy', category: 'exit' },
  { id: '24', name: 'Fearful', category: 'exit' },
  
  // Post-exit emotions (5 core categories)
  { id: '30', name: 'Confident', category: 'postExit' },
  { id: '31', name: 'Anxious', category: 'postExit' },
  { id: '32', name: 'Calm', category: 'postExit' },
  { id: '33', name: 'Greedy', category: 'postExit' },
  { id: '34', name: 'Fearful', category: 'postExit' },
];

export const defaultEnergyLevels: PsychologyTag[] = [
  { id: '7', name: 'High', category: 'energy' },
  { id: '8', name: 'Medium', category: 'energy' },
  { id: '9', name: 'Low', category: 'energy' },
];

const defaultSettings: UserSettings = {
  timeframeMinutes: 5,
  defaultInstrument: 'NIFTY',
  defaultQuantity: '50',
  defaultLotSize: '1',
  defaultStopLossPercent: '2',
  defaultRiskRewardRatio: '1:2',
  defaultMarketTrend: '',
  autoCalculatePositionSize: false,
  enableQuickEntryMode: false,
  
  tradingCapital: '100000',
  maxRiskPerTrade: '2',
  maxDailyLossLimit: '5000',
  maxDailyLossLimitType: 'rupees',
  maxDailyLossPoints: '100',
  maxLosingTradesPerDay: '3',
  maxOpenPositions: '3',
  riskModelType: 'fixed-percent',
  lockPositionSize: false,
  
  strategies: [],
  requireStrategyTag: false,
  
  flagMovedStopLoss: true,
  flagEarlyExit: true,
  flagNoStopLoss: true,
  flagOutsideTimeWindow: false,
  flagOvertrading: true,
  maxTradesPerDay: '5',
  autoMarkDisciplineError: true,
  tradingTimeStart: '09:15',
  tradingTimeEnd: '15:30',
  
  emotionalStates: defaultEmotionalStates,
  energyLevels: defaultEnergyLevels,
  enableFocusRating: true,
  allowCustomTags: true,
  
  autoBackup: false,
  cloudSync: false,

  tradingPhases: [],
  customSymbols: [],
  customAssetClasses: [],
  customInstruments: [],
  customPhaseTypes: [],
};

export const useSettings = create<SettingsStore>()((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  accessToken: null,

  setAccessToken: (token: string | null) => {
    set({ accessToken: token });
  },

  loadSettings: async () => {
    // Load from localStorage only (no backend calls)
    set({ isLoading: true });
    console.log('Loading settings from localStorage...');
    try {
      const saved = localStorage.getItem('tradejournal_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedSettings = {
          ...defaultSettings,
          ...parsed,
          emotionalStates: parsed.emotionalStates?.length > 0 
            ? parsed.emotionalStates 
            : defaultEmotionalStates,
          energyLevels: parsed.energyLevels?.length > 0 
            ? parsed.energyLevels 
            : defaultEnergyLevels,
        };
        set({ settings: mergedSettings });
      } else {
        set({ settings: defaultSettings });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ settings: defaultSettings });
    } finally {
      set({ isLoading: false });
    }
  },

  saveSettings: async () => {
    // Save to localStorage only (no backend calls)
    const { settings } = get();
    try {
      localStorage.setItem('tradejournal_settings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  },
  
  updateTimeframe: (minutes: number) => {
    set((state) => ({
      settings: { ...state.settings, timeframeMinutes: minutes }
    }));
    get().saveSettings();
  },
  
  updateTradeDefaults: (updates: Partial<UserSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }));
    get().saveSettings();
  },
  
  updateCapitalRisk: (updates: Partial<UserSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }));
    get().saveSettings();
  },
  
  updateDisciplineRules: (updates: Partial<UserSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }));
    get().saveSettings();
  },
  
  updatePsychologyTags: (updates: Partial<UserSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }));
    get().saveSettings();
  },
  
  updateDataBackup: (updates: Partial<UserSettings>) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }));
    get().saveSettings();
  },
  
  addStrategy: (strategy: Strategy) => {
    set((state) => ({
      settings: {
        ...state.settings,
        strategies: [...state.settings.strategies, strategy]
      }
    }));
    get().saveSettings();
  },
  
  updateStrategy: (id: string, updates: Partial<Strategy>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        strategies: state.settings.strategies.map(s => 
          s.id === id ? { ...s, ...updates } : s
        )
      }
    }));
    get().saveSettings();
  },
  
  deleteStrategy: (id: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        strategies: state.settings.strategies.filter(s => s.id !== id)
      }
    }));
    get().saveSettings();
  },
  
  addPsychologyTag: (tag: PsychologyTag) => {
    set((state) => ({
      settings: {
        ...state.settings,
        ...(tag.category === 'energy' 
          ? { energyLevels: [...state.settings.energyLevels, tag] }
          : { emotionalStates: [...state.settings.emotionalStates, tag] }
        )
      }
    }));
    get().saveSettings();
  },
  
  deletePsychologyTag: (id: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        emotionalStates: state.settings.emotionalStates.filter(t => t.id !== id),
        energyLevels: state.settings.energyLevels.filter(t => t.id !== id)
      }
    }));
    get().saveSettings();
  },
  
  loadDefaultPsychologyTags: () => {
    set((state) => ({
      settings: {
        ...state.settings,
        emotionalStates: defaultEmotionalStates,
        energyLevels: defaultEnergyLevels,
      }
    }));
    get().saveSettings();
  },
  
  resetAllData: () => {
    set({ settings: defaultSettings });
    get().saveSettings();
  },

  addTradingPhase: (phase: TradingPhase) => {
    set((state) => ({
      settings: {
        ...state.settings,
        tradingPhases: [...state.settings.tradingPhases, phase]
      }
    }));
    get().saveSettings();
  },

  updateTradingPhase: (id: string, updates: Partial<TradingPhase>) => {
    set((state) => ({
      settings: {
        ...state.settings,
        tradingPhases: state.settings.tradingPhases.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      }
    }));
    get().saveSettings();
  },

  deleteTradingPhase: (id: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        tradingPhases: state.settings.tradingPhases.filter(p => p.id !== id)
      }
    }));
    get().saveSettings();
  },

  addCustomSymbol: (symbol: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customSymbols: [...state.settings.customSymbols, symbol]
      }
    }));
    get().saveSettings();
  },

  addCustomAssetClass: (assetClass: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customAssetClasses: [...state.settings.customAssetClasses, assetClass]
      }
    }));
    get().saveSettings();
  },

  addCustomInstrument: (instrument: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customInstruments: [...state.settings.customInstruments, instrument]
      }
    }));
    get().saveSettings();
  },

  addCustomPhaseType: (phaseType: string) => {
    set((state) => ({
      settings: {
        ...state.settings,
        customPhaseTypes: [...state.settings.customPhaseTypes, phaseType]
      }
    }));
    get().saveSettings();
  },
}));