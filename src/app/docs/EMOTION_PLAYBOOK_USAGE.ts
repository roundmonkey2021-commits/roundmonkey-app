/**
 * EMOTION PLAYBOOK SYSTEM - USAGE GUIDE
 *
 * This guide demonstrates how to use the emotion playbook system throughout the application.
 */

// =============================================================================
// 1. PSYCHOLOGY SETTINGS (Data Source)
// =============================================================================

/**
 * Location: Settings > Psychology Settings
 *
 * Features:
 * - Default hardcoded emotion playbook for all 4 phases
 * - CSV Import to override default data
 * - Manual editing of emotion entries
 * - Reset to Default button to restore hardcoded data
 *
 * Data Structure:
 * Each emotion has a unique ID (e.g., E001, IT001, EX001, PE001)
 * Fields: type, coreEmotion, underlyingEmotions, internalDialogue,
 *         typicalSigns, appearsWhen, diagnosticTest, correctiveActions,
 *         permission, category
 */

// =============================================================================
// 2. TRADE JOURNAL (Data Capture)
// =============================================================================

/**
 * Location: Trade Journal Form
 *
 * Emotion dropdowns pull from Psychology Settings table:
 * - Entry Emotion: filters emotionalStates by category='entry'
 * - In-Trade Emotion: filters emotionalStates by category='inTrade'
 * - Exit Emotion: filters emotionalStates by category='exit'
 * - Post-Exit Emotion: filters emotionalStates by category='postExit'
 *
 * Important: The emotion ID (not name) is stored in the trade
 */

import { useSettings } from './hooks/useSettings';

function TradeJournalExample() {
  const { settings } = useSettings();

  // Example: Entry Emotion dropdown
  const entryEmotions = settings.emotionalStates.filter(tag => tag.category === 'entry');

  return (
    <select>
      {entryEmotions.map(emotion => (
        <option key={emotion.id} value={emotion.id}>
          {emotion.name}
        </option>
      ))}
    </select>
  );
}

// =============================================================================
// 3. EMOTION LOOKUP (Data Retrieval)
// =============================================================================

/**
 * Use the emotion lookup utilities to retrieve full emotion details
 */

import { useEmotionLookup } from './hooks/useEmotionLookup';

function EmotionAnalysisExample() {
  const emotionLookup = useEmotionLookup();

  // Example trade with emotion IDs
  const trade = {
    entryEmotions: 'entry_E004', // Greedy
    inTradeEmotions: 'inTrade_IT005', // Fearful
    exitEmotions: 'exit_EX002', // Anxious
    postExitEmotions: 'postExit_PE005', // Fearful
  };

  // Get full emotion details
  const emotions = emotionLookup.getTradeEmotions(trade);

  console.log('Entry Emotion:', emotions.entry);
  // Output: { id: 'E004', type: 'Greedy', permission: '🚫 Not Allowed', ... }

  // Check permission
  const entryPermission = emotionLookup.checkPermission(trade.entryEmotions, 'entry');

  if (entryPermission.notAllowed) {
    console.warn('⚠️ Entry emotion not allowed:', entryPermission.message);
  }

  // Get corrective actions
  const actions = emotionLookup.getActions(trade.entryEmotions, 'entry');
  console.log('Corrective Actions:', actions);
  // Output: "🛑 DO NOT TRADE\n• Step away\n• Review risk rules\n• Journal this impulse"

  // Check if any emotion is blocked
  const hasBlocked = emotionLookup.hasBlockedEmotions(trade);
  console.log('Has blocked emotions:', hasBlocked); // true

  return null;
}

// =============================================================================
// 4. CSV EXPORT/IMPORT (Trade History)
// =============================================================================

