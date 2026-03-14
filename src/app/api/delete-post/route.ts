import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await req.json();

    if (!slug) {
      return Response.json(
        { error: 'Missing slug' },
        { status: 400 }
      );
    }

    const postsDir = path.join(process.cwd(), 'posts');
    const filePath = path.join(postsDir, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    return Response.json({
      ok: true,
      message: 'Post deleted successfully',
      slug,
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return Response.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
