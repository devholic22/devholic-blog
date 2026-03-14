import { getPostBySlug } from '@/lib/posts';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: `Edit | ${slug}`,
  };
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/signin');
  }
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return (
      <div>
        <h1>Post not found</h1>
        <Link href="/">Back to posts</Link>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/posts/${slug}`} style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'block' }}>
        Back to post
      </Link>
      <MarkdownEditor
        initialPost={{
          slug,
          frontmatter: {
            title: post.title,
            date: post.date,
            tags: post.tags,
            description: post.description,
            ...(post as any), // Include any extra fields
          },
          content: post.content,
        }}
      />
    </div>
  );
}
