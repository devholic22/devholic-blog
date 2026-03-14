'use client';

import { useState, useMemo, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { PostMeta } from '@/lib/types';
import { FrontmatterForm } from './FrontmatterForm';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { markdownToHtml } from '@/lib/markdown';

export function MarkdownEditor({
  initialPost,
}: {
  initialPost?: {
    slug: string;
    frontmatter: PostMeta;
    content: string;
  };
}) {
  const today = new Date().toISOString().split('T')[0];

  const [frontmatter, setFrontmatter] = useState<PostMeta>(
    initialPost?.frontmatter || {
      title: '',
      date: today,
      tags: [],
      description: '',
    }
  );

  const router = useRouter();
  const [content, setContent] = useState(initialPost?.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'markdown' | 'preview' | 'split'>('split');
  const [previewHtml, setPreviewHtml] = useState('');

  const slug = useMemo(() => {
    if (initialPost) {
      return initialPost.slug;
    }
    return frontmatter.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, [frontmatter.title, initialPost]);

  const handleSave = async () => {
    if (!frontmatter.title) {
      setError('Title is required');
      return;
    }

    if (!slug) {
      setError('Title must contain at least one letter or number');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          frontmatter,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      setSuccess(true);
      setTimeout(() => {
        if (initialPost) {
          router.push(`/posts/${slug}`);
        } else {
          router.push(`/posts/${slug}`);
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate preview HTML
  const updatePreview = async () => {
    if (content) {
      const html = await markdownToHtml(content);
      setPreviewHtml(html);
    } else {
      setPreviewHtml('');
    }
  };

  const handleContentChange = (text: string) => {
    setContent(text);
  };

  return (
    <div style={styles.container}>
      <h1 style={{ marginBottom: '2rem' }}>
        {initialPost ? 'Edit Post' : 'Write a new post'}
      </h1>

      <FrontmatterForm frontmatter={frontmatter} onChange={setFrontmatter} />

      {slug && (
        <p style={styles.slugInfo}>
          Post URL: <code>/posts/{slug}</code>
        </p>
      )}

      <EditorToolbar
        onSave={handleSave}
        isSaving={isSaving}
        buttonText={initialPost ? 'Update Post' : 'Save Post'}
      />

      {error && <div style={styles.error}>{error}</div>}
      {success && (
        <div style={styles.success}>
          Post saved successfully!
        </div>
      )}

      {/* View Mode Control Bar */}
      <div style={styles.controlBar}>
        <button
          onClick={() => setViewMode('markdown')}
          style={{
            ...styles.modeButton,
            ...(viewMode === 'markdown' ? styles.modeButtonActive : {}),
          }}
        >
          Markdown
        </button>
        <button
          onClick={async () => {
            await updatePreview();
            setViewMode('split');
          }}
          style={{
            ...styles.modeButton,
            ...(viewMode === 'split' ? styles.modeButtonActive : {}),
          }}
        >
          Split
        </button>
        <button
          onClick={async () => {
            await updatePreview();
            setViewMode('preview');
          }}
          style={{
            ...styles.modeButton,
            ...(viewMode === 'preview' ? styles.modeButtonActive : {}),
          }}
        >
          Preview
        </button>
      </div>

      <div style={{
        ...styles.editorContainer,
        gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr',
      }}>
        {(viewMode === 'markdown' || viewMode === 'split') && (
          <div style={styles.editorPanel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Markdown</h3>
            </div>
            <textarea
              value={content}
              onChange={(e) => {
                handleContentChange(e.target.value);
                updatePreview();
              }}
              placeholder="Write your post in markdown here..."
              style={styles.textarea}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div style={styles.previewPanel}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>Preview</h3>
            </div>
            <div style={styles.preview}>
              {previewHtml ? (
                <MarkdownRenderer html={previewHtml} />
              ) : (
                <p style={{ color: 'var(--text)', opacity: 0.5 }}>
                  Preview will appear here...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    width: '100%',
  },
  slugInfo: {
    fontSize: '0.9rem',
    color: 'var(--text)',
    opacity: 0.7,
    marginBottom: '1rem',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '1px solid #fcc',
  },
  success: {
    padding: '1rem',
    backgroundColor: '#efe',
    color: '#3c3',
    borderRadius: '4px',
    marginBottom: '1rem',
    border: '1px solid #cfc',
  },
  editorContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    height: 'calc(100vh - 400px)',
  },
  editorPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid var(--border)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  previewPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid var(--border)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--code-bg)',
    borderBottom: '1px solid var(--border)',
  },
  panelTitle: {
    margin: '0',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: 'var(--text)',
  },
  controlBar: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
    padding: '0.5rem',
    backgroundColor: 'var(--code-bg)',
    borderRadius: '4px',
    border: '1px solid var(--border)',
  },
  modeButton: {
    padding: '0.5rem 1.5rem',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  modeButtonActive: {
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: '1px solid var(--accent)',
  },
  textarea: {
    flex: 1,
    padding: '1rem',
    border: 'none',
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    resize: 'none',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  },
  preview: {
    flex: 1,
    padding: '1rem',
    overflow: 'auto',
    backgroundColor: 'var(--bg)',
  },
};
