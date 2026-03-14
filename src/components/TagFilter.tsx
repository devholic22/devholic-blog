'use client';

export function TagFilter({
  tags,
  activeTag,
  onTagChange,
}: {
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}) {
  if (tags.length === 0) return null;

  return (
    <div style={styles.container}>
      <button
        onClick={() => onTagChange(null)}
        style={{
          ...styles.tagButton,
          ...(activeTag === null ? styles.activeTag : {}),
        }}
      >
        All Posts
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagChange(activeTag === tag ? null : tag)}
          style={{
            ...styles.tagButton,
            ...(activeTag === tag ? styles.activeTag : {}),
          }}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginBottom: '2rem',
  },
  tagButton: {
    padding: '0.5rem 1rem',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    backgroundColor: 'transparent',
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTag: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: '1px solid var(--accent)',
  },
};
