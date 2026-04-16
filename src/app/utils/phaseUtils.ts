/**
 * Utility functions for parsing and formatting trading phase labels
 */

/**
 * Parse a phase code like "IN-NF-OP-LV-001" into readable format
 * @param phaseCode - Raw phase code (e.g., "IN-NF-OP-LV-001")
 * @returns Simplified label (e.g., "NF Options (Live) - P1")
 */
export function parsePhaseLabel(phaseCode: string): string {
  if (!phaseCode) return 'Unknown Phase';
  
  const parts = phaseCode.split('-');
  if (parts.length < 5) return phaseCode; // Return as-is if format is unexpected
  
  const [assetClass, symbol, instrument, type, number] = parts;
  
  // Map instrument codes
  const instrumentMap: Record<string, string> = {
    'OP': 'Options',
    'FUT': 'Futures',
    'EQ': 'Equity',
    'COM': 'Commodity',
  };
  
  // Map type codes
  const typeMap: Record<string, string> = {
    'LV': 'Live',
    'SIM': 'Sim',
    'PAPER': 'Paper',
  };
  
  const instrumentName = instrumentMap[instrument] || instrument;
  const typeName = typeMap[type] || type;
  const phaseNumber = number.replace(/^0+/, '') || '1'; // Remove leading zeros
  
  return `${symbol} ${instrumentName} (${typeName}) - P${phaseNumber}`;
}

/**
 * Extract unique phases from trades
 * @param trades - Array of trade objects
 * @returns Array of unique phase codes
 */
export function getUniquePhases(trades: any[]): string[] {
  const phases = new Set<string>();
  
  trades.forEach(trade => {
    if (trade.phase) {
      phases.add(trade.phase);
    }
  });
  
  return Array.from(phases).sort();
}

/**
 * Filter trades by selected phases
 * @param trades - Array of trade objects
 * @param selectedPhases - Array of phase codes to include
 * @returns Filtered trades
 */
export function filterTradesByPhases(trades: any[], selectedPhases: string[]): any[] {
  if (selectedPhases.length === 0) return trades; // If no phases selected, return all
  
  return trades.filter(trade => 
    trade.phase && selectedPhases.includes(trade.phase)
  );
}
