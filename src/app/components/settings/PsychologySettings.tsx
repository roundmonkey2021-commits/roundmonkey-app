/**
 * Psychology Settings Component
 *
 * Manages comprehensive emotional playbook data across 4 trading phases:
 * - Entry Emotions
 * - In-Trade Emotions
 * - Exit Emotions
 * - Post-Exit Emotions
 *
 * Features:
 * - CSV Import: Bulk import emotional playbook data
 * - Manual Editing: Add/edit/delete rows and columns
 * - Trade Journal Integration: Emotion "Type" fields populate dropdown options
 * - Data Persistence: Stored in localStorage (no backend required)
 *
 * CSV Format:
 * Required columns: #, Type, Core Emotion, Underlying Emotions, Internal Dialogue,
 * Typical Signs, Appears When, Diagnostic Test, Corrective Actions, Permission
 * Optional: Category (red/amber/green)
 *
 * See PSYCHOLOGY_CSV_GUIDE.md for detailed import instructions.
 */

import { useState, useEffect, useRef } from "react";
import {
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Upload,
  Info,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import {
  useSettings,
  PsychologyTag,
} from "../../hooks/useSettings";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

// Types
interface PsychologyEntry {
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
  category?: "red" | "amber" | "green" | "";
  [key: string]: string; // For dynamic columns
}

interface CustomColumn {
  id: string;
  name: string;
}

interface PhaseData {
  entries: PsychologyEntry[];
  customColumns: CustomColumn[];
}

type Phase = "entry" | "inTrade" | "exit" | "postExit";

interface PsychologySettingsProps {
  isDark: boolean;
}

// Default columns that are always present
const DEFAULT_COLUMNS = [
  { key: "type", label: "Emotion", width: "100px" },
  { key: "coreEmotion", label: "Core Emotion", width: "120px" },
  {
    key: "underlyingEmotions",
    label: "Underlying Emotions",
    width: "150px",
  },
  {
    key: "internalDialogue",
    label: "Internal Dialogue",
    width: "200px",
  },
  {
    key: "typicalSigns",
    label: "Typical Signs",
    width: "180px",
  },
  { key: "appearsWhen", label: "Appears When", width: "180px" },
  {
    key: "diagnosticTest",
    label: "Diagnostic Test",
    width: "180px",
  },
  {
    key: "correctiveActions",
    label: "Corrective Actions",
    width: "200px",
  },
  { key: "permission", label: "Permission", width: "150px" },
  { key: "category", label: "Category", width: "120px" },
];

// Hardcoded default data for Entry Phase
const DEFAULT_ENTRY_DATA: PsychologyEntry[] = [
  {
    id: "E001",
    type: "Impulsive",
    coreEmotion:
      "▪ Urgency-driven action to relieve internal discomfort.",
    underlyingEmotions:
      "▪ Urgency\n▪ Restlessness\n▪ Impatience\n▪ Subtle anxiety\n▪ Excitement-seeking\n▪ Pressure to act\n▪ Performance pressure",
    internalDialogue:
      '▪ "It\'s moving Now... I\'ll miss it."\n▪ "Now or Never"\n▪ "Just a quick one."\n▪ "I\'ll manage it manually."\n▪ "Just enter."\n▪ "This looks okay."\n▪ "Let me just try."',
    typicalSigns:
      "▪ No SL planned\n▪ SL unclear or decided after entry\n▪ Entry mid-candle\n▪ Tight chest\n▪ Leaning into screen\n▪ Fast clicking\n▪ Shallow breathing",
    appearsWhen:
      "▪ Market is slow/Choppy\n▪ You've waited too long\n▪ You're mentally tired/ Mental Fatigue\n▪ Missed move",
    diagnosticTest:
      '▪ "Do I feel urgency or pressure to act right now?"\n▪ "Do I feel rushed or pressured"\n▪ Can\'t clearly explain the trade in one sentence',
    correctiveActions:
      "▪ Delay entry by 3 deep breaths\n▪ If urgency remains → no trade\n▪ Only enter after candle close or pullback",
    permission: "❌ Not allowed",
    category: "red",
  },
  {
    id: "E002",
    type: "FOMO",
    coreEmotion: "▪ Fear of being left out of opportunity.",
    underlyingEmotions:
      "▪ Fear of missing out\n▪ Comparison\n▪ Envy\n▪ Scarcity mindset\n▪ Insecurity",
    internalDialogue:
      '▪ "Everyone\'s making money except me."\n▪ "I missed the best part."\n▪ "Everyone else caught this."\n▪ "There\'s still room."\n▪ "I missed it. But others caught this."\n▪ "Still room."\n▪ "I can\'t miss another one."',
    typicalSigns:
      "▪ Late entry\n▪ Oversized position to compensate\n▪ Poor R:R acceptance\n▪ Chasing extended candles",
    appearsWhen:
      "▪ After missing a clean move\n▪ After seeing others' wins\n▪ During strong momentum",
    diagnosticTest:
      '👉 "Would I take this trade if price hadn\'t already moved?"\n▪ Attention fixed on how much price already moved\n▪ Mentally replaying missed trades',
    correctiveActions:
      "⛔ No chasing\n✅ Only pullback entries allowed\n▪ Missed trades = cost of discipline",
    permission: "❌ Not allowed",
    category: "red",
  },
  {
    id: "E003",
    type: "Revenge",
    coreEmotion: "▪ Anger-driven attempt to recover losses.",
    underlyingEmotions:
      '▪ Anger\n▪ Frustration\n▪ Loss aversion\n▪ Injustice ("market owes me")',
    internalDialogue:
      '▪ "I need to take it back."\n▪ "I\'ll get it back."\n▪ "That shouldn\'t have happened."\n▪ "Next one will fix it."\n▪ "I\'m not stopping now."\n▪ "Next one fixes it."\n▪ "One good trade fixes this."\n▪ "I\'m not stopping now."',
    typicalSigns:
      "▪ Immediate re-entry after SL\n▪ Increased size\n▪ Ignoring rules\n▪ Ignoring setup quality\n▪ Tunnel vision",
    appearsWhen:
      "▪ After a loss\n▪ After SL just before move\n▪ When P&L flips red\n▪ Streak of losses",
    diagnosticTest:
      '👉 "Am I trying to recover a loss?"\n▪ Emotional charge still present\n▪ Thoughts about recovering rather than executing',
    correctiveActions:
      "⛔ Stop trading for the session\n⛔ Journal before next trade\n▪ Resume only after emotional reset",
    permission: "❌ Not allowed",
    category: "red",
  },
  {
    id: "E004",
    type: "Ego",
    coreEmotion: "▪ Overconfidence and need to be right.",
    underlyingEmotions:
      '▪ Overconfidence\n▪ Need to prove\n▪ Pride\n▪ Need to be right\n▪ Entitlement\n▪ Identity attachment ("I\'m good at this")',
    internalDialogue:
      '▪ "I know better than the market."\n▪ "This is obvious."\n▪ "I don\'t need confirmation."\n▪ "I\'ve seen this many times."\n▪ "Trust me."',
    typicalSigns:
      "▪ No confirmation needed\n▪ Large size\n▪ Ignoring opposing signals\n▪ No contingency plan\n▪ No invalidation\n▪ Dismissive mindset",
    appearsWhen:
      '▪ After a win streak\n▪ After public validation\n▪ When feeling "in control"\n▪ After big wins\n▪ Feeling superior to market',
    diagnosticTest:
      '👉 "Am I assuming this must work?"\n▪ No consideration of failure scenario',
    correctiveActions:
      "⚠️ Cut size by 50%\n⚠️ Must define invalidation clearly before entry\n▪ No discretionary adds (random loading)",
    permission: "⚠️ Limited",
    category: "amber",
  },
  {
    id: "E005",
    type: "Hope-Driven",
    coreEmotion: "▪ Avoidance of accepting loss.",
    underlyingEmotions:
      "▪ Hope\n▪ Denial\n▪ Attachment\n▪ Fear of being wrong\n▪ Emotional sunk cost",
    internalDialogue:
      '▪ "It\'ll come back."\n▪ "It should come back."\n▪ "It should bounce."\n▪ "Just give it time."\n▪ "The level is still valid."\n▪ "One more candle."\n▪ "I\'ll exit later."',
    typicalSigns:
      "▪ Late SL\n▪ SL moved\n▪ Target removed\n▪ Averaging losers\n▪ Watching P&L instead of price / P&L Fixation\n▪ Ignoring invalidation",
    appearsWhen:
      "▪ Trade drifts against you\n▪ You're emotionally invested\n▪ You want to avoid taking a loss",
    diagnosticTest:
      '👉 "Would I still enter this trade now?"\n▪ Bargaining thoughts\n▪ Resistance to closing trade',
    correctiveActions:
      "⛔ Exit immediately\n⛔ No re-entry without fresh setup\n▪ Exit at next decision point\n▪ No averaging",
    permission: "❌ Not allowed",
    category: "red",
  },
  {
    id: "E006",
    type: "Fear-Based",
    coreEmotion: "▪ Loss avoidance dominating execution.",
    underlyingEmotions:
      "▪ Fear of loss\n▪ Self-doubt\n▪ Insecurity\n▪ Risk aversion",
    internalDialogue:
      '▪ "Let me just get in and out quickly."\n▪ "Let me be careful."\n▪ "I\'ll take small profits."\n▪ "What if this fails?"',
    typicalSigns:
      "▪ Too early entry\n▪ Hesitant Entries\n▪ Tiny targets\n▪ Premature exits\n▪ Hesitant execution\n▪ Cutting winners short",
    appearsWhen:
      "▪ After losses when confidence is low\n▪ During drawdowns",
    diagnosticTest:
      '👉 "Am I protecting myself more than executing?"\n▪ Focused more on not losing than execution',
    correctiveActions:
      "⚠️ Max risk 0.25R\n⚠️ One attempt only\n▪ Pre-commit to full target",
    permission: "⚠️ Limited",
    category: "amber",
  },
  {
    id: "E007",
    type: "Anxiety",
    coreEmotion: "Mental overload and lack of trust.",
    underlyingEmotions:
      "▪ Nervousness\n▪ Self-doubt\n▪ Mental overload\n▪ Uncertainty\n▪ Loss of trust in self\n▪ Overthinking\n▪ Cognitive fatigue",
    internalDialogue:
      '▪ "What if this fails?"\n▪ "Something feels off."\n▪ "Let me adjust this."\n▪ "I should watch closely."',
    typicalSigns:
      "▪ Multiple entries/exits\n▪ Over-management/monitoring of trade\n▪ Micromanaging SL\n▪ Constant SL adjustments\n▪ Timeframe switching",
    appearsWhen:
      "▪ Too many signals\n▪ Overtrading days\n▪ Information overload\n▪ Conflicting signals",
    diagnosticTest:
      '👉 "Do I feel the need to constantly watch or adjust?"\n▪ Need to constantly control the trade',
    correctiveActions:
      "⛔ Reduce chart time\n⛔ Trade only A+ setups or stop\n▪ Hard SL, no adjustments",
    permission: "⚠️ Limited",
    category: "amber",
  },
  {
    id: "E008",
    type: "Boredom",
    coreEmotion: "Trading for stimulation",
    underlyingEmotions:
      "▪ Restlessness\n▪ Need for stimulation\n▪ Dopamine craving\n▪ Low engagement",
    internalDialogue:
      '▪ "Nothing\'s happening... let\'s try."\n▪ "Maybe this will move."',
    typicalSigns:
      "▪ Low-quality setups\n▪ Chop trading\n▪ Many small losses\n▪ Low-quality trades\n▪ Many scratches\n▪ No clear thesis",
    appearsWhen:
      "▪ Sideways markets\n▪ Long screen time\n▪ Low volume sessions",
    diagnosticTest:
      '👉 "Am I trading to be entertained?"\n▪ Trading without narrative\n▪ Clicking to stay engaged',
    correctiveActions:
      "⛔ Step away from screen for 5-15 mins\n✅ Market scan only\n▪ Journaling only\n▪ No trades in chop",
    permission: "❌ Not allowed",
    category: "red",
  },
  {
    id: "E009",
    type: "Greed",
    coreEmotion: "Desire to extract more than planned.",
    underlyingEmotions:
      "▪ Desire for more\n▪ Over-extension\n▪ Over-optimism\n▪ Entitlement\n▪ Overconfidence",
    internalDialogue:
      '▪ "This can go much more."\n▪ "Why take profits now?"\n▪ "I should size bigger."\n▪ "This can go much more."\n▪ "Why exit now?"',
    typicalSigns:
      "▪ Over-sizing\n▪ Ignoring exit rules\n▪ Giving back profits\n▪ Holding winners too long",
    appearsWhen:
      "▪ After big wins\n▪ Strong trends\n▪ Confidence is high\n▪ Feeling invincible",
    diagnosticTest:
      '👉 "Am I breaking my exit rules?"\n▪ Upside-focused thinking only',
    correctiveActions:
      "⚠️ Lock partials\n⚠️ Hard trailing stop only\n▪ No size increases",
    permission: "⚠️ Limited",
    category: "amber",
  },
  {
    id: "E010",
    type: "Validation-Seeking",
    coreEmotion: "Need for external approval.",
    underlyingEmotions:
      "▪ Need for approval\n▪ Insecurity\n▪ Social comparison\n▪ Self-doubt",
    internalDialogue:
      '▪ "If this works, I\'ll feel confident."\n▪ "They\'re trading this too."\n▪ "This should be right."',
    typicalSigns:
      "▪ Trading someone else's idea/Copying others\n▪ No personal conviction/ Weak conviction\n▪ Hesitation after entry",
    appearsWhen:
      "▪ After self-doubt\n▪ Watching others trade\n▪ Lack of personal clarity\n▪ Low confidence\n▪ External influence",
    diagnosticTest:
      '👉 "Is this my idea or someone else\'s?"\n▪ Trade idea not originally yours',
    correctiveActions:
      "⛔ No trade unless independently planned /\nIf not yours → no trade",
    permission: "❌ Not allowed",
    category: "red",
  },
  {
    id: "E011",
    type: "Calm & Planned",
    coreEmotion: "Neutral, rule-based execution.",
    underlyingEmotions:
      "▪ Neutral\n▪ Focused\n▪ Acceptance\n▪ Emotional balance",
    internalDialogue:
      '▪ "If X happens, I act."\n▪ "If X, then Y."\n▪ "Risk is defined."\n▪ "Outcome doesn\'t matter."',
    typicalSigns:
      "▪ Predefined SL & TP\n▪ Comfortable waiting\n▪ Accepts loss easily\n▪ No urgency\n▪ Relaxed clean execution",
    appearsWhen:
      "▪ You've prepared well\n▪ You're rested\n▪ You're present\n▪ Process-driven",
    diagnosticTest:
      '👉 "Is this part of my plan?"\n▪ No urgency or fear\n▪ Clear reasoning',
    correctiveActions:
      "✅ Trade normally\n▪ Execute full plan",
    permission: "✅ Allowed",
    category: "green",
  },
  {
    id: "E012",
    type: "Detached / Process-Driven",
    coreEmotion: "Outcome independence.",
    underlyingEmotions:
      "▪ Detachment\n▪ Acceptance\n▪ Trust\n▪ Emotional balance\n▪ Neutrality",
    internalDialogue:
      '▪ "One of many trades."\n▪ "I\'ll execute the process."\n▪ "Loss is acceptable."',
    typicalSigns:
      "▪ Same execution every time\n▪ No emotional spike\n▪ Size feels irrelevant\n▪ Minimal chart watching",
    appearsWhen:
      "▪ You're outcome-independent\n▪ Size is appropriate\n▪ Process is internalized\n▪ Strong process trust",
    diagnosticTest:
      '👉 "Would I take this even after 3 losses?"\n▪ Loss feels acceptable',
    correctiveActions:
      "✅ Trade confidently.\n▪ Maintain consistency",
    permission: "✅ Allowed",
    category: "green",
  },
  {
    id: "E013",
    type: "Confidence-Aligned",
    coreEmotion: "Flow and personal alignment.",
    underlyingEmotions:
      "▪ Quiet confidence\n▪ Flow state\n▪ Clarity\n▪ Self-trust",
    internalDialogue:
      '▪ "This fits me."\n▪ "This is my trade."\n▪ "I know how to manage this."',
    typicalSigns:
      "▪ No rush\n▪ No hesitation\n▪ Clear exits\n▪ Smooth execution",
    appearsWhen:
      "▪ You're in rhythm\n▪ You respect your rules\n▪ Market conditions suit you and your edge",
    diagnosticTest:
      '👉 "Does this feel calm and obvious, not exciting?"\n▪ Calm certainty (not excitement)',
    correctiveActions: "✅ A+ size allowed",
    permission: "✅ Preferred",
    category: "green",
  },
];

// Default data for In-Trade Phase
const DEFAULT_INTRADE_DATA: PsychologyEntry[] = [
  {
    id: "IT001",
    type: "Panic",
    coreEmotion:
      "A sudden fear response that overrides rational thinking and shifts focus from execution to self-protection.",
    underlyingEmotions:
      "▪ Fear of loss\n▪ Uncertainty\n▪ Lack of trust in the setup\n▪ Memory of past losses\n▪ Shock",
    internalDialogue:
      '▪ "This is going wrong."\n▪ "What if this collapses fast?"\n▪ "I should exit now before it gets worse."',
    typicalSigns:
      "▪ Immediate urge to close trade on first adverse candle\n▪ Rapid mouse or hotkey movement\n▪ Shallow breathing, tight chest\n▪ Ignoring original SL logic",
    appearsWhen:
      "▪ Sudden adverse candle near entry\n▪ Volatility spikes unexpectedly\n▪ Entry slightly early or size feels large",
    diagnosticTest:
      '▪ "Has my predefined invalidation actually been hit, or am I reacting to discomfort?"\n▪ Has price actually hit my predefined invalidation?',
    correctiveActions:
      "▪ Freeze action for 10 seconds\n▪ Take one slow breath\n▪ Re-check original SL and thesis\n▪ Exit only if invalidation is hit",
    permission: "❌ Panic is not allowed to manage exits.",
    category: "red",
  },
  {
    id: "IT002",
    type: 'Freeze / Paralysis',
    coreEmotion: 'Fear that prevents action even though the correct decision is known.',
    underlyingEmotions: '▪ Fear of being wrong\n▪ Denial\n▪ Overwhelm\n▪ Avoidance',
    internalDialogue: '▪ "Maybe it will bounce."\n▪ "Let me wait one more candle."\n▪ "It\'s not fully broken yet."',
    typicalSigns: '▪ SL not executed\n▪ Staring at screen without clicking\n▪ Ignoring alerts or rules',
    appearsWhen: '▪ Trade bleeds slowly against you\n▪ Invalidation happens gradually, not violently',
    diagnosticTest: '▪ "Do I know what to do but feel unable to do it?"',
    correctiveActions: '▪ Use hard SL only\n▪ Remove discretion on losing trades\n▪ Accept the loss mechanically',
    permission: '❌ Freeze is not allowed.',
    category: "red",
  },
  {
    id: "IT003",
    type: 'Hope (Holding Loser)',
    coreEmotion: 'Emotional attachment to outcome and refusal to accept loss.',
    underlyingEmotions: '▪ Denial\n▪ Sunk-cost fallacy\n▪ Loss aversion\n▪ Ego protection',
    internalDialogue: '▪ "It should come back."\n▪ "The level still holds."\n▪ "Just one more candle."',
    typicalSigns: '▪ Moving SL further away\n▪ Averaging down\n▪ Watching P&L instead of price structure',
    appearsWhen: '▪ Trade drifts against you without sharp rejection\n▪ You\'re emotionally invested in being right',
    diagnosticTest: '▪ "Would I open this trade again right now at this price?"',
    correctiveActions: '▪ Exit at next structural break\n▪ No SL movement allowed\n▪ No averaging under any condition',
    permission: '❌ Hope is never allowed.',
    category: "red",
  },
  {
    id: "IT004",
   type: 'Fear of Giving Back Profits',
    coreEmotion: 'Anxiety about unrealized gains turning into losses.',
    underlyingEmotions: '▪ Loss aversion\n▪ Insecurity\n▪ Scarcity mindset\n▪ Recent losing memory',
    internalDialogue: '▪ "Don\'t let this go red."\n▪ "I should book now."\n▪ "At least take something."',
    typicalSigns: '▪ Early partials without plan\n▪ Tightening SL too fast\n▪ Exiting at first pullback',
    appearsWhen: '▪ First pullback after entry\n▪ Small green P&L\n▪ After recent losses',
    diagnosticTest: '▪ "Am I managing price structure or protecting my P&L?"',
    correctiveActions: '▪ Trail stops by structure, not P&L\n▪ No full exit before target or invalidation',
    permission: '⚠️ Limited — structure rules only.',
    category: "amber",
  },
  {
    id: "IT005",
    type: 'Greed (During Trade)',
    coreEmotion: 'Desire to extract more than originally planned.',
    underlyingEmotions: '▪ Overconfidence\n▪ Entitlement\n▪ Optimism bias',
    internalDialogue: '▪ "This can go much more."\n▪ "Why take profits now?"\n▪ "This is a big one."',
    typicalSigns: '▪ Removing targets\n▪ Ignoring exit signals\n▪ Refusing to trail stops',
    appearsWhen: '▪ Strong trend continuation\n▪ Large unrealized profit\n▪ After recent wins',
    diagnosticTest: '▪ "Am I violating my original exit or risk plan?"',
    correctiveActions: '▪ Lock partial profits\n▪ Enforce predefined trailing stop',
    permission: '⚠️ Limited — rules only.',
    category: "amber",
  },
    {
    id: "IT006",
    type: 'Impatience',
    coreEmotion: 'Discomfort with time and lack of immediate movement.',
    underlyingEmotions: '▪ Restlessness\n▪ Boredom\n▪ Doubt\n▪ Need for stimulation',
    internalDialogue: '▪ "Why isn\'t this moving?"\n▪ "This is wasting time."\n▪ "I could be in another trade."',
    typicalSigns: '▪ Premature exit\n▪ Unnecessary SL adjustments\n▪ Constant chart switching',
    appearsWhen: '▪ Range-bound price\n▪ Slow follow-through after entry',
    diagnosticTest: '▪ "Is time bothering me more than price structure?"',
    correctiveActions: '▪ Respect predefined time stop\n▪ If time stop not hit → stay in trade',
    permission: '⚠️ Limited.',
    category: "amber",
  },
      {
    id: "IT007",
    type: 'Over-Management',
    coreEmotion: 'Compulsive need to control outcome.',
    underlyingEmotions: '▪ Anxiety\n▪ Insecurity\n▪ Lack of trust in system',
    internalDialogue: '▪ "Let me just tweak this."\n▪ "I should adjust SL slightly."\n▪ "Maybe change the target."',
    typicalSigns: '▪ Multiple SL/TP changes\n▪ Timeframe hopping\n▪ Excessive screen interaction',
    appearsWhen: '▪ Low confidence days\n▪ Unclear market context\n▪ Information overload',
    diagnosticTest: '▪ "Have I already adjusted more than my rules allow?"',
    correctiveActions: '▪ Hard SL\n▪ Walk-away rule after entry\n▪ No new decisions mid-trade',
    permission: '⚠️ Limited — rules only.',
    category: "amber",
  },
        {
    id: "IT008",
    type: 'Euphoria',
    coreEmotion: 'Emotional high from being right.',
    underlyingEmotions: '▪ Pride\n▪ Excitement\n▪ Overconfidence\n▪ Identity reinforcement',
    internalDialogue: '▪ "I nailed this."\n▪ "Everything is working today."\n▪ "I should press harder."',
    typicalSigns: '▪ Thinking about next trade too early\n▪ Desire to increase size\n▪ Reduced risk awareness',
    appearsWhen: '▪ Big winners\n▪ Strong trend days\n▪ Consecutive wins',
    diagnosticTest: '▪ "Am I mentally in the next trade before this one is done?"',
    correctiveActions: '▪ Mandatory cooldown\n▪ Reset to base size\n▪ No scaling',
    permission: '⚠️ Limited.',
    category: "amber",
  },
          {
    id: "IT009",
    type: 'Calm Acceptance',
    coreEmotion: 'Neutral observation with full acceptance of outcomes.',
    underlyingEmotions: '▪ Acceptance\n▪ Confidence\n▪ Emotional balance',
    internalDialogue: '▪ "Let the trade play out."\n▪ "Outcome doesn\'t matter."\n▪ "Process over result."',
    typicalSigns: '▪ Minimal interference\n▪ Steady breathing\n▪ Clean rule-based actions',
    appearsWhen: '▪ Proper sizing\n▪ Clear plan\n▪ Good preparation',
    diagnosticTest: '▪ "Do I feel no urge to interfere or control?"',
    correctiveActions: '▪ Maintain execution\n▪ Avoid mid-trade optimization',
    permission: '✅ Allowed.',
    category: "green",
  },
            {
    id: "IT010",
    type: 'Flow / Detachment',
    coreEmotion: 'Complete alignment with process and environment.',
    underlyingEmotions: '▪ Trust\n▪ Clarity\n▪ Deep focus\n▪ Self-belief',
    internalDialogue: '▪ "This is fine either way."\n▪ "Just execute."',
    typicalSigns: '▪ Automatic execution\n▪ Reduced screen watching\n▪ Time distortion',
    appearsWhen: '▪ Market suits your edge\n▪ System is fully trusted',
    diagnosticTest: '▪ "Does time feel irrelevant and execution effortless?"',
    correctiveActions: '▪ Preserve state\n▪ No size or rule changes',
    permission: '✅ Preferred.',
    category: "green",
  },
];

// Default data for Exit Phase
const DEFAULT_EXIT_DATA: PsychologyEntry[] = [
    {
    id: "EX001",
    type: 'Panic',
    coreEmotion: 'Sudden fear forces an immediate exit to escape emotional discomfort.',
    underlyingEmotions: '▪ Fear of loss\n▪ Uncertainty\n▪ Shock\n▪ Lack of trust in setup',
    internalDialogue: '▪ "Get out now."\n▪ "This is going to reverse hard."\n▪ "I can’t watch this."',
    typicalSigns: '▪ Closing trade without exit signal\n▪ Exiting on first counter candle\n▪ Ignoring planned targets or trailing logic',
    appearsWhen: '▪ Sudden adverse candle near exit area\n▪ Volatility spikes\n▪ Large position size',
    diagnosticTest: '▪ "Did I exit because of structure, or because I felt scared?"',
    correctiveActions: '▪ Pause for 5–10 seconds before clicking exit\n▪ Check if invalidation is actually hit\n▪ Exit only at predefined exit condition',
    permission: '❌ Panic exits are not allowed',
    category: "red",
  },
  {
    id: "EX002",
    type: 'Relief',
    coreEmotion: 'Exit taken to relieve emotional tension, not because of plan.',
    underlyingEmotions: '▪ Anxiety\n▪ Fear of reversal\n▪ Emotional fatigue',
    internalDialogue: '▪ "Thank god, I’m out."\n▪ "At least I didn’t lose."\n▪ "Let me just close it."',
    typicalSigns: '▪ Exiting as soon as trade turns green\n▪ Closing at random levels\n▪ Sigh or physical release after exit',
    appearsWhen: '▪ Trade was emotionally stressful\n▪ Recent losses or drawdown\n▪ Low confidence days',
    diagnosticTest: '▪ "Am I exiting to feel better or because the plan says so?"',
    correctiveActions: '▪ Define exits before entry\n▪ No discretionary exit while green\n▪ Let rules exit the trade, not emotions',
    permission: '❌ Relief exits are not allowed',
    category: "red",
  },
  {
    id: "EX003",
    type: 'Regret-Driven',
    coreEmotion: 'Exit driven by anticipation of future regret.',
    underlyingEmotions: '▪ Fear of being wrong\n▪ Loss aversion\n▪ Hindsight bias',
    internalDialogue: '▪ "I should just take it now."\n▪ "What if it reverses after this?"\n▪ "I’ll hate myself if I don’t book."',
    typicalSigns: '▪ Closing before target\n▪ Closing just before continuation\n▪ Immediate regret after exit',
    appearsWhen: '▪ Trade is near target but not there yet\n▪ Price hesitates\n▪ Trader is outcome-focused',
    diagnosticTest: '▪ "Am I exiting to avoid future regret?"',
    correctiveActions: '▪ Pre-commit to exits\n▪ Accept that regret is unavoidable sometimes\n▪ Judge exit quality, not outcome',
    permission: '❌ Not allowed',
    category: "red",
  },
  {
    id: "EX004",
    type: 'Greedy Hold (Refusing to Exit)',
    coreEmotion: 'Desire to extract more than planned.',
    underlyingEmotions: '▪ Greed\n▪ Overconfidence\n▪ Entitlement',
    internalDialogue: '▪ "It can go more."\n▪ "Why exit now?"\n▪ "This is a big move."',
    typicalSigns: '▪ Ignoring exit signals\n▪ Removing targets\n▪ Letting winner turn into loser',
    appearsWhen: '▪ Strong trends\n▪ Large unrealized profits\n▪ After recent wins',
    diagnosticTest: '▪ "Am I breaking my exit rules to make more?"',
    correctiveActions: '▪ Use hard targets or trailing stops\n▪ Lock partial profits\n▪ Respect exit plan',
    permission: '⚠️ Limited (rules only)',
    category: "amber",
  },
  {
    id: "EX005",
    type: 'Hesitant',
    coreEmotion: 'Uncertainty about whether to exit.',
    underlyingEmotions: '▪ Doubt\n▪ Fear of missing more\n▪ Lack of conviction',
    internalDialogue: '▪ "Should I exit or wait?"\n▪ "Maybe one more candle."',
    typicalSigns: '▪ Delayed exit\n▪ Missing exit level\n▪ Exiting worse than planned price',
    appearsWhen: '▪ Exit rules are vague\n▪ Market is choppy',
    diagnosticTest: '▪ "Is my exit rule unclear right now?"',
    correctiveActions: '▪ Define exits mechanically\n▪ Reduce discretion at exit\n▪ Use alerts or automated exits',
    permission: '⚠️ Limited',
    category: "amber",
  },
  {
    id: "EX006",
    type: 'Forced / Rule-Based',
    coreEmotion: 'Neutral or slightly uncomfortable acceptance.',
    underlyingEmotions: '▪ Discipline\n▪ Acceptance\n▪ Mild discomfort',
    internalDialogue: '▪ "Rules say exit."\n▪ "This is part of the system."',
    typicalSigns: '▪ Clean execution at planned level\n▪ No emotional spike',
    appearsWhen: '▪ SL, target, or trail is hit\n▪ System is trusted',
    diagnosticTest: '▪ "Did I exit exactly where I planned?"',
    correctiveActions: '▪ None — this is ideal execution\n▪ Log and move on',
    permission: '✅ Allowed',
    category: "green",
  },
  {
    id: "EX007",
    type: 'Disciplined',
    coreEmotion: 'Calm acceptance of outcome.',
    underlyingEmotions: '▪ Trust\n▪ Confidence\n▪ Emotional balance',
    internalDialogue: '▪ "That’s the exit."\n▪ "Well executed."',
    typicalSigns: '▪ Exit aligns with plan\n▪ No urge to re-enter immediately',
    appearsWhen: '▪ Clear rules\n▪ Proper sizing\n▪ Emotional control',
    diagnosticTest: '▪ "Would I repeat this exit 100 times?"',
    correctiveActions: '▪ Reinforce behavior\n▪ Do not judge by P&L',
    permission: '✅ Allowed',
    category: "green",
  },
  {
    id: "EX008",
    type: 'Detached',
    coreEmotion: 'Complete emotional neutrality.',
    underlyingEmotions: '▪ Detachment\n▪ Acceptance\n▪ Process focus',
    internalDialogue: '▪ "Trade complete."\n▪ "Next opportunity will come."',
    typicalSigns: '▪ No emotional reaction\n▪ No immediate analysis or re-trade',
    appearsWhen: '▪ Trader is in flow\n▪ Strong process trust',
    diagnosticTest: '▪ "Does the result feel emotionally insignificant?"',
    correctiveActions: '▪ Maintain state\n▪ Avoid over-trading',
    permission: '✅ Preferred',
    category: "green",
  }
];

// Default data for Post-Exit Phase
const DEFAULT_POSTEXIT_DATA: PsychologyEntry[] = [
  {
    id: "PE001",
    type: "Regret",
    coreEmotion: "Pain from believing a different action would have produced a better outcome.",
    underlyingEmotions: "▪ Hindsight bias\n▪ Self-blame\n▪ Loss aversion\n▪ Perfectionism",
    internalDialogue: "▪ \"If only I had held longer.\"\n▪ \"I exited too early.\"\n▪ \"I messed this up.\"",
    typicalSigns: "▪ Replaying the chart repeatedly\n▪ Comparing actual exit vs hypothetical best exit\n▪ Emotional heaviness despite a green trade",
    appearsWhen: "▪ Trade continues after your exit\n▪ You followed rules but outcome looks sub-optimal",
    diagnosticTest: "▪ \"Am I judging the decision using information I didn’t have at the time?\"",
    correctiveActions: "▪ Grade process, not outcome\n▪ Write: “Was this exit correct given what I knew then?”\n▪ Accept regret as a cost of participation",
    permission: "⚠️ Allowed to feel, not allowed to drive next trade",
    category: "amber",
  },
  {
    id: "PE002",
    type: "Frustration",
    coreEmotion: "Irritation that effort did not lead to desired reward.",
    underlyingEmotions: "▪ Expectation mismatch\n▪ Impatience\n▪ Entitlement",
    internalDialogue: "▪ \"That should have worked better.\"\n▪ \"All that for nothing.\"",
    typicalSigns: "▪ Tight jaw, agitation\n▪ Desire to immediately take another trade\n▪ Shortened patience window",
    appearsWhen: "▪ Small win after effort\n▪ Scratch trade after correct read",
    diagnosticTest: "▪ \"Am I annoyed because outcome didn’t match effort?\"",
    correctiveActions: "▪ Mandatory pause before next trade\n▪ Reset expectations to probabilities",
    permission: "⚠️ Limited — pause required",
    category: "amber",
  },
  {
    id: "PE003",
    type: "Anger",
    coreEmotion: "Externalized blame after an unfavorable outcome.",
    underlyingEmotions: "▪ Ego injury\n▪ Injustice perception\n▪ Loss aversion",
    internalDialogue: "▪ \"The market is stupid.\"\n▪ \"That was unfair.\"",
    typicalSigns: "▪ Aggressive thoughts\n▪ Desire to ‘prove’ something\n▪ Impulse to increase size next trade",
    appearsWhen: "▪ Sudden stop-out\n▪ News spikes\n▪ Being right on direction but wrong on timing",
    diagnosticTest: "▪ \"Do I feel the urge to show the market something?\"",
    correctiveActions: "▪ Step away from screen\n▪ No trading until emotional charge fades",
    permission: "❌ Not allowed to trade under anger",
    category: "red",
  },
  {
    id: "PE004",
    type: "Self-Doubt",
    coreEmotion: "Questioning one’s ability or edge.",
    underlyingEmotions: "▪ Insecurity\n▪ Fear of incompetence\n▪ Confidence erosion",
    internalDialogue: "▪ \"Maybe I’m not good at this.\"\n▪ \"My edge doesn’t work anymore.\"",
    typicalSigns: "▪ Hesitation on next setup\n▪ Seeking external confirmation\n▪ Reducing size inconsistently",
    appearsWhen: "▪ Losing streaks\n▪ Multiple rule-following losses",
    diagnosticTest: "▪ \"Am I doubting myself because of variance or because of rule breaks?\"",
    correctiveActions: "▪ Review statistics, not recent trades\n▪ Trade smallest size or pause",
    permission: "⚠️ Limited — reduced risk only",
    category: "amber",
  },
  {
    id: "PE005",
    type: "Relief",
    coreEmotion: "Release of tension after uncertainty ends.",
    underlyingEmotions: "▪ Anxiety\n▪ Fear of loss\n▪ Emotional fatigue",
    internalDialogue: "▪ \"Finally, it’s over.\"\n▪ \"At least that’s done.\"",
    typicalSigns: "▪ Deep sigh\n▪ Loss of focus\n▪ Desire to disengage",
    appearsWhen: "▪ Emotionally stressful trades\n▪ Trades held against volatility",
    diagnosticTest: "▪ \"Was the trade emotionally heavy?\"",
    correctiveActions: "▪ Take a short break\n▪ Avoid immediate re-entry",
    permission: "⚠️ Allowed, but pause recommended",
    category: "amber",
  },
  {
    id: "PE006",
    type: "Pride",
    coreEmotion: "Positive self-evaluation after success.",
    underlyingEmotions: "▪ Confidence\n▪ Identity reinforcement\n▪ Satisfaction",
    internalDialogue: "▪ \"That was well done.\"\n▪ \"I executed that perfectly.\"",
    typicalSigns: "▪ Upright posture\n▪ Reviewing trade positively\n▪ Confidence boost",
    appearsWhen: "▪ Clean execution\n▪ Rule-based win",
    diagnosticTest: "▪ \"Am I proud of the process or just the profit?\"",
    correctiveActions: "▪ Reinforce behavior, not outcome\n▪ Keep size unchanged",
    permission: "⚠️ Allowed — watch for ego shift",
    category: "green",
  },
  {
    id: "PE007",
    type: "Overconfidence",
    coreEmotion: "Inflated belief in one’s accuracy or control.",
    underlyingEmotions: "▪ Euphoria\n▪ Entitlement\n▪ Selective memory",
    internalDialogue: "▪ \"I’m in sync today.\"\n▪ \"I should press harder.\"",
    typicalSigns: "▪ Planning next trade aggressively\n▪ Thinking about scaling size\n▪ Ignoring losing scenarios",
    appearsWhen: "▪ Big wins\n▪ Consecutive winners",
    diagnosticTest: "▪ \"Do I feel unusually certain about the next trade?\"",
    correctiveActions: "▪ Reset to base size\n▪ Mandatory cooldown after big wins",
    permission: "⚠️ Limited — guardrails required",
    category: "amber",
  },
  {
    id: "PE008",
    type: "Satisfaction",
    coreEmotion: "Contentment from correct execution.",
    underlyingEmotions: "▪ Confidence\n▪ Acceptance\n▪ Calm",
    internalDialogue: "▪ \"That was clean.\"\n▪ \"I did my job.\"",
    typicalSigns: "▪ No rush to trade again\n▪ Objective review mindset",
    appearsWhen: "▪ Rule-following trades (win or loss)",
    diagnosticTest: "▪ \"Would I trade again exactly the same way?\"",
    correctiveActions: "▪ Log trade\n▪ Continue normal execution",
    permission: "✅ Allowed",
    category: "green",
  },
  {
    id: "PE009",
    type: "Motivation / Reset",
    coreEmotion: "Healthy drive to continue with discipline.",
    underlyingEmotions: "▪ Optimism\n▪ Resilience\n▪ Purpose",
    internalDialogue: "▪ \"Next trade, same process.\"\n▪ \"Stay consistent.\"",
    typicalSigns: "▪ Calm readiness\n▪ No urgency",
    appearsWhen: "▪ Good emotional recovery\n▪ Clear mindset",
    diagnosticTest: "▪ \"Do I feel steady, not excited or desperate?\"",
    correctiveActions: "▪ Proceed with plan\n▪ Maintain routine",
    permission: "✅ Allowed",
    category: "green",
  },
  {
    id: "PE010",
    type: "Detachment / Neutrality",
    coreEmotion: "Emotional neutrality toward outcome.",
    underlyingEmotions: "▪ Acceptance\n▪ Maturity\n▪ Process orientation",
    internalDialogue: "▪ \"Trade complete.\"\n▪ \"One of many.\"",
    typicalSigns: "▪ Minimal emotional reaction\n▪ Smooth transition to next task",
    appearsWhen: "▪ Strong system trust\n▪ Long-term mindset",
    diagnosticTest: "▪ \"Does this trade feel emotionally insignificant?\"",
    correctiveActions: "▪ Preserve state\n▪ Avoid over-analysis",
    permission: "✅ Preferred",
    category: "green",
  },

];

export function PsychologySettings({
  isDark,
}: PsychologySettingsProps) {
  const [activeTab, setActiveTab] = useState<Phase>("entry");
  const [editingCell, setEditingCell] = useState<{
    phase: Phase;
    rowId: string;
    column: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get settings hook for syncing emotion tags
  const { settings, updatePsychologyTags } = useSettings();

  // Load data from localStorage or use defaults
  const loadPhaseData = (phase: Phase): PhaseData => {
    const stored = localStorage.getItem(
      `psychologySettings_${phase}`,
    );
    if (stored) {
      return JSON.parse(stored);
    }
    // Return defaults based on phase
    const defaultDataMap: Record<Phase, PsychologyEntry[]> = {
      entry: DEFAULT_ENTRY_DATA,
      inTrade: DEFAULT_INTRADE_DATA,
      exit: DEFAULT_EXIT_DATA,
      postExit: DEFAULT_POSTEXIT_DATA,
    };

    return {
      entries: defaultDataMap[phase],
      customColumns: [],
    };
  };

  const [phaseData, setPhaseData] = useState<
    Record<Phase, PhaseData>
  >({
    entry: loadPhaseData("entry"),
    inTrade: loadPhaseData("inTrade"),
    exit: loadPhaseData("exit"),
    postExit: loadPhaseData("postExit"),
  });

  // Initialize localStorage with default data if not present
  useEffect(() => {
    const phases: Phase[] = [
      "entry",
      "inTrade",
      "exit",
      "postExit",
    ];
    phases.forEach((phase) => {
      const stored = localStorage.getItem(
        `psychologySettings_${phase}`,
      );
      if (!stored) {
        // Save default data to localStorage
        localStorage.setItem(
          `psychologySettings_${phase}`,
          JSON.stringify(phaseData[phase]),
        );
      }
    });
  }, []);

  // Sync emotion types with Trade Journal dropdowns
  useEffect(() => {
    const syncEmotionsToSettings = () => {
      const allEmotions: PsychologyTag[] = [];

      // Map phase names to category names
      const phaseToCategory: Record<
        Phase,
        PsychologyTag["category"]
      > = {
        entry: "entry",
        inTrade: "inTrade",
        exit: "exit",
        postExit: "postExit",
      };

      // Extract emotion types from all phases
      Object.entries(phaseData).forEach(([phase, data]) => {
        const category = phaseToCategory[phase as Phase];
        data.entries.forEach((entry, index) => {
          if (entry.type && entry.type.trim()) {
            allEmotions.push({
              id: `${phase}_${entry.id}`,
              name: entry.type,
              category,
            });
          }
        });
      });

      // Update settings if emotions have changed
      if (allEmotions.length > 0) {
        updatePsychologyTags({ emotionalStates: allEmotions });
      }
    };

    syncEmotionsToSettings();
  }, [phaseData, updatePsychologyTags]);

  // Save to localStorage whenever data changes
  const savePhaseData = (phase: Phase, data: PhaseData) => {
    localStorage.setItem(
      `psychologySettings_${phase}`,
      JSON.stringify(data),
    );
    setPhaseData((prev) => ({ ...prev, [phase]: data }));
  };

  // CSV Import Handler
  // Accepts CSV files with the following required columns:
  // #, Type, Core Emotion, Underlying Emotions, Internal Dialogue,
  // Typical Signs, Appears When, Diagnostic Test, Corrective Actions, Permission
  // Optional column: Category (red/amber/green)
  //
  // The "Type" field will be used as the emotion name in Trade Journal dropdowns
  // Multi-line text should use \n for line breaks within CSV cells
  const handleCSVImport = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text
          .split("\n")
          .filter((line) => line.trim());

        if (lines.length < 2) {
          toast.error(
            "CSV file must contain headers and at least one data row",
          );
          return;
        }

        // Parse headers
        const headers = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/^"|"$/g, ""));

        // Validate required columns
        const requiredColumns = [
          "#",
          "Type",
          "Core Emotion",
          "Underlying Emotions",
          "Internal Dialogue",
          "Typical Signs",
          "Appears When",
          "Diagnostic Test",
          "Corrective Actions",
          "Permission",
        ];

        const missingColumns = requiredColumns.filter(
          (col) =>
            !headers.some(
              (h) => h.toLowerCase() === col.toLowerCase(),
            ),
        );

        if (missingColumns.length > 0) {
          toast.error(
            `Missing required columns: ${missingColumns.join(", ")}`,
          );
          return;
        }

        // Map headers to keys
        const headerMap: Record<string, string> = {
          "#": "id",
          type: "type",
          "core emotion": "coreEmotion",
          "underlying emotions": "underlyingEmotions",
          "internal dialogue": "internalDialogue",
          "typical signs": "typicalSigns",
          "appears when": "appearsWhen",
          "diagnostic test": "diagnosticTest",
          "corrective actions": "correctiveActions",
          permission: "permission",
          category: "category",
        };

        // Parse data rows
        const entries: PsychologyEntry[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Handle CSV with quoted fields that may contain commas
          const values: string[] = [];
          let currentValue = "";
          let insideQuotes = false;

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === "," && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          // Create entry object
          const entry: PsychologyEntry = {
            id: values[0] || Date.now().toString() + i,
            type: "",
            coreEmotion: "",
            underlyingEmotions: "",
            internalDialogue: "",
            typicalSigns: "",
            appearsWhen: "",
            diagnosticTest: "",
            correctiveActions: "",
            permission: "",
            category: "",
          };

          // Map values to entry fields
          headers.forEach((header, index) => {
            const key = headerMap[header.toLowerCase()];
            if (key && values[index] !== undefined) {
              // Remove surrounding quotes and preserve line breaks
              let value = values[index].replace(/^"|"$/g, "");
              // Replace escaped newlines with actual newlines
              value = value.replace(/\\n/g, "\n");
              entry[key] = value;
            }
          });

          entries.push(entry);
        }

        if (entries.length === 0) {
          toast.error("No valid data rows found in CSV");
          return;
        }

        // Save imported data
        const updatedData: PhaseData = {
          entries,
          customColumns: [],
        };

        savePhaseData(activeTab, updatedData);
        toast.success(
          `Successfully imported ${entries.length} entries`,
        );
      } catch (error) {
        console.error("CSV parsing error:", error);
        toast.error(
          "Failed to parse CSV file. Please check the format.",
        );
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsText(file);

    // Reset input so the same file can be uploaded again
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddRow = () => {
    const currentData = phaseData[activeTab];
    const newEntry: PsychologyEntry = {
      id: Date.now().toString(),
      type: "",
      coreEmotion: "",
      underlyingEmotions: "",
      internalDialogue: "",
      typicalSigns: "",
      appearsWhen: "",
      diagnosticTest: "",
      correctiveActions: "",
      permission: "",
    };

    // Add empty values for custom columns
    currentData.customColumns.forEach((col) => {
      newEntry[col.id] = "";
    });

    const updatedData = {
      ...currentData,
      entries: [...currentData.entries, newEntry],
    };

    savePhaseData(activeTab, updatedData);
  };

  const handleDeleteRow = (rowId: string) => {
    const currentData = phaseData[activeTab];
    const updatedData = {
      ...currentData,
      entries: currentData.entries.filter(
        (entry) => entry.id !== rowId,
      ),
    };
    savePhaseData(activeTab, updatedData);
  };

  const handleStartEdit = (
    rowId: string,
    column: string,
    currentValue: string,
  ) => {
    setEditingCell({ phase: activeTab, rowId, column });
    setEditValue(currentValue);
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const currentData = phaseData[activeTab];
    const updatedEntries = currentData.entries.map((entry) =>
      entry.id === editingCell.rowId
        ? { ...entry, [editingCell.column]: editValue }
        : entry,
    );

    const updatedData = {
      ...currentData,
      entries: updatedEntries,
    };

    savePhaseData(activeTab, updatedData);
    setEditingCell(null);
    setEditValue("");
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
    setIsEditMode(false);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const currentData = phaseData[activeTab];
    const newColumn: CustomColumn = {
      id: `custom_${Date.now()}`,
      name: newColumnName.trim(),
    };

    // Add the new column to all existing entries with empty value
    const updatedEntries = currentData.entries.map((entry) => ({
      ...entry,
      [newColumn.id]: "",
    }));

    const updatedData = {
      entries: updatedEntries,
      customColumns: [...currentData.customColumns, newColumn],
    };

    savePhaseData(activeTab, updatedData);
    setNewColumnName("");
    setShowAddColumn(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    const currentData = phaseData[activeTab];

    // Remove the column from all entries
    const updatedEntries = currentData.entries.map((entry) => {
      const { [columnId]: removed, ...rest } = entry;
      return rest;
    });

    // Remove from custom columns list
    const updatedColumns = currentData.customColumns.filter(
      (col) => col.id !== columnId,
    );

    const updatedData = {
      entries: updatedEntries,
      customColumns: updatedColumns,
    };

    savePhaseData(activeTab, updatedData);
  };

  const handleResetToDefault = () => {
    const defaultDataMap: Record<Phase, PsychologyEntry[]> = {
      entry: DEFAULT_ENTRY_DATA,
      inTrade: DEFAULT_INTRADE_DATA,
      exit: DEFAULT_EXIT_DATA,
      postExit: DEFAULT_POSTEXIT_DATA,
    };

    const resetData: PhaseData = {
      entries: defaultDataMap[activeTab],
      customColumns: [],
    };

    savePhaseData(activeTab, resetData);
    toast.success(`Reset ${activeTab} phase to default data`);
  };

  const handleCategoryChange = (
    rowId: string,
    category: "red" | "amber" | "green" | "",
  ) => {
    const currentData = phaseData[activeTab];
    const updatedEntries = currentData.entries.map((entry) =>
      entry.id === rowId ? { ...entry, category } : entry,
    );

    const updatedData = {
      ...currentData,
      entries: updatedEntries,
    };

    savePhaseData(activeTab, updatedData);
  };

  const tabs = [
    { id: "entry" as Phase, label: "Entry Emotions" },
    { id: "inTrade" as Phase, label: "In-Trade Emotions" },
    { id: "exit" as Phase, label: "Exit Emotions" },
    { id: "postExit" as Phase, label: "Post-Exit Emotions" },
  ];

  const currentData = phaseData[activeTab];
  const allColumns = [
    ...DEFAULT_COLUMNS,
    ...currentData.customColumns.map((col) => ({
      key: col.id,
      label: col.name,
      width: "150px",
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`pb-4 border-b ${isDark ? "border-zinc-700" : "border-neutral-200"}`}
      >
        <div className="flex items-center gap-2">
          <h2
            className={`text-base font-medium ${isDark ? "text-zinc-100" : "text-neutral-900"}`}
          >
            Psychology Settings
          </h2>
        </div>
        <p
          className={`text-sm mt-1 ${isDark ? "text-zinc-400" : "text-neutral-600"}`}
        >
          Manage structured emotional playbooks across different
          trading phases. Import CSV data or edit manually.
        </p>
      </div>

      {/* Tabs */}
      <div
        className={`border-b ${isDark ? "border-zinc-700" : "border-neutral-200"}`}
      >
        <div className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? isDark
                    ? "border-blue-500 text-blue-400 bg-zinc-800/50"
                    : "border-blue-600 text-blue-600 bg-blue-50"
                  : isDark
                    ? "border-transparent text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div
        className={`border rounded-lg overflow-hidden ${isDark ? "border-zinc-700" : "border-neutral-200"}`}
      >
        {/* Action Bar */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? "bg-zinc-800 border-zinc-700" : "bg-neutral-50 border-neutral-200"}`}
        >
          <div
            className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-neutral-600"}`}
          >
            {currentData.entries.length}{" "}
            {currentData.entries.length === 1
              ? "entry"
              : "entries"}
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <>
                {showAddColumn ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newColumnName}
                      onChange={(e) =>
                        setNewColumnName(e.target.value)
                      }
                      placeholder="Column name"
                      className={`h-8 text-xs w-40 ${isDark ? "bg-zinc-900 border-zinc-600" : "bg-white border-neutral-300"}`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleAddColumn();
                        if (e.key === "Escape") {
                          setShowAddColumn(false);
                          setNewColumnName("");
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddColumn}
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setShowAddColumn(false);
                        setNewColumnName("");
                      }}
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowAddColumn(true)}
                    size="sm"
                    variant="outline"
                    className={`h-8 px-3 text-xs ${isDark ? "border-zinc-600 text-zinc-300 hover:bg-zinc-700" : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    <Plus className="size-3 mr-1" />
                    Add Column
                  </Button>
                )}
                <Button
                  onClick={handleAddRow}
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Plus className="size-3 mr-1" />
                  Add Row
                </Button>
              </>
            )}

            {/* Reset to Default Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleResetToDefault}
                  size="sm"
                  variant="outline"
                  className={`h-8 px-3 text-xs ${
                    isDark
                      ? "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <RefreshCw className="size-3 mr-1" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className={
                  isDark
                    ? "bg-zinc-800 text-zinc-100"
                    : "bg-white text-neutral-900"
                }
              >
                <p className="text-xs">
                  Reset to hardcoded default data
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />

            {/* Import CSV Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleImportClick}
                  size="sm"
                  variant="outline"
                  className={`h-8 px-3 text-xs ${
                    isDark
                      ? "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <Upload className="size-3 mr-1" />
                  Import CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className={`max-w-xs ${isDark ? "bg-zinc-800 text-zinc-100" : "bg-white text-neutral-900"}`}
              >
                <div className="space-y-1 text-xs">
                  <p className="font-medium">
                    CSV Import Format:
                  </p>
                  <p className="text-xs opacity-90">
                    Required columns: #, Type, Core Emotion,
                    Underlying Emotions, Internal Dialogue,
                    Typical Signs, Appears When, Diagnostic
                    Test, Corrective Actions, Permission
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Optional: Category (red/amber/green)
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Multi-line text: use \n for line breaks
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            <Button
              onClick={() => setIsEditMode(!isEditMode)}
              size="sm"
              variant={isEditMode ? "default" : "outline"}
              className={`h-8 px-3 text-xs ${
                !isEditMode && isDark
                  ? "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  : !isEditMode
                    ? "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                    : ""
              }`}
            >
              <Edit2 className="size-3 mr-1" />
              {isEditMode ? "Done" : "Edit"}
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[calc(100vh-400px)]">
          <table className="w-full">
            {/* Header */}
            <thead
              className={`sticky top-0 z-10 ${isDark ? "bg-zinc-800" : "bg-neutral-100"}`}
            >
              <tr>
                <th
                  className={`px-3 py-2 text-left text-xs font-medium w-12 border-b ${isDark ? "text-zinc-400 border-zinc-700" : "text-neutral-600 border-neutral-200"}`}
                >
                  #
                </th>
                {allColumns.map((col, idx) => (
                  <th
                    key={col.key}
                    style={{ minWidth: col.width }}
                    className={`px-3 py-2 text-left text-xs font-medium border-b ${isDark ? "text-zinc-400 border-zinc-700" : "text-neutral-600 border-neutral-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{col.label}</span>
                      {isEditMode &&
                        idx >= DEFAULT_COLUMNS.length && (
                          <button
                            onClick={() =>
                              handleDeleteColumn(col.key)
                            }
                            className={`ml-2 ${isDark ? "text-zinc-500 hover:text-red-400" : "text-neutral-400 hover:text-red-600"}`}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        )}
                    </div>
                  </th>
                ))}
                {isEditMode && (
                  <th
                    className={`px-3 py-2 text-left text-xs font-medium w-16 border-b ${isDark ? "text-zinc-400 border-zinc-700" : "text-neutral-600 border-neutral-200"}`}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody
              className={isDark ? "bg-zinc-900" : "bg-white"}
            >
              {currentData.entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      allColumns.length + (isEditMode ? 2 : 1)
                    }
                    className={`px-4 py-12 text-center text-sm ${isDark ? "text-zinc-500" : "text-neutral-500"}`}
                  >
                    No entries yet. Click "Add Row" to get
                    started.
                  </td>
                </tr>
              ) : (
                currentData.entries.map((entry, rowIdx) => (
                  <tr
                    key={entry.id}
                    className={`border-b ${isDark ? "border-zinc-800 hover:bg-zinc-800/50" : "border-neutral-100 hover:bg-neutral-50"}`}
                  >
                    {/* Row Number */}
                    <td
                      className={`px-3 py-2 text-xs ${isDark ? "text-zinc-500" : "text-neutral-500"}`}
                    >
                      {rowIdx + 1}
                    </td>

                    {/* Data Cells */}
                    {allColumns.map((col) => {
                      const isEditing =
                        editingCell?.rowId === entry.id &&
                        editingCell?.column === col.key;
                      const value = entry[col.key] || "";

                      // Special handling for category column
                      if (col.key === "category") {
                        return (
                          <td
                            key={col.key}
                            className="px-3 py-2"
                            style={{ minWidth: col.width }}
                          >
                            {isEditMode ? (
                              <select
                                value={entry.category || ""}
                                onChange={(e) =>
                                  handleCategoryChange(
                                    entry.id,
                                    e.target.value as
                                      | "red"
                                      | "amber"
                                      | "green"
                                      | "",
                                  )
                                }
                                className={`text-xs w-full px-2 py-1.5 rounded border ${
                                  isDark
                                    ? "bg-zinc-800 border-zinc-600 text-zinc-300"
                                    : "bg-white border-neutral-300 text-neutral-700"
                                }`}
                              >
                                <option value="">
                                  Select...
                                </option>
                                <option value="red">
                                  🔴 Red
                                </option>
                                <option value="amber">
                                  🟡 Amber
                                </option>
                                <option value="green">
                                  🟢 Green
                                </option>
                              </select>
                            ) : (
                              <div
                                className={`text-xs px-2 py-1.5 min-h-[36px] ${isDark ? "text-zinc-300" : "text-neutral-700"}`}
                              >
                                {entry.category === "red" &&
                                  "🔴 Red"}
                                {entry.category === "amber" &&
                                  "🟡 Amber"}
                                {entry.category === "green" &&
                                  "🟢 Green"}
                                {!entry.category && (
                                  <span
                                    className={
                                      isDark
                                        ? "text-zinc-600"
                                        : "text-neutral-400"
                                    }
                                  >
                                    —
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.key}
                          className="px-3 py-2"
                          style={{ minWidth: col.width }}
                        >
                          {isEditing ? (
                            <div className="flex items-start gap-1">
                              <Textarea
                                value={editValue}
                                onChange={(e) =>
                                  setEditValue(e.target.value)
                                }
                                className={`text-xs min-h-[60px] ${isDark ? "bg-zinc-800 border-zinc-600" : "bg-white border-neutral-300"}`}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    e.ctrlKey
                                  ) {
                                    handleSaveEdit();
                                  } else if (
                                    e.key === "Escape"
                                  ) {
                                    handleCancelEdit();
                                  }
                                }}
                              />
                              <div className="flex flex-col gap-1">
                                <Button
                                  onClick={handleSaveEdit}
                                  size="sm"
                                  className="h-6 px-2"
                                >
                                  ✓
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2"
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={
                                isEditMode
                                  ? () =>
                                      handleStartEdit(
                                        entry.id,
                                        col.key,
                                        value,
                                      )
                                  : undefined
                              }
                              className={`text-xs rounded px-2 py-1.5 min-h-[36px] whitespace-pre-wrap ${
                                isEditMode
                                  ? isDark
                                    ? "cursor-pointer hover:bg-zinc-800 text-zinc-300"
                                    : "cursor-pointer hover:bg-neutral-100 text-neutral-700"
                                  : isDark
                                    ? "text-zinc-300"
                                    : "text-neutral-700"
                              } ${!value && (isDark ? "text-zinc-600" : "text-neutral-400")}`}
                            >
                              {value ||
                                (isEditMode
                                  ? "Click to edit"
                                  : "—")}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Actions */}
                    {isEditMode && (
                      <td className="px-3 py-2">
                        <button
                          onClick={() =>
                            handleDeleteRow(entry.id)
                          }
                          className={`p-1.5 rounded transition-colors ${
                            isDark
                              ? "text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                              : "text-neutral-400 hover:text-red-600 hover:bg-neutral-100"
                          }`}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Helper Text */}
      <div
        className={`text-xs ${isDark ? "text-zinc-500" : "text-neutral-500"} space-y-1`}
      >
        <p>
          💡 <strong>Tips:</strong>
        </p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Click any cell to edit it inline</li>
          <li>Press Ctrl+Enter to save, Escape to cancel</li>
          <li>Use "Add Column" to create custom fields</li>
          <li>
            All changes are automatically saved to browser
            storage
          </li>
        </ul>
      </div>
    </div>
  );
}