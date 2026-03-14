import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await req.json();

    if (!slug) {
      return Response.json({ error: 'Missing slug' }, { status: 400 });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;

    if (!token || !owner || !repo) {
      return Response.json({ error: 'GitHub config missing' }, { status: 500 });
    }

    const filePath = `posts/${slug}.md`;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // Get current file SHA
    const getRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!getRes.ok) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const { sha } = await getRes.json();

    // Delete file via GitHub API
    const deleteRes = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `delete: ${slug}`,
        sha,
      }),
    });

    if (!deleteRes.ok) {
      return Response.json({ error: 'Failed to delete from GitHub' }, { status: 500 });
    }

    return Response.json({ ok: true, slug });
  } catch (error) {
    console.error('Error deleting post:', error);
    return Response.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
