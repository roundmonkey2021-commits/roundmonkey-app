# Quick Start: CSV Import for Psychology Settings

## Step-by-Step Guide

### 1. Prepare Your CSV File

Create a CSV with these exact column headers (order matters):

```
#,Type,Core Emotion,Underlying Emotions,Internal Dialogue,Typical Signs,Appears When,Diagnostic Test,Corrective Actions,Permission,Category
```

### 2. Format Your Data

- **Multi-line text**: Use `\n` for line breaks
- **Quotes**: Use double quotes `""` inside cells for nested quotes
- **Bullet points**: Use `▪` or `•`
- **Emojis**: ✅ ❌ ⚠️ 👉 ⛔ are supported

Example row:
```csv
1,Confident Entry,▪ Calm certainty,"▪ Self-assurance\n▪ Trust","▪ ""Setup is clear""","▪ SL defined\n▪ No rush","▪ After preparation","👉 ""Can I explain this?""","▪ Enter as planned",✅ Allowed,green
```

### 3. Import to App

> **Note**: The Psychology Settings tables start empty by design. All data must be imported via CSV or added manually.

1. Open your trading journal app
2. Go to **Settings** → **Psychology Settings**
3. Select the appropriate tab:
   - **Entry Emotions** - For pre-trade emotions
   - **In-Trade Emotions** - For during-trade emotions
   - **Exit Emotions** - For exit-moment emotions
   - **Post-Exit Emotions** - For after-trade emotions
4. Click **Import CSV** button (top-right)
5. Select your CSV file
6. Wait for success message

### 4. Verify Import

1. Check the table shows your imported data
2. Go to **Trade Journal** (New Trade Entry)
3. Scroll to **Psychology Tracking** section
4. Open emotion dropdowns - your imported emotions should appear

### 5. Test Sample Data

A sample CSV file is available at `/tmp/sandbox/sample_emotions.csv`

Try importing it first to understand the format.

## Common Issues

**"Missing required columns"**
- Ensure all 10 required columns are present
- Check spelling (case doesn't matter)

**"No valid data rows found"**
- Ensure at least one data row exists below headers
- Check for empty rows

**"Multi-line text not showing"**
- Use `\n` not actual line breaks in CSV cells
- Wrap cells containing commas in double quotes

## CSV Template

Download or copy this template:

```csv
#,Type,Core Emotion,Underlying Emotions,Internal Dialogue,Typical Signs,Appears When,Diagnostic Test,Corrective Actions,Permission,Category
1,Emotion Name Here,▪ Core emotion description,"▪ First underlying emotion\n▪ Second underlying emotion","▪ ""First dialogue""\n▪ ""Second dialogue""","▪ First sign\n▪ Second sign","▪ First trigger\n▪ Second trigger","▪ ""First test question?""","▪ First action\n▪ Second action",✅ Allowed,green
```

## Data Integration

Once imported, emotions are automatically available in:

- **Trade Journal dropdowns** (emotion selection)
- **Performance analytics** (emotion tracking)
- **Programmatic access** via:
  ```typescript
  import { getPsychologyEntry } from './utils/psychologyData';
  const details = getPsychologyEntry('Confident Entry', 'entry');
  ```

## Backing Up Data

Your data is stored in browser localStorage. To backup:

1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Find keys starting with `psychologySettings_`
4. Copy values to save externally

Or use Edit mode to manually copy table data.

## Need Help?

See full documentation in:
- `PSYCHOLOGY_CSV_GUIDE.md` - Detailed guide
- `IMPLEMENTATION_SUMMARY.md` - Technical details
