import { NextResponse } from 'next/server';

/**
 * 健康检查 API
 * 用于 Docker 健康检查和负载均衡器探测
 */
export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // 检查关键环境变量
  const hasApiKey = !!process.env.NANO_BANANA_API_KEY;

  if (!hasApiKey) {
    return NextResponse.json(
      {
        ...checks,
        status: 'degraded',
        warning: 'NANO_BANANA_API_KEY not configured',
      },
      { status: 200 }
    );
  }

  return NextResponse.json(checks, { status: 200 });
}
