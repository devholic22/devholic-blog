'use client';

import { useDarkMode } from '@/hooks/useDarkMode';

export function DarkModeToggle() {
  const { isDark, toggle, mounted } = useDarkMode();

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      style={styles.button}
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

const styles = {
  button: {
    background: 'transparent',
    border: '1px solid var(--border)',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};
