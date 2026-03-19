import React from 'react';
import { useLocation } from 'react-router-dom';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Button } from './ui/button';
import { Keyboard } from 'lucide-react';
import { MONITOR_EMBED_QUERY_KEY, MONITOR_EMBED_QUERY_VALUE } from '../constants/navigation';

interface ShortcutProviderProps {
  children: React.ReactNode;
}

/**
 * A component that provides keyboard shortcuts to the application
 * and shows a help button in the top corner
 */
const ShortcutProvider = ({ children }: ShortcutProviderProps) => {
  const location = useLocation();
  const { showShortcutsHelp } = useKeyboardShortcuts();
  const isMonitorEmbed =
    new URLSearchParams(location.search).get(MONITOR_EMBED_QUERY_KEY) === MONITOR_EMBED_QUERY_VALUE;

  return (
    <>
      {children}
      
      {/* Floating help button - hidden on mobile since phones can't use keyboard shortcuts */}
      {!isMonitorEmbed && (
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex fixed top-16 right-4 bg-terminal-dim/90 text-terminal-text border-terminal-accent z-50 items-center gap-1 shadow-md text-sm"
          onClick={showShortcutsHelp}
        >
          <Keyboard className="h-4 w-4" />
          <span>Shortcuts</span>
        </Button>
      )}
    </>
  );
};

export default ShortcutProvider;
