import { useState } from "react";

export function useTheme() {
  // Always return light mode, but keep hooks for consistency
  const [isDark] = useState<boolean>(false);
  const theme = 'light';
  const toggleTheme = () => {}; // No-op function for compatibility

  return { isDark, toggleTheme, theme };
}
