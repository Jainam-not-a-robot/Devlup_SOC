import { useEffect } from 'react';
import { getTheme, themes } from '@/config/themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    const themeId = getTheme();
    const theme = themes[themeId];
    
    // Apply CSS variables to root
    const root = document.documentElement;
    
    // Terminal colors
    root.style.setProperty('--terminal', theme.terminal);
    root.style.setProperty('--terminal-text', theme.terminalText);
    root.style.setProperty('--terminal-dim', theme.terminalDim);
    root.style.setProperty('--terminal-accent', theme.terminalAccent);
    root.style.setProperty('--terminal-error', theme.terminalError);
    root.style.setProperty('--terminal-warning', theme.terminalWarning);
    root.style.setProperty('--terminal-success', theme.terminalSuccess);
    
    // Background gradients
    root.style.setProperty('--bg-gradient-start', theme.bgGradientStart);
    root.style.setProperty('--bg-gradient-mid1', theme.bgGradientMid1);
    root.style.setProperty('--bg-gradient-mid2', theme.bgGradientMid2);
    root.style.setProperty('--bg-gradient-mid3', theme.bgGradientMid3);
    root.style.setProperty('--bg-gradient-end', theme.bgGradientEnd);
    
    // Terminal window
    root.style.setProperty('--terminal-window-bg', theme.terminalWindowBg);
    root.style.setProperty('--terminal-window-border', theme.terminalWindowBorder);
    root.style.setProperty('--terminal-window-shadow', theme.terminalWindowShadow);
    
    // Terminal header
    root.style.setProperty('--terminal-header-bg', theme.terminalHeaderBg);
    root.style.setProperty('--terminal-header-bg-gradient', theme.terminalHeaderBgGradient);
    root.style.setProperty('--terminal-header-border', theme.terminalHeaderBorder);
    
    // Accent colors
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-hover', theme.accentHover);
    root.style.setProperty('--accent-glow', theme.accentGlow);
    root.style.setProperty('--accent-glow-30', theme.accentGlow30);
    root.style.setProperty('--accent-glow-80', theme.accentGlow80);
    root.style.setProperty('--accent-hover-glow-60', theme.accentHoverGlow60);
    
    // Shadow variants
    root.style.setProperty('--window-shadow-15', theme.windowShadow15);
    root.style.setProperty('--window-shadow-5', theme.windowShadow5);
  }, []);

  return <>{children}</>;
};

// Export a hook to get the current theme
export const useTheme = () => {
  const themeId = getTheme();
  return {
    themeId,
    theme: themes[themeId],
    showSnow: themes[themeId].showSnow,
  };
};

