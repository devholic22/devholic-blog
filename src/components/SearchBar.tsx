'use client';

export function SearchBar({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <input
      type="text"
      placeholder="Search posts..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      style={styles.input}
    />
  );
}

const styles = {
  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    marginBottom: '1.5rem',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  },
};
