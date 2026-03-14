'use client';

import { useState, useMemo } from 'react';
import { Post } from '@/lib/types';
import { PostCard } from './PostCard';
import { SearchBar } from './SearchBar';
import { TagFilter } from './TagFilter';

export function PostList({ posts }: { posts: Post[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query)
      );
    }

    if (activeTag) {
      result = result.filter((post) => post.tags.includes(activeTag));
    }

    return result;
  }, [posts, searchQuery, activeTag]);

  return (
    <div>
      <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <TagFilter tags={allTags} activeTag={activeTag} onTagChange={setActiveTag} />

      {filteredPosts.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text)', opacity: 0.7 }}>
          No posts found.
        </p>
      ) : (
        <div>
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
