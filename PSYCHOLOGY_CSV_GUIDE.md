# Psychology Settings - CSV Import Guide

## Overview

The Psychology Settings page allows you to import emotion playbook data via CSV files. This enables you to:
- Bulk import custom emotion definitions
- Override default hardcoded data temporarily
- Maintain consistency across team members
- Backup and restore emotion playbooks

**Important**: The system starts with hardcoded default emotions for all 4 phases. CSV import is optional and temporarily overrides defaults. Use the **Reset** button to restore hardcoded data.

## CSV Format Requirements

### Required Columns

Your CSV file **must** include these columns (exact names, case-insensitive):

1. **#** - Unique ID for the emotion (e.g., E001, E002, IT001, EX001, PE001)
2. **Type** - Emotion name (e.g., "Confident", "Fearful", "Greedy")
3. **Core Emotion** - Primary emotional state
4. **Underlying Emotions** - Related or secondary emotions
5. **Internal Dialogue** - Typical self-talk patterns
6. **Typical Signs** - Physical or behavioral indicators
7. **Appears When** - Triggering situations
8. **Diagnostic Test** - Self-check questions to identify this emotion
9. **Corrective Actions** - Steps to take when feeling this emotion
10. **Permission** - Trading permission (✅ Allowed, ⚠️ Caution, 🚫 Not Allowed)

### Optional Columns

- **Category** - Color classification: `red`, `amber`, or `green`

### Unique ID Format

**CRITICAL**: Each emotion must have a stable, unique ID:

- **Entry Phase**: E001, E002, E003, E004, E005
- **In-Trade Phase**: IT001, IT002, IT003, IT004, IT005
- **Exit Phase**: EX001, EX002, EX003, EX004, EX005
- **Post-Exit Phase**: PE001, PE002, PE003, PE004, PE005

**Why IDs matter**: The Trade Journal stores emotion IDs (not names) in trades. This enables:
- Looking up full emotion details (permission, corrective actions, etc.)
- Changing emotion names without breaking data linkage
- Running analytics based on emotion patterns
- Displaying warnings and guidance in real-time

## Formatting Guidelines

### Multi-line Text

Use `\n` to represent line breaks within cells. For example:

```
"▪ Urgency\n▪ Restlessness\n▪ Impatience"
```

Will be displayed as:
```
▪ Urgency
▪ Restlessness
▪ Impatience
```

### Special Characters

- Bullet points: Use `▪` or `•`
- Emojis: ✅, ❌, ⚠️, 👉, ⛔ are supported
- Quotes within text: Use double quotes `""` for nested quotes

### CSV Example

```csv
#,Type,Core Emotion,Underlying Emotions,Internal Dialogue,Typical Signs,Appears When,Diagnostic Test,Corrective Actions,Permission,Category
E001,Confident,Self-assurance,"Calm, prepared, trust in analysis","""This is a solid setup. I've done my homework."""","• Clear rationale for entry\n• No hesitation\n• Aligned with trading plan","Setup matches criteria, risk is defined, feeling prepared",Can you explain your thesis in one sentence?,Proceed with trade. Log reasoning.,✅ Allowed,green
E002,Anxious,"Worry, uncertainty","Fear of loss, doubt in analysis","""What if this doesn't work?""","• Second-guessing setup\n• Checking multiple confirmations\n• Tight chest/shallow breathing","Unclear market conditions, recent loss, lack of conviction",Is your stop-loss clear? Can you accept the risk?,"• Reduce position size\n• Walk away if no clarity\n• Review setup checklist",⚠️ Caution - Only proceed if setup is objectively valid,amber
E004,Greedy,Desire for more,"FOMO, impatience, overconfidence","""This is going to be huge. I should go bigger."""","• Wanting to increase position size\n• Ignoring risk limits\n• Thinking about profits before entry","After winning streak, seeing others profit, market moving fast",Am I following my plan or chasing?,"🛑 DO NOT TRADE\n• Step away\n• Review risk rules\n• Journal this impulse",🚫 Not Allowed,red
```

## How to Import

1. Navigate to **Settings** → **Psychology Settings**
2. Select the appropriate tab (Entry Emotions, In-Trade Emotions, Exit Emotions, or Post-Exit Emotions)
3. Click the **Import CSV** button in the top-right corner
4. Select your CSV file
5. The data will temporarily override the default entries for that phase
6. Review imported data in the table
7. Use **Edit** mode to make manual adjustments if needed

## Reset to Default

To restore the original hardcoded emotion playbook:

