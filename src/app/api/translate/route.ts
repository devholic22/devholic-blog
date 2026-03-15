import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, targetLang } = await req.json();

  if (!text || !targetLang) {
    return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 });
  }

  // Split text into chunks to avoid URL length limits
  const chunks = splitText(text, 4000);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'auto',
      tl: targetLang,
      dt: 't',
      q: chunk,
    });

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Translation failed' }, { status: 502 });
    }

    const data = await res.json();
    const translated = data[0]
      ?.map((segment: [string]) => segment[0])
      .filter(Boolean)
      .join('');

    translatedChunks.push(translated || chunk);
  }

  return NextResponse.json({ translated: translatedChunks.join('') });
}

function splitText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a paragraph or sentence boundary
    let splitIndex = remaining.lastIndexOf('\n\n', maxLength);
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf('. ', maxLength);
    }
    if (splitIndex === -1 || splitIndex < maxLength / 2) {
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex === -1) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex);
  }

  return chunks;
}
