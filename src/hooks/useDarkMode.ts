'use client';

import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const html = document.documentElement;
    const theme = localStorage.getItem('theme') || 'light';

    if (theme === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.setAttribute('data-theme', 'dark');
      setIsDark(true);
    } else {
      html.setAttribute('data-theme', 'light');
      setIsDark(false);
    }
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setIsDark(!isDark);
  };

  return { isDark, toggle, mounted };
}
