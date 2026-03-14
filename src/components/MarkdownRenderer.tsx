export function MarkdownRenderer({ html }: { html: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        lineHeight: '1.7',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
      }}
    />
  );
}
