'use client';

import { PostMeta } from '@/lib/types';
import { useState } from 'react';

const RESERVED_FIELDS = ['slug', 'content', 'html'];

export function FrontmatterForm({
  frontmatter,
  onChange,
}: {
  frontmatter: PostMeta;
  onChange: (frontmatter: PostMeta) => void;
}) {
  const [tagInput, setTagInput] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [customFields, setCustomFields] = useState<string[]>(
    Object.keys(frontmatter).filter(
      (k) =>
        ![
          'title',
          'date',
          'tags',
          'description',
          'source',
          'author',
          ...RESERVED_FIELDS,
        ].includes(k)
    )
  );

  const addTag = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !frontmatter.tags.includes(newTag)) {
      onChange({
        ...frontmatter,
        tags: [...frontmatter.tags, newTag],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange({
      ...frontmatter,
      tags: frontmatter.tags.filter((t) => t !== tag),
    });
  };

  const addCustomField = (key: string, value: string) => {
    if (!key.trim()) {
      return;
    }
    if (
      customFields.includes(key) ||
      RESERVED_FIELDS.includes(key) ||
      [
        'title',
        'date',
        'tags',
        'description',
        'source',
        'author',
      ].includes(key)
    ) {
      alert(
        `"${key}" is a reserved field or already exists. Please use a different name.`
      );
      return;
    }
    setCustomFields([...customFields, key]);
    onChange({ ...frontmatter, [key]: value });
    setNewFieldName('');
    setNewFieldValue('');
  };

  const removeCustomField = (key: string) => {
    setCustomFields(customFields.filter((f) => f !== key));
    const { [key]: _, ...rest } = frontmatter;
    onChange(rest as PostMeta);
  };

  return (
    <div style={styles.container}>
      {/* Title */}
      <div style={styles.row}>
        <label style={styles.label}>
          Title
          <input
            type="text"
            value={frontmatter.title}
            onChange={(e) =>
              onChange({ ...frontmatter, title: e.target.value })
            }
            style={styles.input}
            placeholder="Post title"
          />
        </label>
      </div>

      {/* Date */}
      <div style={styles.row}>
        <label style={styles.label}>
          Date
          <input
            type="date"
            value={frontmatter.date}
            onChange={(e) =>
              onChange({ ...frontmatter, date: e.target.value })
            }
            style={styles.input}
          />
        </label>
      </div>

      {/* Tags */}
      <div style={styles.row}>
        <label style={styles.label}>
          Tags
          <div style={styles.tagsContainer}>
            <div style={styles.tagsList}>
              {frontmatter.tags.map((tag) => (
                <span key={tag} style={styles.tagChip}>
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    style={styles.tagRemoveBtn}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div style={styles.tagInputRow}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                style={styles.tagInput}
                placeholder="Add tag and press Enter"
              />
            </div>
          </div>
        </label>
      </div>

      {/* Description */}
      <div style={styles.row}>
        <label style={styles.label}>
          Description
          <input
            type="text"
            value={frontmatter.description}
            onChange={(e) =>
              onChange({ ...frontmatter, description: e.target.value })
            }
            style={styles.input}
            placeholder="Brief description"
          />
        </label>
      </div>

      {/* Source */}
      <div style={styles.row}>
        <label style={styles.label}>
          Source (URL)
          <input
            type="url"
            value={frontmatter.source || ''}
            onChange={(e) =>
              onChange({ ...frontmatter, source: e.target.value })
            }
            style={styles.input}
            placeholder="https://example.com"
          />
        </label>
      </div>

      {/* Author */}
      <div style={styles.row}>
        <label style={styles.label}>
          Author
          <input
            type="text"
            value={frontmatter.author || ''}
            onChange={(e) =>
              onChange({ ...frontmatter, author: e.target.value })
            }
            style={styles.input}
            placeholder="Author name"
          />
        </label>
      </div>

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <div style={styles.customFieldsSection}>
          <h4 style={styles.customFieldsTitle}>Custom Properties</h4>
          {customFields.map((field) => (
            <div key={field} style={styles.customField}>
              <input
                type="text"
                value={frontmatter[field] || ''}
                onChange={(e) =>
                  onChange({ ...frontmatter, [field]: e.target.value })
                }
                style={styles.customFieldInput}
                placeholder={field}
              />
              <span style={styles.customFieldLabel}>{field}</span>
              <button
                onClick={() => removeCustomField(field)}
                style={styles.customFieldRemoveBtn}
                title="Remove property"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Field Section */}
      <div style={styles.addFieldSection}>
        <h4 style={styles.addFieldTitle}>Add Custom Property</h4>
        <div style={styles.addFieldInputs}>
          <input
            type="text"
            placeholder="Field name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            style={styles.input}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newFieldValue) {
                addCustomField(newFieldName, newFieldValue);
              }
            }}
          />
          <input
            type="text"
            placeholder="Field value"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
            style={styles.input}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && newFieldName) {
                addCustomField(newFieldName, newFieldValue);
              }
            }}
          />
          <button
            onClick={() => addCustomField(newFieldName, newFieldValue)}
            style={{
              ...styles.addFieldBtn,
              ...(newFieldName && newFieldValue ? {} : { opacity: 0.5, cursor: 'not-allowed' }),
            }}
            disabled={!newFieldName || !newFieldValue}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'var(--code-bg)',
    borderRadius: '4px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
  },
  row: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: 'var(--text)',
  },
  input: {
    padding: '0.5rem',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '0.95rem',
  },
  icon: {
    marginRight: '0.5rem',
    fontSize: '1.2rem',
  },
  tagsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  tagsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  tagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.4rem 0.8rem',
    backgroundColor: 'var(--accent)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '0.9rem',
  },
  tagRemoveBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0',
    lineHeight: '1',
  },
  tagInputRow: {
    display: 'flex',
  },
  tagInput: {
    flex: 1,
    padding: '0.5rem',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '0.95rem',
  },
  customFieldsSection: {
    gridColumn: '1 / -1',
    padding: '1rem',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
  },
  customFieldsTitle: {
    margin: '0 0 1rem 0',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  customField: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginBottom: '0.75rem',
    padding: '0.75rem',
    backgroundColor: 'var(--code-bg)',
    borderRadius: '4px',
  },
  customFieldInput: {
    flex: 1,
    padding: '0.5rem',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '0.95rem',
  },
  customFieldLabel: {
    fontSize: '0.85rem',
    color: 'var(--text)',
    opacity: 0.7,
    minWidth: '80px',
    textAlign: 'right' as const,
  },
  customFieldRemoveBtn: {
    padding: '0.4rem 0.6rem',
    backgroundColor: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--text)',
    cursor: 'pointer',
    fontSize: '1.2rem',
    lineHeight: '1',
  },
  addFieldSection: {
    gridColumn: '1 / -1',
    padding: '1rem',
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
  },
  addFieldTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  addFieldInputs: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'flex-end',
  },
  addFieldBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
};
