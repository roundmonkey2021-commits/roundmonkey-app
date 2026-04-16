import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Toaster } from "./ui/sonner";
import { useSettings } from "../hooks/useSettings";
import { useRoutines } from "../hooks/useRoutines";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const loadSettings = useSettings((state) => state.loadSettings);
  const loadRoutines = useRoutines((state) => state.loadRoutines);

  // Load settings and routines on app startup
  useEffect(() => {
    loadSettings();
    loadRoutines();
  }, [loadSettings, loadRoutines]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Toast Notifications */}
      <Toaster />
      
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white dark:bg-zinc-900 shadow-lg border border-neutral-200 dark:border-zinc-800"
      >
        {isMobileMenuOpen ? (
          <X className="size-5" />
        ) : (
          <Menu className="size-5" />
        )}
      </Button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}