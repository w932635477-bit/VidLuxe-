/**
 * 图片代理 API
 * 用于绕过 CORS 限制，下载外部图片
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      console.log('[Proxy Image API] Missing url parameter');
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    console.log('[Proxy Image API] Request for:', url);

    // 验证 URL 格式
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      console.log('[Proxy Image API] Invalid url:', url);
      return NextResponse.json(
        { error: 'Invalid url' },
        { status: 400 }
      );
    }

    // 只允许特定域名（安全考虑）
    const allowedDomains = [
      'webstatic.aiproxy.vip',
      'aiproxy.vip',
      'media.evolink.ai',
      'evolink.ai',
      'oaidalleapiprodscus.blob.core.windows.net',
      'replicate.delivery',
      'pbxt.replicate.delivery',
      'localhost',
    ];

    const isAllowed = allowedDomains.some(domain =>
      targetUrl.hostname === domain || targetUrl.hostname.endsWith('.' + domain)
    );

    console.log('[Proxy Image API] Hostname:', targetUrl.hostname, 'Allowed:', isAllowed);

    if (!isAllowed) {
      console.log('[Proxy Image API] Domain not allowed:', targetUrl.hostname);
      return NextResponse.json(
        { error: 'Domain not allowed', hostname: targetUrl.hostname },
        { status: 403 }
      );
    }

    // 获取图片
    console.log('[Proxy Image API] Fetching image...');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log('[Proxy Image API] Fetch response:', response.status, response.statusText);

    if (!response.ok) {
      console.log('[Proxy Image API] Fetch failed:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch image', status: response.status },
        { status: response.status }
      );
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log('[Proxy Image API] Success, size:', imageBuffer.byteLength);

    console.log('[Proxy Image API] Success, size:', imageBuffer.byteLength);

    // 返回图片
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Proxy Image API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image', details: String(error) },
      { status: 500 }
    );
  }
}
