import matter from 'gray-matter';
import { PostMeta } from '@/lib/types';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, frontmatter, content } = await req.json();

    if (!slug || !frontmatter || !frontmatter.title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return Response.json({ error: 'GitHub config missing' }, { status: 500 });
    }

    const fileContent = matter.stringify(content, frontmatter as PostMeta);
    const encoded = Buffer.from(fileContent, 'utf-8').toString('base64');
    const filePath = `posts/${slug}.md`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // Check if file already exists to get SHA (required for update)
    let sha: string | undefined;
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // Create or update file via GitHub API
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: sha ? `update: ${slug}` : `add: ${slug}`,
        content: encoded,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      return Response.json({ error: 'Failed to save to GitHub' }, { status: 500 });
    }

    return Response.json({ ok: true, slug });
  } catch (error) {
    console.error('Error saving post:', error);
    return Response.json({ error: 'Failed to save post' }, { status: 500 });
  }
}
