'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '@/context/LanguageContext';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ko', label: 'KR' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: 'JP' },
];

export function LanguageSelector() {
  const { language, setLanguage, mounted } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) return null;

  const current = LANGUAGES.find((l) => l.code === language);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={styles.button}
        aria-label="Select language"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '4px', verticalAlign: 'middle' }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{current?.label}</span>
      </button>

      {open && (
        <div style={styles.dropdown}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              style={{
                ...styles.dropdownItem,
                backgroundColor: language === lang.code ? 'var(--code-bg)' : 'transparent',
                fontWeight: language === lang.code ? 600 : 400,
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
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
    color: 'var(--text)',
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  dropdown: {
    position: 'absolute' as const,
    top: 'calc(100% + 4px)',
    right: 0,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    overflow: 'hidden',
    zIndex: 200,
    minWidth: '60px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textAlign: 'left' as const,
    borderRadius: 0,
  },
};
