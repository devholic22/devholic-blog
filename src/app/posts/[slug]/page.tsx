import { getAllSlugs, getPostBySlug } from '@/lib/posts';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { DeleteButton } from '@/components/DeleteButton';

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return {
      title: 'Post not found',
    };
  }
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!post) {
    return (
      <div>
        <h1>Post not found</h1>
        <Link href="/">Back to posts</Link>
      </div>
    );
  }

  return (
    <article>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <Link href="/" style={{ color: 'var(--accent)' }}>
          Back to posts
        </Link>
        {isAuthenticated && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <DeleteButton slug={slug} />
            <Link href={`/posts/${slug}/edit`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
              Edit
            </Link>
          </div>
        )}
      </div>
      <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        {post.title}
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
            <span style={styles.metaValue}>{post.author}</span>
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
            <span style={styles.metaValue}>{post.description}</span>
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
                <span style={styles.metaLabel}>{key}</span>
                <span style={styles.metaValue}>{String(value)}</span>
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
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '2rem',
          marginBottom: '2rem',
        }}
      >
        <MarkdownRenderer html={post.html} />
      </div>
    </article>
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
