import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

export async function markdownToHtml(markdown: string): Promise<string> {
  const processor = remark()
    .use(remarkGfm)
    .use(remarkHtml);

  const result = await processor.process(markdown);
  return String(result);
}