1. Click the **Reset** button in the action bar
2. This will restore default emotions for the current phase
3. Your custom/imported data will be replaced (this action cannot be undone)

The default playbook includes 5 emotions per phase:
- **Confident** (✅ Green)
- **Anxious** (⚠️ Amber)
- **Calm** (✅ Green)
- **Greedy** (🚫 Red)
- **Fearful** (🚫 Red)

## Trade Journal Integration

The **Type** field from Psychology Settings automatically populates emotion dropdowns in the Trade Journal:

- **Entry Emotions** tab → Entry Emotion dropdown
- **In-Trade Emotions** tab → In-Trade Emotion dropdown
- **Exit Emotions** tab → Exit Emotion dropdown
- **Post-Exit Emotions** tab → Post-Exit Emotion dropdown

**Important**: When you select an emotion, the **emotion ID** (e.g., "entry_E001") is stored in the trade, NOT the emotion name. This design enables:

1. **Data Lookup**: Retrieve full emotion details anytime
2. **Warnings**: Display permission status and corrective actions
3. **Analytics**: Analyze trades by emotion category (red/amber/green)
4. **Flexibility**: Change emotion names without breaking existing data

### Example Flow

1. User selects "Greedy" from Entry Emotion dropdown
2. Trade stores ID: `entry_E004`
3. Later, you can look up:
   - Permission: "🚫 Not Allowed"
   - Corrective Actions: "🛑 DO NOT TRADE • Step away • Review risk rules • Journal this impulse"
   - Category: "red"
   - All other playbook fields

## Accessing Full Psychology Data

To retrieve detailed emotion information in your code:

```typescript
// Using the emotion lookup hook
import { useEmotionLookup } from '../hooks/useEmotionLookup';

function MyComponent() {
  const emotionLookup = useEmotionLookup();

  // Get full emotion details
  const emotion = emotionLookup.getEmotion('entry_E004', 'entry');
  console.log(emotion?.type); // "Greedy"
  console.log(emotion?.permission); // "🚫 Not Allowed"
  console.log(emotion?.correctiveActions); // "🛑 DO NOT TRADE..."

  // Check permission
  const permission = emotionLookup.checkPermission('entry_E004', 'entry');
  if (permission.notAllowed) {
    alert('This emotion is not allowed for trading!');
  }

  // Get all emotions for a trade
  const trade = {
    entryEmotions: 'entry_E001',
    inTradeEmotions: 'inTrade_IT003',
    exitEmotions: 'exit_EX002',
    postExitEmotions: 'postExit_PE001',
  };

  const emotions = emotionLookup.getTradeEmotions(trade);
  console.log(emotions.entry?.type); // "Confident"
}
```

See `/src/app/docs/EMOTION_PLAYBOOK_USAGE.ts` for comprehensive usage examples.

## Data Storage

- All psychology data is stored in localStorage
- Keys: `psychologySettings_entry`, `psychologySettings_inTrade`, `psychologySettings_exit`, `psychologySettings_postExit`
- Data persists across browser sessions
- No backend or authentication required

## Validation

The import process validates:

1. File type must be `.csv`
2. All required columns must be present
3. At least one data row must exist
4. Headers are case-insensitive

If validation fails, an error message will indicate what's missing.

## Best Practices

1. **Keep Type names concise** - They appear in dropdowns
2. **Use consistent bullet points** - Maintains visual formatting
3. **Preserve line breaks** - Use `\n` in multi-line fields
4. **Test with sample data** - Import the provided `sample_emotions.csv` first
5. **Back up before import** - Importing replaces all existing data for that phase

## Troubleshooting

**Import fails with "Invalid format"**
- Check that all required columns are present
- Verify column headers match exactly (case-insensitive)
- Ensure at least one data row exists

**Multi-line text not displaying correctly**
- Use `\n` (not actual line breaks) in your CSV cells
- Wrap cells containing commas in double quotes

**Emotions not appearing in Trade Journal**
- Refresh the page after importing
- Check that the emotion Type field is not empty
- Verify data was saved (check browser localStorage)

## Sample CSV Structure

```csv
#,Type,Core Emotion,Underlying Emotions,Internal Dialogue,Typical Signs,Appears When,Diagnostic Test,Corrective Actions,Permission,Category
1,Impulsive Entry,▪ Urgency-driven action,"▪ Urgency\n▪ Restlessness","▪ ""Now or Never""","▪ No SL planned","▪ Market is slow","▪ ""Do I feel urgency?""","▪ Delay entry",❌ Not allowed,red
```
