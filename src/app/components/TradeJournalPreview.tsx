import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "./ui/button";

type ColorScheme = "silver" | "blue" | "graphite" | "natural" | "dark";

const colorSchemes = {
  silver: {
    name: "Silver Elegance",
    description: "Classic Apple white and silver tones",
    classes: {
      bg: "bg-gray-50",
      header: "bg-white border-gray-100",
      card: "bg-white border-gray-200",
      section: "bg-gray-50 border-gray-200",
      plan: "bg-blue-50 border-blue-200",
      text: "text-gray-900",
      textMuted: "text-gray-600",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      input: "border-gray-300 focus:border-blue-500",
    }
  },
  blue: {
    name: "Ocean Blue",
    description: "Inspired by macOS Big Sur blues",
    classes: {
      bg: "bg-blue-50",
      header: "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400",
      card: "bg-white border-blue-200",
      section: "bg-blue-50/50 border-blue-200",
      plan: "bg-blue-100 border-blue-300",
      text: "text-gray-900",
      textMuted: "text-gray-700",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      input: "border-blue-300 focus:border-blue-500",
    }
  },
  graphite: {
    name: "Space Graphite",
    description: "Dark and sophisticated like Space Gray",
    classes: {
      bg: "bg-slate-900",
      header: "bg-slate-800 border-slate-700",
      card: "bg-slate-800 border-slate-700",
      section: "bg-slate-900/50 border-slate-700",
      plan: "bg-blue-900/30 border-blue-800",
      text: "text-white",
      textMuted: "text-slate-300",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      input: "border-slate-600 focus:border-blue-500 bg-slate-700 text-white",
    }
  },
  natural: {
    name: "Natural Linen",
    description: "Warm beige tones like Apple's natural materials",
    classes: {
      bg: "bg-amber-50",
      header: "bg-white border-amber-200",
      card: "bg-white border-amber-200",
      section: "bg-amber-50/50 border-amber-200",
      plan: "bg-blue-50 border-blue-200",
      text: "text-amber-950",
      textMuted: "text-amber-800",
      button: "bg-amber-700 hover:bg-amber-800 text-white",
      input: "border-amber-300 focus:border-amber-500",
    }
  },
  dark: {
    name: "Pure Dark Mode",
    description: "True black background for OLED displays",
    classes: {
      bg: "bg-black",
      header: "bg-zinc-900 border-zinc-800",
      card: "bg-zinc-900 border-zinc-800",
      section: "bg-zinc-950 border-zinc-800",
      plan: "bg-blue-950/50 border-blue-900",
      text: "text-white",
      textMuted: "text-zinc-400",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      input: "border-zinc-700 focus:border-blue-500 bg-zinc-800 text-white",
    }
  }
};

export function TradeJournalPreview() {
  const [selected, setSelected] = useState<ColorScheme>("silver");

  const scheme = colorSchemes[selected];

  return (
    <div className={`min-h-screen ${scheme.classes.bg} transition-colors duration-300`}>
      {/* Color Scheme Selector */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-2xl shadow-2xl p-4 max-w-xs">
        <h3 className="font-semibold text-sm text-gray-900 mb-3">Choose Your Style</h3>
        <div className="space-y-2">
          {(Object.keys(colorSchemes) as ColorScheme[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`w-full text-left p-3 rounded-xl transition-all ${
                selected === key
                  ? "bg-blue-50 border-2 border-blue-500"
                  : "bg-gray-50 border-2 border-transparent hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {colorSchemes[key].name}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {colorSchemes[key].description}
                  </div>
                </div>
                {selected === key && (
                  <Check className="size-5 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
        <Link to="/journal">
          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            Apply & Continue
          </Button>
        </Link>
      </div>

      {/* Preview Header */}
      <header className={`border-b ${scheme.classes.header} transition-colors duration-300`}>
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${scheme.classes.textMuted}`}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </Link>
            <h1 className={`text-lg font-semibold ${scheme.classes.text}`}>
              New Trade Entry
            </h1>
          </div>
        </div>
      </header>

      {/* Preview Content */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-4 sm:py-8">
        <div className={`border rounded-2xl p-4 sm:p-6 shadow-sm ${scheme.classes.card} transition-colors duration-300`}>
          <div className="mb-6 pb-4 border-b" style={{ borderColor: 'currentColor', opacity: 0.1 }}>
            <h2 className={`text-base font-semibold ${scheme.classes.text}`}>
              Trade Details Preview
            </h2>
            <p className={`text-sm mt-1 ${scheme.classes.textMuted}`}>
              This is how your trade journal will look
            </p>
          </div>

          <div className="space-y-6">
            {/* Sample Section */}
            <div className={`border rounded-xl p-4 ${scheme.classes.section} transition-colors duration-300`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${scheme.classes.textMuted}`}>
                    Date
                  </label>
                  <div className={`h-11 px-3 rounded-lg border flex items-center ${scheme.classes.input} transition-colors duration-300`}>
                    <span className={`text-sm ${scheme.classes.text}`}>2024-02-22</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${scheme.classes.textMuted}`}>
                    Symbol
                  </label>
                  <div className={`h-11 px-3 rounded-lg border flex items-center ${scheme.classes.input} transition-colors duration-300`}>
                    <span className={`text-sm font-semibold ${scheme.classes.text}`}>NIFTY</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${scheme.classes.textMuted}`}>
                    Strike Price
                  </label>
                  <div className={`h-11 px-3 rounded-lg border flex items-center ${scheme.classes.input} transition-colors duration-300`}>
                    <span className={`text-sm font-mono ${scheme.classes.text}`}>24500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Section Preview */}
            <div className={`border rounded-xl p-4 ${scheme.classes.plan} transition-colors duration-300`}>
              <h3 className={`text-sm font-semibold mb-3 ${scheme.classes.text}`}>
                Plan Section
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${scheme.classes.textMuted}`}>
                    Entry Price
                  </label>
                  <div className={`h-11 px-3 rounded-lg border flex items-center bg-white ${scheme.classes.input} transition-colors duration-300`}>
                    <span className={`text-sm font-mono ${scheme.classes.text}`}>150.00</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${scheme.classes.textMuted}`}>
                    Exit Price
                  </label>
                  <div className={`h-11 px-3 rounded-lg border flex items-center bg-white ${scheme.classes.input} transition-colors duration-300`}>
                    <span className={`text-sm font-mono ${scheme.classes.text}`}>175.00</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${scheme.classes.textMuted}`}>
                    Stop Loss
                  </label>
                  <div className={`h-11 px-3 rounded-lg border flex items-center bg-white ${scheme.classes.input} transition-colors duration-300`}>
                    <span className={`text-sm font-mono ${scheme.classes.text}`}>140.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Button Preview */}
            <div className="pt-4 border-t" style={{ borderColor: 'currentColor', opacity: 0.1 }}>
              <button 
                className={`w-full h-11 rounded-lg font-medium transition-colors ${scheme.classes.button}`}
              >
                Save Trade
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}