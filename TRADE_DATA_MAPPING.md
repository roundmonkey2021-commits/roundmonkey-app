# 📊 NIFTY Trading Journal - Complete Data Flow & Field Mapping

**Document Version:** 1.0  
**Last Updated:** March 23, 2026  
**Purpose:** Complete reference for all trade inputs, storage, calculations, and display

---

## 🎯 Table of Contents

1. [Overview](#overview)
2. [Data Flow Architecture](#data-flow-architecture)
3. [Complete Field Mapping Table](#complete-field-mapping-table)
4. [Trading Phases Settings](#trading-phases-settings)
5. [Lot Size & Quantity System](#lot-size--quantity-system)
6. [Trading Phase Integration](#trading-phase-integration)
7. [Calculations & Formulas](#calculations--formulas)
8. [Storage Structure](#storage-structure)
9. [CSV Export Columns](#csv-export-columns)

---

## 📋 Overview

This document provides a complete mapping of how data flows through the NIFTY Trading Journal app:
- **Trade Journal Form** → User inputs
- **Trade Interface** → Data storage structure
- **History Tab** → Data display
- **CSV Export** → Downloaded report

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRADE JOURNAL PAGE                          │
│                    (User Input Forms)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │   TradeFormData Interface (Form State)   │
        │   - Temporary form values (strings)      │
        │   - Used during trade creation/editing   │
        └─────────────────────────────────────────┘
                              ↓
                    **CONVERSION HAPPENS HERE**
                    (Lines 420-460 in TradeJournal.tsx)
                              ↓
        ┌─────────────────────────────────────────┐
        │    Trade Interface (Stored Object)       │
        │    - Permanent storage structure         │
        │    - Values converted to proper types    │
        │    - Saved in localStorage                │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │         localStorage Storage             │
        │         Key: 'nifty-trades'              │
        │         Format: JSON array of Trade[]    │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │       useTrades Hook (Retrieval)         │
        │       - Loads from localStorage           │
        │       - Provides CRUD operations          │
        └─────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │          TRADE HISTORY PAGE              │
        │          (Display & Export)              │
        └─────────────────────────────────────────┘
                      ↓               ↓
              ┌──────────┐     ┌─────────┐
              │ UI Table │     │   CSV   │
              └──────────┘     └─────────┘
```

---

## 📊 Complete Field Mapping Table

### **Legend:**
- ✅ = Fully implemented and working
- 📝 = String in form, converted to number/type in storage
- 🔢 = Auto-calculated field
- 🎯 = Optional field

| # | Form Field Label | Form Input Name | Data Type (Form) | Trade Interface Property | Data Type (Storage) | History Tab Column | CSV Column | Notes |
|---|---|---|---|---|---|---|---|---|
| **BASIC TRADE INFO** |
| 1 | Date | `date` | string | `timestamp` | string (ISO date) | Entry Date | Entry Date | ✅ Required |
| 2 | Day | `day` | string | `day` | string | Day | Day | ✅ Required (Mon-Fri) |
| 3 | Entry Time | `entryTime` | string | `entryTime` | string | Entry Time | Entry Time | ✅ Required (9:15 AM - 3:30 PM) |
| 4 | Exit Time | `exitTime` | string | `exitTime` | string | — | Exit Time | 🎯 Optional |
| 5 | Exit Date | `exitDate` | string | `exitDate` | string | — | Exit Date | 🎯 Optional (defaults to entry date) |
| **ASSET CLASS & SYMBOL** |
| 6 | Asset Class | `assetClass` | string | `assetClass` | string | Asset Class | Asset Class | ✅ Index/Equity/Commodity |
| 7 | Symbol | `symbol` | string | `symbol` | string | Symbol | Symbol | ✅ Required (e.g., NIFTY) |
| 8 | Instrument | `instrument` | string | `instrument` | string | Instrument | Instrument | ✅ Auto-populated based on symbol |
| **OPTION DETAILS** |
| 9 | Option Type | `optionType` | "call" \| "put" | `optionType` | "call" \| "put" | Option Type | Option Type | ✅ Required |
| 10 | Strike Price | `strikePrice` | string | `strikePrice` | number | Strike | Strike Price | 📝 Required (converted to number) |
| 11 | Expiry Date | `expiryDate` | string | `expiryDate` | string | Expiry | Expiry Date | ✅ Required |
| **ACTION & SIZE** |
| 12 | Action | `action` | "buy" \| "sell" | `action` | "buy" \| "sell" | Action | Action | ✅ Required |
| 13 | Lot Size | `lotSize` (Execution) | string | `lotSize` | number | — | Lot Size | 📝 **Actual executed lot size** |
| 14 | Quantity | `quantity` (Execution) | string | `quantity` | number | Qty | Quantity | 📝 **Actual executed quantity** |
| **PLANNING SECTION** |
| 15 | Plan Lot Size | `planLotSize` | string | `planLotSize` | number | — | Plan Lot Size | 📝 **NEW: What you planned to trade** |
| 16 | Plan Quantity | `planQuantity` | string | `planQuantity` | number | — | Plan Quantity | 📝 **NEW: Planned quantity** |
| 17 | Plan Action | `planAction` | "buy" \| "sell" | `planAction` | "buy" \| "sell" | — | Plan Action | 🎯 **NEW: Planned action** |
| 18 | Plan Entry Price | `planEntryPrice` | string | `planEntryPrice` | number | — | Planned Entry Premium | 📝 Planned entry premium |
| 19 | Plan Target Price | `planExitPrice` | string | `planExitPrice` | number | — | Planned Target Premium | 📝 Planned target premium |
| 20 | Plan Stop Loss | `planStopLoss` | string | `planStopLoss` | number | — | Planned SL Premium | 📝 Planned SL premium |
| **PREMIUMS & PRICING** |
| 21 | Entry Premium | `entryPremium` | string | `entryPremium` | number | Entry | Entry Premium | 📝 Required |
| 22 | Exit Premium | `exitPremium` | string | `exitPremium` | number | Exit | Exit Premium | 📝 Optional (when trade is closed) |
| 23 | Symbol Price (Spot) | `symbolPrice` | string | `symbolPrice` | number | — | Symbol Price (Spot) | 📝 Spot price at entry |
| 24 | Total Invested | `totalInvested` | string | `totalInvested` | number | — | Total Invested | 🔢 Auto-calculated |
| **TRADING PHASE** |
| 25 | Phase | `phase` (dropdown) | string | `phase` | string | — | Phase ID | ✅ Selected trading phase ID |
| 26 | — | — | — | `allowedLotSize` | number | — | Allowed Lot Size | 🔢 **Auto-populated from phase settings** |
| **EMOTIONS** |
| 27 | Entry Emotion | `entryEmotions` | string | `entryEmotions` | string | — | Entry Emotion | ✅ Optional dropdown |
| 28 | Entry Emotion Notes | `entryEmotionNotes` | string | `entryEmotionNotes` | string | — | Entry Emotion Notes | 🎯 Text field |
| 29 | In-Trade Emotion | `inTradeEmotions` | string | `inTradeEmotions` | string | — | In-Trade Emotion | ✅ Optional |
| 30 | In-Trade Notes | `inTradeEmotionNotes` | string | `inTradeEmotionNotes` | string | — | In-Trade Emotion Notes | 🎯 Text field |
| 31 | Exit Emotion | `exitEmotions` | string | `exitEmotions` | string | — | Exit Emotion | ✅ Optional |
| 32 | Exit Emotion Notes | `exitEmotionNotes` | string | `exitEmotionNotes` | string | — | Exit Emotion Notes | 🎯 Text field |
| 33 | Post-Exit Emotion | `postExitEmotions` | string | `postExitEmotions` | string | — | Post-Exit Emotion | ✅ Optional |
| 34 | Post-Exit Notes | `postExitEmotionNotes` | string | `postExitEmotionNotes` | string | — | Post-Exit Emotion Notes | 🎯 Text field |
| **TRADE EXECUTION** |
| 35 | Setup | `setup` | string | `setup` | string | Setup | Setup | 🎯 Optional text |
| 36 | Notes | `notes` | string | `notes` | string | — | Notes | 🎯 Optional |
| 37 | Is Planned | `isPlanned` | boolean | `isPlanned` | boolean | — | Planned | ✅ Checkbox (Yes/No) |
| 38 | Exit Reason | `exitReason` | string | `exitReason` | string | — | Exit Reason | 🎯 Optional |
| 39 | Early Exit | `earlyExit` | boolean | `earlyExit` | boolean | — | Early Exit | ✅ Checkbox |
| 40 | Modified SL | `modifiedSL` | boolean | `modifiedSL` | boolean | — | Modified SL | ✅ Checkbox |
| 41 | Modified SL Reason | `modifiedSLReason` | string | `modifiedSLReason` | string | — | Modified SL Reason | 🎯 Text field |
| 42 | Entry Order Type | `entryOrderType` | "limit" \| "market" | `entryOrderType` | "limit" \| "market" | — | Entry Order Type | 🎯 Optional |
| 43 | Exit Order Type | `exitOrderType` | "limit" \| "market" | `exitOrderType` | "limit" \| "market" | — | Exit Order Type | 🎯 Optional |
| **CHART ATTACHMENTS** |
| 44 | Symbol Chart | `symbolChart` (file upload) | File → base64 | `symbolChart` | string (base64) | — | — | 🎯 Optional image |
| 45 | Call Chart | `callChart` (file upload) | File → base64 | `callChart` | string (base64) | — | — | 🎯 Optional image |
| 46 | Put Chart | `putChart` (file upload) | File → base64 | `putChart` | string (base64) | — | — | 🎯 Optional image |
| **AUTO-CALCULATED FIELDS (Not in form)** |
| 47 | — | — | — | `id` | string | — | — | 🔢 Auto-generated unique ID |
| 48 | — | — | — | `pnl` | number | P&L | P&L | 🔢 Calculated from premiums |
| 49 | — | — | — | — (calculated) | — | Moneyness | Moneyness | 🔢 ITM/ATM/OTM calculation |
| 50 | — | — | — | — (calculated) | — | Duration | Duration (minutes) | 🔢 Exit time - Entry time |
| 51 | — | — | — | — (calculated) | — | Premium ∆ | Actual Premium Captured | 🔢 Exit - Entry premium |
| 52 | — | — | — | — (calculated) | — | Trade No | Trade No | 🔢 Chronological number |

---

## 🎲 Trading Phases Settings

### **Trading Phase Configuration (Settings → Trading Phases)**

Trading Phases are the foundation of risk management in the app. Each phase represents a distinct trading campaign with specific rules and capital allocation.

### **Trading Phase Fields:**

| # | Field Label (Settings Form) | Field Name (Interface) | Data Type | CSV Column | Purpose |
|---|---|---|---|---|---|
| 1 | Asset Class | `assetClass` | string | Phase Asset Class* | Index, Equity, Commodity |
| 2 | Symbol | `symbol` | string | Phase Symbol* | NIFTY, BANKNIFTY, etc. |
| 3 | Instrument | `instrument` | string | Phase Instrument* | Options, Futures, Cash |
| 4 | Phase Type | `phaseType` | string | Phase Type | Paper, Live, or custom |
| 5 | Phase Number | `phaseNumber` | number | Phase Number | Sequential phase number |
| 6 | Starting Capital | `startingCapital` | number | **Phase Starting Capital** ⭐ NEW | Initial capital for phase |
| 7 | Ending Capital | `endingCapital` | number | **Phase Ending Capital** ⭐ NEW | Final capital (when phase ends) |
| 8 | Max Lot Size | `maxLotSize` | number | **Allowed Lot Size (Max)** ⭐ | Max lots per trade |
| 9 | Per Trade Loss (Points) | `perTradeLossPoints` | number | **Phase Per Trade Loss Points** ⭐ NEW | Max points loss per trade |
| 10 | Per Trade Loss (Rupees) | `perTradeLossRupees` | number | **Phase Per Trade Loss Rupees** ⭐ NEW | Max rupee loss per trade |
| 11 | Max Daily Loss | `maxDailyLoss` | number | **Phase Max Daily Loss** ⭐ NEW | Max loss allowed in one day |
| 12 | Start Date | `startDate` | string | **Phase Start Date** ⭐ NEW | When phase began |
| 13 | End Date | `endDate` | string | **Phase End Date** ⭐ NEW | When phase ended (optional) |
| 14 | Phase ID | `id` | string | Phase ID | Auto-generated unique ID |

*Note: Asset Class, Symbol, and Instrument from Phase are copied to each Trade created during that phase*

⭐ = **NEW**: Now included in CSV export (8 additional phase-related columns)

### **How to Set Up Trading Phases:**

1. **Settings Page** (`/settings` → Trading Phases):
   - User creates phases with `maxLotSize`, `startingCapital`, `phaseType`, etc.
   - Each phase gets unique `id`
   - Stored in: `localStorage['settings']` → `tradingPhases[]`

2. **Trade Journal** (`/journal`):
   - "Phase" dropdown shows all available phases
   - User selects a phase (e.g., "Phase 1 - Paper Trading")
   - Selected `phase.id` is saved to `trade.phase`
   - `phase.maxLotSize` is copied to `trade.allowedLotSize`

3. **Trade History** (`/history`):
   - Reads `trade.phase` (ID)
   - Looks up phase details from `settings.tradingPhases`
   - Displays: Phase Number, Phase Type, Max Lot Size, Starting Capital
   - Shows discipline check: `lotSize` vs `allowedLotSize`

4. **CSV Export** (`/history` → Export to CSV):
   - All 8 phase-related fields are exported
   - Allows analysis of performance across different phases
   - Track capital growth/loss per phase

### **Phase-Related Fields in Trade:**

| Field | Source | Purpose |
|---|---|---|
| `trade.phase` | Selected phase ID | Links trade to trading phase |
| `trade.allowedLotSize` | Copied from `phase.maxLotSize` | Max lot size at time of trade |
| `trade.assetClass` | Auto-populated from phase | Index/Equity/Commodity |
| `trade.symbol` | Selected from phase's symbol | NIFTY, BANKNIFTY, etc. |
| `trade.instrument` | Auto-populated from symbol | NIFTY50, BANKNIFTY, etc. |

### **Example Trading Phase:**

```json
{
  "id": "IN-NF-OP-PA-001",
  "assetClass": "Index",
  "symbol": "NIFTY",
  "instrument": "Options",
  "phaseType": "Paper",
  "phaseNumber": 1,
  "startingCapital": 100000,
  "endingCapital": 125000,
  "maxLotSize": 3,
  "perTradeLossPoints": 20,
  "perTradeLossRupees": 2000,
  "maxDailyLoss": 5000,
  "startDate": "2026-01-01",
  "endDate": "2026-03-31"
}
```

---

## 🎲 Lot Size & Quantity System

### **Three-Level Position Sizing Hierarchy:**

```
┌─────────────────────────────────────────────────────────────────┐
│                 1️⃣ TRADING PHASE SETTINGS                        │
│                 (Settings → Trading Phases)                      │
│                                                                  │
│  Field: maxLotSize (e.g., 3)                                    │
│  Copied to trade as: allowedLotSize                             │
│  Meaning: Maximum lot size allowed per phase rules              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 2️⃣ PLANNING SECTION (Pre-Trade)                  │
│                 (Trade Journal → Planning Tab)                   │
│                                                                  │
│  Fields:                                                         │
│  - planLotSize: 2         (What you PLAN to trade)             │
│  - planQuantity: 130      (Auto = planLotSize × 65 for NIFTY)  │
│  - planAction: "buy"      (Planned direction)                   │
│                                                                  │
│  Meaning: Your intended position size BEFORE execution          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 3️⃣ EXECUTION SECTION (Actual Trade)              │
│                 (Trade Journal → Execution Tab)                  │
│                                                                  │
│  Fields:                                                         │
│  - lotSize: 4             (What you ACTUALLY traded)            │
│  - quantity: 260          (Actual quantity executed)            │
│  - action: "buy"          (Actual direction)                    │
│                                                                  │
│  Meaning: Your real executed position size                      │
└─────────────────────────────────────────────────────────────────┘
```

### **Discipline Checking Logic:**

#### **Check #1: Plan vs Actual**
```javascript
if (lotSize !== planLotSize) {
  // Deviated from plan
  if (lotSize > planLotSize) {
    // Badge: "Overtraded" (Red)
  } else {
    // Badge: "Undertraded" (Amber)
  }
} else {
  // Badge: "✓ Followed Plan" (Green)
}
```

#### **Check #2: Allowed vs Actual (Rule Compliance)**
```javascript
if (lotSize > allowedLotSize) {
  // Badge: "⚠️ Rule Violation" (Red)
  // Indicates overtrading beyond phase limits
} else {
  // Badge: "✓ Within Limits" (Green)
}
```

### **Quantity Calculation:**
```javascript
// For NIFTY:
quantity = lotSize × 65

// For other symbols:
quantity = lotSize × (symbol-specific lot size)
```

---

## 🎯 Trading Phase Integration

### **How Phases Connect to Trades:**

1. **Settings Page** (`/settings` → Trading Phases):
   - User creates phases with `maxLotSize`, `initialCapital`, `phaseType`, etc.
   - Each phase gets unique `id`
   - Stored in: `localStorage['settings']` → `tradingPhases[]`

2. **Trade Journal** (`/journal`):
   - "Phase" dropdown shows all available phases
   - User selects a phase (e.g., "Phase 1 - Paper Trading")
   - Selected `phase.id` is saved to `trade.phase`
   - `phase.maxLotSize` is copied to `trade.allowedLotSize`

3. **Trade History** (`/history`):
   - Reads `trade.phase` (ID)
   - Looks up phase details from `settings.tradingPhases`
   - Displays: Phase Number, Phase Type, Max Lot Size, Initial Capital
   - Shows discipline check: `lotSize` vs `allowedLotSize`

### **Phase-Related Fields in Trade:**

| Field | Source | Purpose |
|---|---|---|
| `trade.phase` | Selected phase ID | Links trade to trading phase |
| `trade.allowedLotSize` | Copied from `phase.maxLotSize` | Max lot size at time of trade |
| `trade.assetClass` | Auto-populated from phase | Index/Equity/Commodity |
| `trade.symbol` | Selected from phase's symbol | NIFTY, BANKNIFTY, etc. |
| `trade.instrument` | Auto-populated from symbol | NIFTY50, BANKNIFTY, etc. |

---

## 🧮 Calculations & Formulas

### **1. P&L Calculation:**
```javascript
// Formula:
pnl = (exitPremium - entryPremium) × quantity × lotSize

// For BUY:
pnl = (exitPremium - entryPremium) × quantity

// For SELL:
pnl = (entryPremium - exitPremium) × quantity

// Examples:
// BUY: Entry 100, Exit 120, Qty 130 → (120-100) × 130 = ₹2,600
// SELL: Entry 100, Exit 80, Qty 130 → (100-80) × 130 = ₹2,600
```

### **2. Premium Captured:**
```javascript
// Actual points captured:
premiumCaptured = action === 'buy' 
  ? exitPremium - entryPremium 
  : entryPremium - exitPremium

// Example:
// BUY: Entry 100, Exit 120 → +20 points
// SELL: Entry 100, Exit 80 → +20 points
```

### **3. Duration (Minutes):**
```javascript
// Convert times to 24-hour format, then:
durationMinutes = (exitHour × 60 + exitMin) - (entryHour × 60 + entryMin)

// Example:
// Entry: 10:15 AM → 10×60+15 = 615 minutes
// Exit: 2:30 PM → 14×60+30 = 870 minutes
// Duration: 870-615 = 255 minutes = 4h 15m
```

### **4. Moneyness (ITM/ATM/OTM):**
```javascript
// For NIFTY (strike interval = 50):
diff = strikePrice - spotPrice
strikeCount = Math.abs(Math.round(diff / 50))

// If within ±25: ATM
// For CALL:
//   If diff > 0: OTM
//   If diff < 0: ITM
// For PUT:
//   If diff > 0: ITM
//   If diff < 0: OTM

// Example:
// Spot: 21,500, Strike: 21,600, Type: CALL
// diff = 100, strikeCount = 2
// Result: "2 OTM"
```

### **5. Risk:Reward Ratio:**
```javascript
// Planned R:R (shown in History expanded view):
risk = planEntryPrice - planStopLoss
reward = planExitPrice - planEntryPrice
riskRewardRatio = reward / risk

// Example:
// Entry: 100, Target: 130, SL: 90
// Risk: 100-90 = 10
// Reward: 130-100 = 30
// R:R = 30/10 = 3 (shown as "1:3.00")
```

### **6. Total Invested:**
```javascript
// Auto-calculated when entering trade:
totalInvested = entryPremium × quantity

// Example:
// Entry Premium: 100, Quantity: 130
// Total Invested: ₹13,000
```

---

## 💾 Storage Structure

### **localStorage Keys:**

| Key | Data Type | Structure | Purpose |
|---|---|---|---|
| `nifty-trades` | Trade[] | Array of Trade objects | All trade records |
| `settings` | Settings | Object with nested properties | User preferences, trading phases, etc. |

### **Trade Object Example (JSON):**
```json
{
  "id": "trade-1711123456789-abc123",
  "timestamp": "2026-03-15T00:00:00.000Z",
  "day": "Monday",
  "entryTime": "10:15 AM",
  "exitTime": "2:30 PM",
  "exitDate": "2026-03-15",
  "assetClass": "Index",
  "symbol": "NIFTY",
  "instrument": "NIFTY50",
  "optionType": "call",
  "strikePrice": 21600,
  "expiryDate": "2026-03-27",
  "action": "buy",
  "quantity": 260,
  "lotSize": 4,
  "planLotSize": 2,
  "planQuantity": 130,
  "planAction": "buy",
  "planEntryPrice": 100,
  "planExitPrice": 130,
  "planStopLoss": 90,
  "entryPremium": 105,
  "exitPremium": 125,
  "symbolPrice": 21500,
  "totalInvested": 27300,
  "pnl": 5200,
  "phase": "phase-123-abc",
  "allowedLotSize": 3,
  "entryEmotions": "confident",
  "entryEmotionNotes": "Great setup, clear trend",
  "exitEmotions": "satisfied",
  "exitEmotionNotes": "Hit target as planned",
  "setup": "Bullish breakout",
  "isPlanned": true,
  "notes": "Followed plan perfectly"
}
```

---

## 📥 CSV Export Columns

### **Full Export Column List (59 columns):**

1. Trade No
2. Entry Date
3. Day
4. Entry Time
5. Exit Time
6. Duration (minutes)
7. Asset Class
8. Symbol
9. Instrument
10. Option Type
11. Strike Price
12. Expiry Date
13. Action
14. Quantity
15. Lot Size
16. **Plan Lot Size** ⭐ NEW
17. **Plan Quantity** ⭐ NEW
18. **Plan Action** ⭐ NEW
19. Phase Number
20. Phase Type
21. Phase ID
22. **Phase Starting Capital** ⭐ NEW
23. **Phase Ending Capital** ⭐ NEW
24. Allowed Lot Size (Max)
25. **Phase Per Trade Loss Points** ⭐ NEW
26. **Phase Per Trade Loss Rupees** ⭐ NEW
27. **Phase Max Daily Loss** ⭐ NEW
28. **Phase Start Date** ⭐ NEW
29. **Phase End Date** ⭐ NEW
30. Entry Premium
31. Exit Premium
32. Actual Premium Captured
33. Exit Date
34. Total Invested
35. P&L
36. Status (OPEN/WIN/LOSS)
37. Setup
38. Planned (Yes/No)
39. Planned Entry Premium
40. Planned Target Premium
41. Planned SL Premium
42. Entry Emotion
43. Entry Emotion Notes
44. In-Trade Emotion
45. In-Trade Emotion Notes
46. Exit Emotion
47. Exit Emotion Notes
48. Post-Exit Emotion
49. Post-Exit Emotion Notes
50. Exit Reason
51. Early Exit (Yes/No)
52. Modified SL (Yes/No)
53. Modified SL Reason
54. Symbol Price (Spot)
55. Moneyness
56. Entry Order Type
57. Exit Order Type
58. Notes

⭐ = **11 NEW columns added** (3 plan fields + 8 phase fields)

### **How to Use CSV for Analysis:**

#### **Excel Formulas for Discipline Tracking:**

```excel
// Column: Plan Adherence
=IF(O2=P2, "Followed Plan", 
   IF(P2>O2, "Overtraded", "Undertraded"))
// Where O=Plan Lot Size, P=Lot Size

// Column: Rule Compliance
=IF(P2>V2, "VIOLATION", "OK")
// Where P=Lot Size, V=Allowed Lot Size

// Column: Overtrading Count
=COUNTIF(P:P,">"&O:O)
// Counts how many times you overtraded vs plan

// Column: Win Rate by Emotion
=COUNTIFS(AI:AI,"confident",AC:AC,">=0")/COUNTIF(AI:AI,"confident")
// Where AI=Entry Emotion, AC=P&L
```

---

## ✅ Validation & Data Integrity

### **Required Fields (Cannot save without):**
- Date, Day, Entry Time
- Asset Class, Symbol, Instrument
- Option Type, Strike Price, Expiry Date
- Action, Quantity, Lot Size
- Entry Premium

### **Auto-Populated Fields:**
- `id` → Generated on save
- `timestamp` → From date field
- `instrument` → Based on symbol selection
- `allowedLotSize` → From selected trading phase
- `quantity` → Auto-calculated for NIFTY (lotSize × 65)
- `totalInvested` → entryPremium × quantity

### **Calculated on Display:**
- `pnl` → Only if exitPremium exists
- Trade Number → Chronological order
- Moneyness → Requires symbolPrice
- Duration → Requires entryTime & exitTime

---

## 🔍 Quick Reference: Finding Data

| I want to... | Look here |
|---|---|
| See form field labels | `TradeJournal.tsx` lines 600-1800 |
| See form input names | `TradeJournal.tsx` lines 50-90 (interface TradeFormData) |
| See storage structure | `useTrades.ts` lines 4-51 (interface Trade) |
| See conversion logic | `TradeJournal.tsx` lines 420-460 (handleSubmit function) |
| See calculations | `TradeHistory.tsx` calculatePnL, calculateMoneyness, etc. |
| See CSV export columns | `TradeHistory.tsx` lines 301-342 (exportToCSV headers) |
| See phase integration | `TradeJournal.tsx` line 346 (phase dropdown), line 438 (allowedLotSize) |

---

## 🎓 Common Questions

### Q1: Why are planLotSize and planQuantity separate from lotSize and quantity?
**A:** To enable **discipline tracking**. This allows you to:
- Record what you INTENDED to do (plan)
- Record what you ACTUALLY did (execution)
- Compare them to identify FOMO, revenge trading, or lack of discipline

### Q2: What's the difference between lotSize and allowedLotSize?
**A:**
- `allowedLotSize` = Phase rule (max you SHOULD trade)
- `lotSize` = What you ACTUALLY traded
- If `lotSize > allowedLotSize` → You broke your own rules ⚠️

### Q3: Where does allowedLotSize come from?
**A:** It's copied from the Trading Phase's `maxLotSize` when you select a phase in the trade journal form.

### Q4: Can I change allowedLotSize for a specific trade?
**A:** No. It's auto-populated from phase settings to ensure consistency. To change it, edit the Trading Phase in Settings.

### Q5: How do I analyze my discipline?
**A:** Export to CSV and use these Excel formulas:
```excel
// % of trades that followed plan:
=COUNTIF(P:P,O:O)/COUNTA(P:P)

// % of trades that violated phase rules:
=COUNTIF(P:P,">"&V:V)/COUNTA(P:P)
```

---

## 📌 Key Takeaways

1. **Three-level lot size system:**
   - `allowedLotSize` (phase limit)
   - `planLotSize` (what you planned)
   - `lotSize` (what you did)

2. **Data flows in one direction:**
   - Form → Conversion → Storage → Display → Export

3. **All numeric fields are strings in the form, numbers in storage**

4. **Phase settings are copied to trades at creation time** (snapshot)

5. **CSV export includes ALL fields** for complete analysis in Excel/Google Sheets

---

**End of Document** | Version 1.0 | Last Updated: March 23, 2026