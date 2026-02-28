/**
 * 支付订单创建 API
 * POST /api/payment/create
 *
 * 创建 Native 支付订单（扫码支付）
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, CREDIT_PACKAGES } from '@/lib/payment/service';

export async function POST(request: NextRequest) {
  try {
    // 解析请求
    const { packageId, userId } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: '请选择套餐' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 验证套餐存在
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: '套餐不存在' }, { status: 400 });
    }

    if (pkg.price === 0) {
      return NextResponse.json({ error: '免费套餐无需购买' }, { status: 400 });
    }

    // 创建支付订单
    const result = await createPaymentOrder({ userId, packageId });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      codeUrl: result.codeUrl,
      package: pkg,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
