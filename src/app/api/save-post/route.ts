import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PostMeta } from '@/lib/types';
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

    const { slug, frontmatter, content } = await req.json();

    if (!slug || !frontmatter || !frontmatter.title) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const postsDir = path.join(process.cwd(), 'posts');

    // Create posts directory if it doesn't exist
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    const filePath = path.join(postsDir, `${slug}.md`);

    // Create the markdown file content
    const fileContent = matter.stringify(content, frontmatter as PostMeta);

    // Write the file
    fs.writeFileSync(filePath, fileContent, 'utf-8');

    return Response.json({
      ok: true,
      message: 'Post saved successfully',
      slug,
    });
  } catch (error) {
    console.error('Error saving post:', error);
    return Response.json(
      { error: 'Failed to save post' },
      { status: 500 }
    );
  }
}
