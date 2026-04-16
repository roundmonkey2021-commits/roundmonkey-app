/**
 * useEmotionLookup Hook
 *
 * React hook for accessing emotion playbook data from Psychology Settings
 * Provides reactive access to emotion details based on stored emotion IDs in trades
 */

import { useMemo } from 'react';
import {
  EmotionEntry,
  loadEmotionData,
  getEmotionById,
  getEmotionByName,
  checkEmotionPermission,
  getCorrectiveActions,
  getDiagnosticTest,
  getAllEmotions,
  getEmotionCategory,
} from '../utils/emotionLookup';

type Phase = 'entry' | 'inTrade' | 'exit' | 'postExit';

export function useEmotionLookup() {
  // Load all emotion data (memoized to avoid re-parsing on every render)
  const allEmotions = useMemo(() => ({
    entry: loadEmotionData('entry'),
    inTrade: loadEmotionData('inTrade'),
    exit: loadEmotionData('exit'),
    postExit: loadEmotionData('postExit'),
  }), []);

  /**
   * Get emotion by ID
   */
  const getEmotion = (emotionId: string, phase: Phase): EmotionEntry | null => {
    return getEmotionById(emotionId, phase);
  };

  /**
   * Get emotion by name
   */
  const getEmotionByTypeName = (emotionName: string, phase: Phase): EmotionEntry | null => {
    return getEmotionByName(emotionName, phase);
  };

  /**
   * Check if emotion permits trading
   */
  const checkPermission = (emotionId: string, phase: Phase) => {
    return checkEmotionPermission(emotionId, phase);
  };

  /**
   * Get corrective actions
   */
  const getActions = (emotionId: string, phase: Phase): string => {
    return getCorrectiveActions(emotionId, phase);
  };

  /**
   * Get diagnostic test
   */
  const getTest = (emotionId: string, phase: Phase): string => {
    return getDiagnosticTest(emotionId, phase);
  };

  /**
   * Get all emotions for a phase
   */
  const getPhaseEmotions = (phase: Phase): EmotionEntry[] => {
    return allEmotions[phase];
  };

  /**
   * Get emotion category
   */
  const getCategory = (emotionId: string, phase: Phase): 'red' | 'amber' | 'green' | '' => {
    return getEmotionCategory(emotionId, phase);
  };

  /**
   * Get full emotion details for a trade
   * Returns all 4 phase emotions with full data
   */
  const getTradeEmotions = (trade: {
    entryEmotions?: string;
    inTradeEmotions?: string;
    exitEmotions?: string;
    postExitEmotions?: string;
  }) => {
    return {
      entry: trade.entryEmotions ? getEmotionById(trade.entryEmotions, 'entry') : null,
      inTrade: trade.inTradeEmotions ? getEmotionById(trade.inTradeEmotions, 'inTrade') : null,
      exit: trade.exitEmotions ? getEmotionById(trade.exitEmotions, 'exit') : null,
      postExit: trade.postExitEmotions ? getEmotionById(trade.postExitEmotions, 'postExit') : null,
    };
  };

  /**
   * Check if any emotion in trade is not allowed
   */
  const hasBlockedEmotions = (trade: {
    entryEmotions?: string;
    inTradeEmotions?: string;
    exitEmotions?: string;
    postExitEmotions?: string;
  }): boolean => {
    const checks = [
      trade.entryEmotions ? checkEmotionPermission(trade.entryEmotions, 'entry') : null,
      trade.inTradeEmotions ? checkEmotionPermission(trade.inTradeEmotions, 'inTrade') : null,
      trade.exitEmotions ? checkEmotionPermission(trade.exitEmotions, 'exit') : null,
      trade.postExitEmotions ? checkEmotionPermission(trade.postExitEmotions, 'postExit') : null,
    ];

    return checks.some(check => check?.notAllowed === true);
  };

  return {
    getEmotion,
    getEmotionByTypeName,
    checkPermission,
    getActions,
    getTest,
    getPhaseEmotions,
    getCategory,
    getTradeEmotions,
    hasBlockedEmotions,
    allEmotions,
  };
}
