// Utility functions for accessing detailed psychology data

export interface PsychologyEntry {
  id: string;
  type: string;
  coreEmotion: string;
  underlyingEmotions: string;
  internalDialogue: string;
  typicalSigns: string;
  appearsWhen: string;
  diagnosticTest: string;
  correctiveActions: string;
  permission: string;
  category?: 'red' | 'amber' | 'green' | '';
  [key: string]: string | undefined;
}

export interface PhaseData {
  entries: PsychologyEntry[];
  customColumns: Array<{ id: string; name: string }>;
}

export type Phase = 'entry' | 'inTrade' | 'exit' | 'postExit';

/**
 * Load psychology data for a specific phase from localStorage
 */
export const loadPhaseData = (phase: Phase): PhaseData | null => {
  try {
    const stored = localStorage.getItem(`psychologySettings_${phase}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error(`Error loading psychology data for ${phase}:`, error);
    return null;
  }
};

/**
 * Get detailed psychology entry by emotion type and phase
 */
export const getPsychologyEntry = (
  emotionType: string,
  phase: Phase
): PsychologyEntry | null => {
  const phaseData = loadPhaseData(phase);
  if (!phaseData) return null;

  const entry = phaseData.entries.find(
    (e) => e.type.toLowerCase() === emotionType.toLowerCase()
  );
  return entry || null;
};

/**
 * Get all psychology entries for a specific phase
 */
export const getAllPsychologyEntries = (phase: Phase): PsychologyEntry[] => {
  const phaseData = loadPhaseData(phase);
  return phaseData?.entries || [];
};

/**
 * Get all emotion types (names) for a specific phase
 */
export const getEmotionTypes = (phase: Phase): string[] => {
  const phaseData = loadPhaseData(phase);
  return phaseData?.entries.map((e) => e.type).filter(Boolean) || [];
};
