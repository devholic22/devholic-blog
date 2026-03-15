'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useEffect, useState, useRef } from 'react';

// Global translation cache shared across all TranslatedText instances
const translationCache: Record<string, Record<string, string>> = {};

function getCacheKey(text: string, lang: string) {
  return `${lang}:${text}`;
}

export function TranslatedText({
  text,
  as: Tag = 'span',
  style,
  className,
  children,
}: {
  text: string;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  const { language, mounted } = useLanguage();
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!mounted || language === 'ko') {
      setTranslated(text);
      return;
    }

    const cached = translationCache[language]?.[text];
    if (cached) {
      setTranslated(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: language }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.translated) {
          if (!translationCache[language]) translationCache[language] = {};
          translationCache[language][text] = data.translated;
          setTranslated(data.translated);
        }
      })
      .catch(() => {
        if (!cancelled) setTranslated(text);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [language, text, mounted]);

  if (children) {
    return <Tag style={style} className={className}>{children}</Tag>;
  }

  return (
    <Tag
      style={{ ...style, opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}
      className={className}
    >
      {translated}
    </Tag>
  );
}

// Hook version for cases where you need the translated value directly
export function useTranslatedText(text: string): { translated: string; loading: boolean } {
  const { language, mounted } = useLanguage();
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mounted || language === 'ko') {
      setTranslated(text);
      return;
    }

    const cached = translationCache[language]?.[text];
    if (cached) {
      setTranslated(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: language }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.translated) {
          if (!translationCache[language]) translationCache[language] = {};
          translationCache[language][text] = data.translated;
          setTranslated(data.translated);
        }
      })
      .catch(() => {
        if (!cancelled) setTranslated(text);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [language, text, mounted]);

  return { translated, loading };
}
