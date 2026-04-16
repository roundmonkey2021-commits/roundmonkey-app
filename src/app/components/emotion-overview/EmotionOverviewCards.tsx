import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface EmotionData {
  emotion: string;
  count: number;
  avgPnL: number;
  avgPoints: number;
}

interface StageData {
  stage: string;
  emotion: EmotionData | null;
}

interface EmotionOverviewCardsProps {
  mostFrequentByStage: StageData[];
  bestStageBreakdown: StageData[];
  worstStageBreakdown: StageData[];
  isDark: boolean;
  formatIndianCurrency: (num: number) => string;
}

export function EmotionOverviewCards({
  mostFrequentByStage,
  bestStageBreakdown,
  worstStageBreakdown,
  isDark,
  formatIndianCurrency
}: EmotionOverviewCardsProps) {
  return (
    <div>
      <h2 className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'} mb-4`}>
        Emotion Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Most Frequent Emotion */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Most Frequent Emotion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Subtle header */}
            <div className="flex items-center justify-between pb-1.5 mb-1">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-16 flex-shrink-0"></span>
                <span className="flex-1"></span>
              </div>
              <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-neutral-400'} ml-2 flex-shrink-0 text-right min-w-[50px] tabular-nums`}>
                Trades
              </span>
            </div>
            
            <div className="space-y-2">
              {mostFrequentByStage.map((stage, idx) => (
                <div 
                  key={`freq-stage-${idx}`}
                  className={`flex items-center justify-between py-1.5 ${
                    idx !== mostFrequentByStage.length - 1 
                      ? `border-b ${isDark ? 'border-zinc-800' : 'border-neutral-100'}` 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-neutral-500'} w-16 flex-shrink-0`}>
                      {stage.stage}
                    </span>
                    {stage.emotion ? (
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'} truncate`}>
                        {stage.emotion.emotion}
                      </span>
                    ) : (
                      <span className={`text-sm ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}>
                        No data
                      </span>
                    )}
                  </div>
                  {stage.emotion && (
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'} ml-2 flex-shrink-0 text-right min-w-[50px] tabular-nums`}>
                      {stage.emotion.count} trades
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Best Performing Emotion */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Best Performing Emotion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Subtle header */}
            <div className="flex items-center justify-between pb-1.5 mb-1">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-16 flex-shrink-0"></span>
                <span className="flex-1"></span>
              </div>
              <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-neutral-400'} text-right min-w-[60px] tabular-nums`}>
                  Avg PnL
                </span>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-neutral-400'} text-right min-w-[40px] tabular-nums`}>
                  Avg Pts
                </span>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-neutral-400'} text-right min-w-[20px] tabular-nums`}>
                  Trd
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {bestStageBreakdown.map((stage, idx) => (
                <div 
                  key={`best-stage-${idx}`}
                  className={`flex items-center justify-between py-1.5 ${
                    idx !== bestStageBreakdown.length - 1 
                      ? `border-b ${isDark ? 'border-zinc-800' : 'border-neutral-100'}` 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-neutral-500'} w-16 flex-shrink-0`}>
                      {stage.stage}
                    </span>
                    {stage.emotion ? (
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'} truncate`}>
                        {stage.emotion.emotion}
                      </span>
                    ) : (
                      <span className={`text-sm ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}>
                        No data
                      </span>
                    )}
                  </div>
                  {stage.emotion && (
                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'} text-right min-w-[60px] tabular-nums`}>
                        {formatIndianCurrency(stage.emotion.avgPnL)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'} text-right min-w-[40px] tabular-nums`}>
                        {stage.emotion.avgPoints >= 0 ? '+' : ''}{stage.emotion.avgPoints.toFixed(1)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'} text-right min-w-[20px] tabular-nums`}>
                        {stage.emotion.count}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Worst Performing Emotion */}
        <Card className={isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}>
              Worst Performing Emotion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Subtle header */}
            <div className="flex items-center justify-between pb-1.5 mb-1">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-16 flex-shrink-0"></span>
                <span className="flex-1"></span>
              </div>
              <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-neutral-400'} text-right min-w-[60px] tabular-nums`}>
                  Avg PnL
                </span>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-neutral-400'} text-right min-w-[40px] tabular-nums`}>
                  Avg Pts
                </span>
                <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-600' : 'text-neutral-400'} text-right min-w-[20px] tabular-nums`}>
                  Trd
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              {worstStageBreakdown.map((stage, idx) => (
                <div 
                  key={`worst-stage-${idx}`}
                  className={`flex items-center justify-between py-1.5 ${
                    idx !== worstStageBreakdown.length - 1 
                      ? `border-b ${isDark ? 'border-zinc-800' : 'border-neutral-100'}` 
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-zinc-500' : 'text-neutral-500'} w-16 flex-shrink-0`}>
                      {stage.stage}
                    </span>
                    {stage.emotion ? (
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-neutral-900'} truncate`}>
                        {stage.emotion.emotion}
                      </span>
                    ) : (
                      <span className={`text-sm ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`}>
                        No data
                      </span>
                    )}
                  </div>
                  {stage.emotion && (
                    <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'} text-right min-w-[60px] tabular-nums`}>
                        {formatIndianCurrency(stage.emotion.avgPnL)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'} text-right min-w-[40px] tabular-nums`}>
                        {stage.emotion.avgPoints >= 0 ? '+' : ''}{stage.emotion.avgPoints.toFixed(1)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-neutral-600'} text-right min-w-[20px] tabular-nums`}>
                        {stage.emotion.count}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}