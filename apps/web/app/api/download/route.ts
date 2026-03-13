/**
 * 下载代理 API
 * 用于绕过外部服务的 CORS 限制
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');
    const filename = request.nextUrl.searchParams.get('filename') || 'download';

    if (!url) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // 验证 URL 是否来自允许的域名
    const allowedDomains = [
      'media.evolink.ai',
      'evolink.ai',
      'localhost',
      '146.56.193.40',
      'vidluxe.cn',
      'www.vidluxe.cn',
      'vidluxe.com.cn',
      'www.vidluxe.com.cn',
      'picsum.photos', // 测试图片服务
      'images.unsplash.com',
      'webstatic.aiproxy.vip',
    ];

    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain =>
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // 获取文件
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VidLuxe/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const blob = await response.blob();

    // 确定文件扩展名
    let extension = '';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = '.jpg';
    } else if (contentType.includes('png')) {
      extension = '.png';
    } else if (contentType.includes('mp4')) {
      extension = '.mp4';
    } else if (contentType.includes('webm')) {
      extension = '.webm';
    }

    const finalFilename = filename.endsWith(extension) ? filename : `${filename}${extension}`;

    // 返回文件，设置下载头
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Content-Length': blob.size.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Download API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    );
  }
}
