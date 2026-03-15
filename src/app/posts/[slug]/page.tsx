import { getAllSlugs, getPostBySlug } from '@/lib/posts';
import { TranslatedMarkdown } from '@/components/TranslatedMarkdown';
import { PostHeader } from '@/components/PostHeader';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { DeleteButton } from '@/components/DeleteButton';

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
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
      <PostHeader post={post} />
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '2rem',
          marginBottom: '2rem',
        }}
      >
        <TranslatedMarkdown html={post.html} />
      </div>
    </article>
  );
}
