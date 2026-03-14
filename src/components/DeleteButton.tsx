'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteButtonProps {
  slug: string;
}

export function DeleteButton({ slug }: DeleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/delete-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return;
      }

      router.push('/');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isLoading}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      {isLoading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
