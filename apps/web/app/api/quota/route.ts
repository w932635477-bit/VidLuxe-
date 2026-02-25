/**
 * 额度查询 API
 *
 * GET /api/quota?anonymousId=xxx - 查询用户额度
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuotaManager, generateAnonymousId } from '@/lib/quota';

// 配置
const QUOTA_API_CONFIG = {
  // 匿名 ID 最大长度
  maxIdLength: 64,
} as const;

// 显式声明此路由为动态渲染
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const anonymousId = searchParams.get('anonymousId');
    const fingerprint = searchParams.get('fingerprint');
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // 验证匿名 ID
    let id: string;

    if (anonymousId) {
      // 验证格式
      if (anonymousId.length > QUOTA_API_CONFIG.maxIdLength) {
        return NextResponse.json(
          { success: false, error: 'Invalid anonymous ID' },
          { status: 400 }
        );
      }

      // 验证只包含安全字符
      if (!/^[a-zA-Z0-9_-]+$/.test(anonymousId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid anonymous ID format' },
          { status: 400 }
        );
      }

      id = anonymousId;
    } else {
      // 生成新的匿名 ID
      id = generateAnonymousId(fingerprint || undefined, ip);
    }

    const quotaManager = getQuotaManager();
    const quotaInfo = quotaManager.getQuotaInfo(id);

    return NextResponse.json({
      success: true,
      anonymousId: id,
      quota: quotaInfo,
    });
  } catch (error) {
    console.error('[Quota API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get quota' },
      { status: 500 }
    );
  }
}
