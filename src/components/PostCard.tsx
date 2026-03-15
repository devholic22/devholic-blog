'use client';

import Link from 'next/link';
import { Post } from '@/lib/types';
import { TranslatedText } from './TranslatedText';

export function PostCard({ post }: { post: Post }) {
  const { slug, title, date, description, tags } = post;

  return (
    <article style={styles.card}>
      <Link href={`/posts/${slug}`} style={styles.titleLink}>
        <h2 style={styles.title}>
          <TranslatedText text={title} />
        </h2>
      </Link>
      <p style={styles.date}>
        {new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      {description && (
        <p style={styles.description}>
          <TranslatedText text={description} />
        </p>
      )}
      {tags && tags.length > 0 && (
        <div style={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} style={styles.tag}>
              #<TranslatedText text={tag} />
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

const styles = {
  card: {
    padding: '1.5rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    transition: 'box-shadow 0.2s',
  },
  titleLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  title: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    color: 'var(--text)',
  },
  date: {
    fontSize: '0.9rem',
    color: 'var(--text)',
    opacity: 0.7,
    margin: '0 0 0.5rem 0',
  },
  description: {
    margin: '0.5rem 0',
    color: 'var(--text)',
  },
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginTop: '0.5rem',
  },
  tag: {
    fontSize: '0.85rem',
    color: 'var(--accent)',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'var(--code-bg)',
    borderRadius: '4px',
  },
};
