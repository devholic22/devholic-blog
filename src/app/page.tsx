import { getAllPosts } from '@/lib/posts';
import { PostList } from '@/components/PostList';

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Blog Posts</h1>
      <PostList posts={posts} />
    </div>
  );
}
