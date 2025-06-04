import { useEffect, useCallback } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  const handleKeyDown = useCallback((event) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modifierKey = ctrlKey || metaKey;

    for (const [combination, callback] of Object.entries(shortcuts)) {
      const parts = combination.toLowerCase().split('+');
      const keyPart = parts[parts.length - 1];
      const hasCtrl = parts.includes('ctrl') || parts.includes('cmd');
      const hasShift = parts.includes('shift');
      const hasAlt = parts.includes('alt');

      if (
        key.toLowerCase() === keyPart &&
        hasCtrl === modifierKey &&
        hasShift === shiftKey &&
        hasAlt === altKey
      ) {
        event.preventDefault();
        callback();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}