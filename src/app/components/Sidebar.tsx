import { Link, useLocation } from "react-router";
import {
  BarChart3,
  FileText,
  History,
  Settings as SettingsIcon,
  Moon,
  Sun,
  TrendingUp,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Heart,
  Shield,
  BookOpen
} from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "../hooks/useTheme";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Dashboard']);

  const isDark = theme === 'dark';

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: BarChart3,
      submenu: [
        { name: 'Performance Metrics', href: '/dashboard/performance-metrics', icon: BarChart3 },
        { name: 'Emotion Overview', href: '/dashboard/emotion-overview', icon: Heart },
        { name: 'Discipline Overview', href: '/dashboard/discipline-overview', icon: Shield }
      ]
    },
    { name: 'Routine Tracker', href: '/routines', icon: CheckSquare },
    { name: 'Daily Journal', href: '/daily-journal', icon: BookOpen },
    { name: 'Trade Journal', href: '/journal', icon: FileText },
    { name: 'History', href: '/history', icon: History },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname.startsWith('/dashboard');
    }
    return location.pathname.startsWith(path);
  };

  const toggleExpand = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <aside className={`
      w-64 h-full flex flex-col flex-shrink-0
      ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-neutral-200'}
      border-r
      fixed lg:sticky lg:top-0 lg:h-screen z-40
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo / Brand */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-neutral-100'}`}>
            <TrendingUp className={`size-6 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`} />
          </div>
          <div>
            <h1 className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
              RMC
            </h1>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-neutral-500'}`}>
              Trading Journal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isExpanded = expandedItems.includes(item.name);
          
          return (
            <div key={item.name}>
              {hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? isDark
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'bg-neutral-100 text-neutral-900'
                        : isDark
                          ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActive(subItem.href);
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              subActive
                                ? isDark
                                  ? 'bg-zinc-800 text-zinc-100'
                                  : 'bg-neutral-100 text-neutral-900'
                                : isDark
                                  ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                            }`}
                          >
                            <SubIcon className="size-4" />
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? isDark
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'bg-neutral-100 text-neutral-900'
                      : isDark
                        ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="size-5" />
                  {item.name}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section - Theme Toggle & User */}
      <div className={`p-4 border-t ${isDark ? 'border-zinc-800' : 'border-neutral-200'} space-y-3`}>
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 px-3"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="size-5" />
              <span className="text-sm">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="size-5" />
              <span className="text-sm">Dark Mode</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}