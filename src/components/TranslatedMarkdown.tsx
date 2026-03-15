'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, useRef } from 'react';

export function TranslatedMarkdown({ html }: { html: string }) {
  const { language, mounted } = useLanguage();
  const [translatedHtml, setTranslatedHtml] = useState(html);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, string>>({ ko: html });

  useEffect(() => {
    if (!mounted) return;

    // Korean is the original language — no translation needed
    if (language === 'ko') {
      setTranslatedHtml(html);
      return;
    }

    // Check cache
    if (cacheRef.current[language]) {
      setTranslatedHtml(cacheRef.current[language]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: html, targetLang: language }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.translated) {
          cacheRef.current[language] = data.translated;
          setTranslatedHtml(data.translated);
        }
      })
      .catch(() => {
        // On error, show original
        if (!cancelled) setTranslatedHtml(html);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language, html, mounted]);

  return (
    <div style={{ position: 'relative' }}>
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner} />
          <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: 'var(--text)', opacity: 0.7 }}>
            Translating...
          </span>
        </div>
      )}
      <div
        dangerouslySetInnerHTML={{ __html: translatedHtml }}
        style={{
          lineHeight: '1.7',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          opacity: loading ? 0.4 : 1,
          transition: 'opacity 0.2s',
        }}
      />
    </div>
  );
}

const styles = {
  loadingOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem 0',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid var(--border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
  },
};
