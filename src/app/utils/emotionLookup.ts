/**
 * Emotion Lookup Utility
 *
 * Provides functions to retrieve full emotion playbook data from Psychology Settings
 * based on emotion ID stored in trades.
 *
 * This enables:
 * - Displaying warnings (permission field)
 * - Showing corrective actions
 * - Accessing diagnostic tests
 * - Supporting analytics and insights
 */

export interface EmotionEntry {
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
  [key: string]: string; // For custom columns
}

type Phase = 'entry' | 'inTrade' | 'exit' | 'postExit';

/**
 * Load emotion data from localStorage for a specific phase
 */
export function loadEmotionData(phase: Phase): EmotionEntry[] {
  try {
    const stored = localStorage.getItem(`psychologySettings_${phase}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.entries || [];
    }
  } catch (error) {
    console.error(`Error loading emotion data for ${phase}:`, error);
  }
  return [];
}

/**
 * Get emotion details by ID and phase
 * @param emotionId - The unique emotion ID (e.g., "E001", "IT001")
 * @param phase - The trading phase (entry, inTrade, exit, postExit)
 * @returns Full emotion entry or null if not found
 */
export function getEmotionById(emotionId: string, phase: Phase): EmotionEntry | null {
  const emotions = loadEmotionData(phase);
  const emotion = emotions.find(e => e.id === emotionId);
  return emotion || null;
}

/**
 * Get emotion details by name and phase
 * @param emotionName - The emotion type name (e.g., "Confident", "Fearful")
 * @param phase - The trading phase
 * @returns Full emotion entry or null if not found
 */
export function getEmotionByName(emotionName: string, phase: Phase): EmotionEntry | null {
  const emotions = loadEmotionData(phase);
  const emotion = emotions.find(e => e.type.toLowerCase() === emotionName.toLowerCase());
  return emotion || null;
}

/**
 * Check if an emotion is permitted for trading
 * @param emotionId - The unique emotion ID
 * @param phase - The trading phase
 * @returns Object with permission status and message
 */
export function checkEmotionPermission(emotionId: string, phase: Phase): {
  allowed: boolean;
  caution: boolean;
  notAllowed: boolean;
  message: string;
} {
  const emotion = getEmotionById(emotionId, phase);

  if (!emotion) {
    return {
      allowed: true,
      caution: false,
      notAllowed: false,
      message: 'Emotion not found in playbook',
    };
  }

  const permission = emotion.permission.toLowerCase();

  if (permission.includes('not allowed') || permission.includes('🚫')) {
    return {
      allowed: false,
      caution: false,
      notAllowed: true,
      message: emotion.permission,
    };
  }

  if (permission.includes('caution') || permission.includes('⚠️')) {
    return {
      allowed: false,
      caution: true,
      notAllowed: false,
      message: emotion.permission,
    };
  }

  return {
    allowed: true,
    caution: false,
    notAllowed: false,
    message: emotion.permission,
  };
}

/**
 * Get corrective actions for an emotion
 * @param emotionId - The unique emotion ID
 * @param phase - The trading phase
 * @returns Corrective actions text or empty string
 */
export function getCorrectiveActions(emotionId: string, phase: Phase): string {
  const emotion = getEmotionById(emotionId, phase);
  return emotion?.correctiveActions || '';
}

/**
 * Get diagnostic test for an emotion
 * @param emotionId - The unique emotion ID
 * @param phase - The trading phase
 * @returns Diagnostic test text or empty string
 */
export function getDiagnosticTest(emotionId: string, phase: Phase): string {
  const emotion = getEmotionById(emotionId, phase);
  return emotion?.diagnosticTest || '';
}

/**
 * Get all emotions for a specific phase
 * @param phase - The trading phase
 * @returns Array of emotion entries
 */
export function getAllEmotions(phase: Phase): EmotionEntry[] {
  return loadEmotionData(phase);
}

/**
 * Get emotion category (red/amber/green)
 * @param emotionId - The unique emotion ID
 * @param phase - The trading phase
 * @returns Category or empty string
 */
export function getEmotionCategory(emotionId: string, phase: Phase): 'red' | 'amber' | 'green' | '' {
  const emotion = getEmotionById(emotionId, phase);
  return emotion?.category || '';
}
