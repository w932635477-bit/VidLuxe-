import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, filenames } = body as { urls: string[]; filenames?: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: 'No URLs provided' }, { status: 400 });
    }

    const zip = new JSZip();
    const publicDir = path.join(process.cwd(), 'public');

    const fetchPromises = urls.map(async (url, index) => {
      try {
        let buffer: Buffer;

        // 判断是本地路径还是远程 URL
        if (url.startsWith('/uploads/') || url.startsWith('/public/')) {
          // 本地文件，直接读取
          const filePath = path.join(publicDir, url.replace(/^\/public/, ''));
          if (fs.existsSync(filePath)) {
            buffer = fs.readFileSync(filePath);
          } else {
            console.warn(`[ZIP API] Local file not found: ${filePath}`);
            return null;
          }
        } else if (url.startsWith('http')) {
          // 远程 URL，fetch 获取
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`[ZIP API] Fetch failed: ${url}, status: ${response.status}`);
            return null;
          }
          buffer = Buffer.from(await response.arrayBuffer());
        } else {
          console.warn(`[ZIP API] Invalid URL format: ${url}`);
          return null;
        }

        const filename = filenames?.[index] || `image_${index + 1}.jpg`;
        return { filename, buffer };
      } catch (error) {
        console.warn(`[ZIP API] Error processing ${url}:`, error);
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (result) {
        zip.file(result.filename, result.buffer);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });

    return new NextResponse(zipBlob, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="vidluxe_images.zip"',
      },
    });
  } catch (error) {
    console.error('[Download ZIP API] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create ZIP' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
