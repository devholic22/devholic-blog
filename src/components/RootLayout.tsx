'use client';

import Link from 'next/link';
import { DarkModeToggle } from './DarkModeToggle';

export function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header style={styles.header}>
        <div style={styles.nav}>
          <Link href="/" style={styles.logo}>
            Devholic Blog
          </Link>
          <nav style={styles.navLinks}>
            <Link href="/">Posts</Link>
            <Link href="/write">Write</Link>
          </nav>
          <DarkModeToggle />
        </div>
      </header>
      <main style={styles.main}>{children}</main>
    </>
  );
}

const styles = {
  header: {
    borderBottom: '1px solid var(--border)',
    padding: '1rem 0',
    position: 'sticky' as const,
    top: 0,
    background: 'var(--bg)',
    zIndex: 100,
  },
  nav: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--text)',
    textDecoration: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
    flexGrow: 1,
    justifyContent: 'center',
  },
  main: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
};
