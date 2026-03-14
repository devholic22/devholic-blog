import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Write | My Blog',
  description: 'Write a new post',
};

export default async function WritePage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/signin');
  }

  return <MarkdownEditor initialPost={undefined} />;
}
