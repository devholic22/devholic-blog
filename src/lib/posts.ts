import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { markdownToHtml } from './markdown';
import { Post, PostMeta } from './types';

const postsDirectory = path.join(process.cwd(), 'posts');

export async function getAllPosts(): Promise<Post[]> {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(postsDirectory);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith('.md'))
      .map((file) => getPostBySlug(file.replace(/\.md$/, '')))
  );

  return posts
    .filter((post) => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace(/\.md$/, ''));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const html = await markdownToHtml(content);

  return {
    slug,
    content,
    html,
    title: data.title || 'Untitled',
    date: data.date || new Date().toISOString().split('T')[0],
    tags: data.tags || [],
    description: data.description || '',
    ...data,
  };
}
