import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, filenames } = body as { urls: string[]; filenames?: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ success: false, error: 'No URLs provided' }, { status: 400 });
    }

    const zip = new JSZip();

    const fetchPromises = urls.map(async (url, index) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        const filename = filenames?.[index] || `image_${index + 1}.jpg`;
        return { filename, blob };
      } catch {
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (result) {
        zip.file(result.filename, result.blob);
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
