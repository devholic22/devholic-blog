'use client';

export function EditorToolbar({
  onSave,
  isSaving,
  buttonText = 'Save Post',
}: {
  onSave: () => void;
  isSaving: boolean;
  buttonText?: string;
}) {
  return (
    <div style={styles.toolbar}>
      <button onClick={onSave} disabled={isSaving} style={styles.saveButton}>
        {isSaving ? 'Saving...' : buttonText}
      </button>
    </div>
  );
}

const styles = {
  toolbar: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--code-bg)',
    borderRadius: '4px 4px 0 0',
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
  },
};
