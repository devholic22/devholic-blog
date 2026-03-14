'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    const result = await signIn('github', {
      redirect: false,
      callbackUrl: '/write',
    });

    if (result?.error) {
      alert('GitHub 로그인 실패. 권한이 없거나 계정이 인가되지 않았습니다.');
      setIsLoading(false);
      return;
    }

    if (result?.ok) {
      router.push('/write');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.description}>
          글을 작성하려면 GitHub로 로그인하세요.
        </p>

        <button
          onClick={handleSignIn}
          disabled={isLoading}
          style={{
            ...styles.button,
            ...(isLoading ? styles.buttonDisabled : {}),
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
        </button>

        <p style={styles.note}>
          GitHub 계정으로만 로그인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '1rem',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '2rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--code-bg)',
  },
  title: {
    margin: '0 0 1rem 0',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: 'var(--text)',
  },
  description: {
    margin: '0 0 2rem 0',
    color: 'var(--text)',
    opacity: 0.8,
  },
  button: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--accent)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  note: {
    marginTop: '1.5rem',
    fontSize: '0.85rem',
    color: 'var(--text)',
    opacity: 0.6,
    textAlign: 'center' as const,
  },
};