/**
 * Location: Trade History > Export CSV / Import CSV
 *
 * CSV includes all emotion fields:
 * - entryEmotions (stores emotion ID)
 * - entryEmotionNotes
 * - inTradeEmotions (stores emotion ID)
 * - inTradeEmotionNotes
 * - exitEmotions (stores emotion ID)
 * - exitEmotionNotes
 * - postExitEmotions (stores emotion ID)
 * - postExitEmotionNotes
 *
 * The emotion IDs can be used to look up full emotion details
 */

// =============================================================================
// 5. REAL-TIME WARNINGS (Future Enhancement)
// =============================================================================

/**
 * Example: Show warning when selecting "Greedy" emotion
 */

import { toast } from 'sonner';

function TradeJournalWithWarnings() {
  const emotionLookup = useEmotionLookup();

  const handleEmotionSelect = (emotionId: string, phase: 'entry' | 'inTrade' | 'exit' | 'postExit') => {
    const permission = emotionLookup.checkPermission(emotionId, phase);

    if (permission.notAllowed) {
      toast.error('🚫 Not Allowed', {
        description: permission.message,
      });

      // Show corrective actions
      const actions = emotionLookup.getActions(emotionId, phase);
      console.log('Corrective Actions:', actions);
    } else if (permission.caution) {
      toast.warning('⚠️ Caution', {
        description: permission.message,
      });
    }
  };

  return null;
}

// =============================================================================
// 6. EMOTION OVERVIEW (Analytics)
// =============================================================================

/**
 * Location: Emotion Overview Page
 *
 * Use emotion lookup to enhance analytics:
 * - Show which emotions led to losses
 * - Display corrective actions for frequently occurring negative emotions
 * - Filter trades by emotion category (red/amber/green)
 * - Generate insights based on emotion patterns
 */

function EmotionOverviewExample() {
  const emotionLookup = useEmotionLookup();

  // Example: Analyze trades with "Fearful" entry emotion
  const trades = [
    { id: '1', entryEmotions: 'entry_E005', pnl: -500 },
    { id: '2', entryEmotions: 'entry_E005', pnl: -300 },
    { id: '3', entryEmotions: 'entry_E001', pnl: 1000 },
  ];

  const fearfulTrades = trades.filter(t => {
    const emotion = emotionLookup.getEmotion(t.entryEmotions || '', 'entry');
    return emotion?.type === 'Fearful';
  });

  const totalLoss = fearfulTrades.reduce((sum, t) => sum + t.pnl, 0);

  console.log(`Fearful entry emotion led to ${fearfulTrades.length} trades with total P&L: ${totalLoss}`);

  // Get corrective actions for this emotion
  if (fearfulTrades.length > 0) {
    const actions = emotionLookup.getActions(fearfulTrades[0].entryEmotions, 'entry');
    console.log('Recommended corrective actions:', actions);
  }

  return null;
}

// =============================================================================
// 7. DATA FLOW SUMMARY
// =============================================================================

/**
 * 1. Psychology Settings: Define emotion playbook (hardcoded by default)
 *    - Each emotion has unique ID (E001, IT001, etc.)
 *    - Includes: type, permission, corrective actions, diagnostic test, etc.
 *
 * 2. Settings Hook: Sync emotion types to Trade Journal dropdowns
 *    - emotionalStates array populated from Psychology Settings
 *    - Filtered by category (entry, inTrade, exit, postExit)
 *
 * 3. Trade Journal: Capture emotion ID in trade
 *    - User selects emotion from dropdown
 *    - Emotion ID stored (not name)
 *
 * 4. Trade Storage: Save trade with emotion IDs
 *    - entryEmotions: "entry_E001"
 *    - inTradeEmotions: "inTrade_IT003"
 *    - etc.
 *
 * 5. Emotion Lookup: Retrieve full emotion details
 *    - Use emotion ID to get permission, actions, etc.
 *    - Enable warnings, insights, and analytics
 *
 * 6. CSV Export/Import: Preserve emotion IDs
 *    - Export includes emotion IDs
 *    - Import maintains linkage to playbook
 */

export {};
