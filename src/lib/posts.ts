import matter from 'gray-matter';
import { markdownToHtml } from './markdown';
import { Post } from './types';

const GITHUB_API = 'https://api.github.com';
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function getAllPosts(): Promise<Post[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/posts`, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const files: { name: string }[] = await res.json();
  const mdFiles = files.filter((f) => f.name.endsWith('.md'));

  const posts = await Promise.all(
    mdFiles.map((f) => getPostBySlug(f.name.replace(/\.md$/, '')))
  );

  return posts
    .filter((post) => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAllSlugs(): Promise<string[]> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/posts`, {
    headers: githubHeaders(),
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const files: { name: string }[] = await res.json();
  return files.filter((f) => f.name.endsWith('.md')).map((f) => f.name.replace(/\.md$/, ''));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/posts/${slug}.md`,
    {
      headers: githubHeaders(),
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) return null;

  const { content: encoded } = await res.json();
  const fileContent = Buffer.from(encoded, 'base64').toString('utf-8');
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
