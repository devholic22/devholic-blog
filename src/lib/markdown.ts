import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import hljs from 'highlight.js';

export async function markdownToHtml(markdown: string): Promise<string> {
  const processor = remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false });

  const result = await processor.process(markdown);
  let html = String(result);

  // Apply syntax highlighting to fenced code blocks (e.g. ```typescript)
  html = html.replace(
    /<code class="language-(\w+)">([\s\S]*?)<\/code>/g,
    (_, lang, encoded) => {
      // remark-html HTML-encodes the source; decode before highlighting
      const source = encoded
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      // Skip unsupported languages (e.g. prisma, mermaid) gracefully
      if (!hljs.getLanguage(lang)) {
        return `<code class="language-${lang}">${encoded}</code>`;
      }
      try {
        const highlighted = hljs.highlight(source, {
          language: lang,
          ignoreIllegals: true,
        });
        return `<code class="hljs language-${lang}">${highlighted.value}</code>`;
      } catch {
        return `<code class="language-${lang}">${encoded}</code>`;
      }
    }
  );

  return html;
}
