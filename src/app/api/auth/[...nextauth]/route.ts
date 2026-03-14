import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      const authorizedUsers = (process.env.AUTHORIZED_GITHUB_USERS || '').split(',').map(u => u.trim());
      if (authorizedUsers.length === 0 || authorizedUsers[0] === '') {
        return false;
      }
      const username = (profile as any)?.login || user.email || '';
      return authorizedUsers.includes(username);
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
});

export { handler as GET, handler as POST };
