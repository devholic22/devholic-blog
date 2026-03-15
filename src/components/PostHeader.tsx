'use client';

import { TranslatedText } from './TranslatedText';
import { Post } from '@/lib/types';

export function PostHeader({ post }: { post: Post }) {
  return (
    <>
      <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <TranslatedText text={post.title} />
      </h1>

      {/* Metadata Section */}
      <div style={styles.metadata}>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>Published</span>
          <span style={styles.metaValue}>
            {new Date(post.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {post.author && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Author</span>
            <span style={styles.metaValue}>
              <TranslatedText text={post.author} />
            </span>
          </div>
        )}

        {post.source && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Source</span>
            <a
              href={post.source}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.metaValue, color: 'var(--accent)', cursor: 'pointer' }}
            >
              {post.source}
            </a>
          </div>
        )}

        {post.description && (
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Description</span>
            <span style={styles.metaValue}>
              <TranslatedText text={post.description} />
            </span>
          </div>
        )}

        {/* Additional custom fields */}
        {Object.entries(post).map(([key, value]) => {
          if (
            !['slug', 'content', 'html', 'title', 'date', 'tags', 'description', 'source', 'author'].includes(key) &&
            value &&
            typeof value !== 'object'
          ) {
            return (
              <div key={key} style={styles.metaItem}>
                <span style={styles.metaLabel}><TranslatedText text={key} /></span>
                <span style={styles.metaValue}>
                  <TranslatedText text={String(value)} />
                </span>
              </div>
            );
          }
          return null;
        })}
      </div>

      {post.tags && post.tags.length > 0 && (
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.85rem',
                padding: '0.25rem 0.75rem',
                backgroundColor: 'var(--code-bg)',
                borderRadius: '4px',
                color: 'var(--accent)',
              }}
            >
              #<TranslatedText text={tag} />
            </span>
          ))}
        </div>
      )}
    </>
  );
}

const styles = {
  metadata: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: 'var(--code-bg)',
    borderRadius: '8px',
    marginBottom: '2rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  metaLabel: {
    fontWeight: 600,
    color: 'var(--text)',
    fontSize: '0.9rem',
    minWidth: '80px',
  },
  metaValue: {
    color: 'var(--text)',
    opacity: 0.85,
    fontSize: '0.95rem',
  },
};
