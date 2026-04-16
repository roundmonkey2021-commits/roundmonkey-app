import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getEmotionFieldFromTrade } from './useEmotionData';
import { useState, useMemo } from 'react';
import { calculatePnL } from '../../utils/tradeCalculations';
import { MessageSquare, Lightbulb } from 'lucide-react';

interface Trade {
  id: string;
  pnl?: number;
  entryEmotions?: string;
  inTradeEmotions?: string;
  exitEmotions?: string;
  postExitEmotions?: string;
  entryEmotionNotes?: string;
  inTradeEmotionNotes?: string;
  exitEmotionNotes?: string;
  postExitEmotionNotes?: string;
}

interface BehavioralInsightsFromNotesProps {
  closedTrades: Trade[];
  isDark: boolean;
}

type EmotionStage = 'entry' | 'inTrade' | 'exit' | 'postExit';

export function BehavioralInsightsFromNotes({ closedTrades, isDark }: BehavioralInsightsFromNotesProps) {
  const [selectedStage, setSelectedStage] = useState<EmotionStage | 'all'>('all');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all');

  // Extract all notes with their emotion and stage
  const notesData = useMemo(() => {
    const notes: Array<{
      note: string;
      emotion: string;
      stage: EmotionStage;
      pnl?: number;
    }> = [];

    // Safety check for closedTrades
    if (!closedTrades || !Array.isArray(closedTrades)) {
      return notes;
    }

    closedTrades.forEach((trade) => {
      if (trade.entryEmotionNotes || trade.inTradeEmotionNotes || trade.exitEmotionNotes || trade.postExitEmotionNotes) {
        const stages: EmotionStage[] = ['entry', 'inTrade', 'exit', 'postExit'];
        
        stages.forEach((stage) => {
          const note = trade[`${stage}EmotionNotes` as keyof Trade];
          if (note && note.trim()) {
            const emotion = getEmotionFieldFromTrade(trade, stage);
            if (emotion && emotion.trim() && emotion.toLowerCase() !== 'none') {
              notes.push({
                note: note.trim(),
                emotion,
                stage,
                pnl: trade.pnl,
              });
            }
          }
        });
      }
    });

    return notes;
  }, [closedTrades]);

  // Get all unique emotions
  const allEmotions = useMemo(() => {
    const emotions = new Set<string>();
    notesData.forEach((note) => emotions.add(note.emotion));
    return Array.from(emotions).sort();
  }, [notesData]);

  // Filter notes based on selected stage and emotion
  const filteredNotes = useMemo(() => {
    return notesData.filter((note) => {
      const stageMatch = selectedStage === 'all' || note.stage === selectedStage;
      const emotionMatch = selectedEmotion === 'all' || note.emotion === selectedEmotion;
      return stageMatch && emotionMatch;
    });
  }, [notesData, selectedStage, selectedEmotion]);

  // Extract behavioral patterns
  const behavioralPatterns = useMemo(() => {
    const patterns: Array<{
      pattern: string;
      context: string;
      count: number;
      keywords: string[];
    }> = [];

    // Define pattern keywords to look for
    const patternKeywords = [
      {
        keywords: ['hesitat', 'unsure', 'doubt', 'uncertain'],
        pattern: 'Hesitation and uncertainty',
        baseContext: 'decision-making',
      },
      {
        keywords: ['fomo', 'fear of missing', 'everyone', 'missing out'],
        pattern: 'FOMO-driven decisions',
        baseContext: 'impulsive behavior',
      },
      {
        keywords: ['hold', 'wait', 'more profit', 'target', 'higher', 'lower'],
        pattern: 'Target and profit expectations',
        baseContext: 'position management',
      },
      {
        keywords: ['mistake', 'should have', 'shouldve', 'regret', 'wrong'],
        pattern: 'Self-criticism and regret',
        baseContext: 'post-trade reflection',
      },
      {
        keywords: ['confident', 'sure', 'clear', 'perfect', 'good setup'],
        pattern: 'High confidence in setup',
        baseContext: 'trade conviction',
      },
      {
        keywords: ['panic', 'scared', 'fear', 'worry', 'anxious'],
        pattern: 'Panic and fear responses',
        baseContext: 'emotional reaction',
      },
      {
        keywords: ['revenge', 'get back', 'recover', 'make up'],
        pattern: 'Revenge trading mindset',
        baseContext: 'loss recovery attempt',
      },
    ];

    patternKeywords.forEach((patternDef) => {
      const matchingNotes = filteredNotes.filter((note) =>
        patternDef.keywords.some((keyword) =>
          note.note.toLowerCase().includes(keyword)
        )
      );

      if (matchingNotes.length > 0) {
        // Find most common emotion for this pattern
        const emotionCounts: Record<string, number> = {};
        const stageCounts: Record<string, number> = {};
        
        matchingNotes.forEach((note) => {
          emotionCounts[note.emotion] = (emotionCounts[note.emotion] || 0) + 1;
          stageCounts[note.stage] = (stageCounts[note.stage] || 0) + 1;
        });

        const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
        const topStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];

        const stageLabels: Record<EmotionStage, string> = {
          entry: 'Entry',
          inTrade: 'In-Trade',
          exit: 'Exit',
          postExit: 'Post-Exit',
        };

        patterns.push({
          pattern: patternDef.pattern,
          context: `${topEmotion[0]} at ${stageLabels[topStage[0] as EmotionStage]}`,
          count: matchingNotes.length,
          keywords: patternDef.keywords,
        });
      }
    });

    return patterns.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredNotes]);

  // Group notes by emotion and stage
  const emotionThoughtMapping = useMemo(() => {
    const mapping: Record<string, Record<EmotionStage, string[]>> = {};

    filteredNotes.forEach((note) => {
      if (!mapping[note.emotion]) {
        mapping[note.emotion] = {
          entry: [],
          inTrade: [],
          exit: [],
          postExit: [],
        };
      }
      
      // Only add unique notes (first 50 chars to avoid exact duplicates)
      const notePreview = note.note.substring(0, 50);
      const existingNotes = mapping[note.emotion][note.stage];
      
      if (!existingNotes.some(existing => existing.substring(0, 50) === notePreview)) {
        mapping[note.emotion][note.stage].push(note.note);
      }
    });

    // Sort emotions by total note count
    const sortedEmotions = Object.entries(mapping)
      .map(([emotion, stages]) => {
        const totalCount = Object.values(stages).reduce((sum, notes) => sum + notes.length, 0);
        return { emotion, totalCount };
      })
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 6); // Top 6 emotions

    const result: Record<string, Record<EmotionStage, string[]>> = {};
    sortedEmotions.forEach(({ emotion }) => {
      result[emotion] = mapping[emotion];
    });

    return result;
  }, [filteredNotes]);

  // Extract phrases for word cloud
  const phraseCloud = useMemo(() => {
    // Extract meaningful phrases (3-5 words)
    const phrases: Record<string, number> = {};

    filteredNotes.forEach((note) => {
      // Split into sentences
      const sentences = note.note.split(/[.!?]+/).filter(s => s.trim());
      
      sentences.forEach((sentence) => {
        const cleaned = sentence.trim().toLowerCase();
        if (cleaned.length > 10 && cleaned.length < 100) {
          phrases[cleaned] = (phrases[cleaned] || 0) + 1;
        }
      });
    });

    // Get top phrases
    return Object.entries(phrases)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase, count]) => ({
        phrase: phrase.charAt(0).toUpperCase() + phrase.slice(1),
        count,
      }));
  }, [filteredNotes]);

  const stageLabels: Record<EmotionStage | 'all', string> = {
    all: 'All Stages',
    entry: 'Entry',
    inTrade: 'In-Trade',
    exit: 'Exit',
    postExit: 'Post-Exit',
  };

  if (notesData.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            Behavioral Insights from Notes
          </h2>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
            Analyze patterns from your emotion notes
          </p>
        </div>

        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardContent className="p-12 text-center">
            <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-zinc-700' : 'text-neutral-300'}`} />
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
              No emotion notes found
            </p>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Start adding notes to your emotions to see behavioral insights and patterns.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
          Behavioral Insights from Notes
        </h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-neutral-600'} mt-1`}>
          Understand thought patterns behind your emotions and actions
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div>
          <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Stage
          </label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value as EmotionStage | 'all')}
            className={`px-3 py-2 rounded-md text-sm ${
              isDark
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-white text-neutral-900 border-neutral-300'
            } border`}
          >
            <option value="all">All Stages</option>
            <option value="entry">Entry</option>
            <option value="inTrade">In-Trade</option>
            <option value="exit">Exit</option>
            <option value="postExit">Post-Exit</option>
          </select>
        </div>

        <div>
          <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
            Emotion
          </label>
          <select
            value={selectedEmotion}
            onChange={(e) => setSelectedEmotion(e.target.value)}
            className={`px-3 py-2 rounded-md text-sm ${
              isDark
                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-white text-neutral-900 border-neutral-300'
            } border min-w-[150px]`}
          >
            <option value="all">All Emotions</option>
            {allEmotions.map((emotion) => (
              <option key={emotion} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto">
          <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Section 1: Top Behavioral Patterns */}
      {behavioralPatterns.length > 0 && (
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className={`w-5 h-5 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`} />
              <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
                Top Behavioral Patterns
              </CardTitle>
            </div>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Key patterns identified from your emotion notes
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {behavioralPatterns.map((pattern, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isDark ? 'border-zinc-800 bg-zinc-800/30' : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0
                          ? isDark
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-yellow-100 text-yellow-700'
                          : isDark
                            ? 'bg-zinc-700 text-zinc-400'
                            : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold mb-1 ${isDark ? 'text-zinc-200' : 'text-neutral-900'}`}>
                        {pattern.pattern}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-600'}`}>
                        Most common: <span className="font-medium">{pattern.context}</span> •{' '}
                        {pattern.count} occurrence{pattern.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2: Emotion → Thought Mapping */}
      {Object.keys(emotionThoughtMapping).length > 0 && (
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>
              Emotion → Thought Mapping
            </CardTitle>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Common thoughts grouped by emotion and trade stage
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(emotionThoughtMapping).map(([emotion, stages]) => {
                const totalNotes = Object.values(stages).reduce((sum, notes) => sum + notes.length, 0);
                
                if (totalNotes === 0) return null;

                return (
                  <div key={emotion}>
                    <h3
                      className={`font-semibold text-lg mb-3 capitalize ${
                        isDark ? 'text-zinc-200' : 'text-neutral-900'
                      }`}
                    >
                      {emotion}{' '}
                      <span className={`text-sm font-normal ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
                        ({totalNotes} note{totalNotes !== 1 ? 's' : ''})
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(Object.entries(stages) as [EmotionStage, string[]][]).map(([stage, notes]) => {
                        if (notes.length === 0) return null;

                        return (
                          <div
                            key={stage}
                            className={`p-3 rounded-lg border ${
                              isDark ? 'border-zinc-800 bg-zinc-800/50' : 'border-neutral-200 bg-white'
                            }`}
                          >
                            <h4
                              className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
                                isDark ? 'text-zinc-400' : 'text-neutral-600'
                              }`}
                            >
                              {stageLabels[stage]}
                            </h4>
                            <ul className="space-y-1.5">
                              {notes.slice(0, 3).map((note, idx) => (
                                <li
                                  key={idx}
                                  className={`text-xs italic ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                                >
                                  "{note.length > 50 ? note.substring(0, 50) + '...' : note}"
                                </li>
                              ))}
                              {notes.length > 3 && (
                                <li className={`text-xs ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}>
                                  +{notes.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Phrase Cloud */}
      {phraseCloud.length > 0 && (
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader>
            <CardTitle className={isDark ? 'text-zinc-100' : 'text-neutral-900'}>Common Phrases</CardTitle>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Frequently occurring thoughts across your notes
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {phraseCloud.map((item, index) => {
                const maxCount = phraseCloud[0].count;
                const minCount = phraseCloud[phraseCloud.length - 1].count;
                const range = maxCount - minCount;
                
                // Calculate size based on frequency (12px to 20px)
                const fontSize = range > 0
                  ? 12 + ((item.count - minCount) / range) * 8
                  : 16;

                // Calculate opacity based on frequency (0.5 to 1)
                const opacity = range > 0
                  ? 0.5 + ((item.count - minCount) / range) * 0.5
                  : 0.8;

                return (
                  <div
                    key={index}
                    className={`px-3 py-2 rounded-md ${
                      isDark ? 'bg-zinc-800/50' : 'bg-neutral-100'
                    }`}
                    style={{ opacity }}
                    title={`${item.count} occurrence${item.count !== 1 ? 's' : ''}`}
                  >
                    <span
                      className={`italic ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      "{item.phrase}"
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for filtered results */}
      {filteredNotes.length === 0 && (
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardContent className="p-12 text-center">
            <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-zinc-300' : 'text-neutral-700'}`}>
              No notes found for this filter
            </p>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Try selecting a different stage or emotion to see more insights.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}