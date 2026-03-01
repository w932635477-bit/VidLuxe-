/**
 * 支付订单创建 API
 * POST /api/payment/create
 *
 * 支持 JSAPI（小程序）和 Native（扫码）支付
 */
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, CREDIT_PACKAGES, type PayType } from '@/lib/payment/service';

export async function POST(request: NextRequest) {
  try {
    // 解析请求
    const { packageId, userId, payType = 'native', openid } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: '请选择套餐' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 验证支付方式
    if (payType !== 'jsapi' && payType !== 'native') {
      return NextResponse.json({ error: '不支持的支付方式' }, { status: 400 });
    }

    // JSAPI 支付需要 openid
    if (payType === 'jsapi' && !openid) {
      return NextResponse.json({ error: 'JSAPI 支付需要用户 openid' }, { status: 400 });
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
    const result = await createPaymentOrder({
      userId,
      packageId,
      payType: payType as PayType,
      openid,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // 根据支付方式返回不同的参数
    if (payType === 'jsapi') {
      // 小程序支付
      return NextResponse.json({
        success: true,
        order: result.order,
        miniProgramPayParams: result.miniProgramPayParams,
        package: pkg,
      });
    } else {
      // Native 扫码支付
      return NextResponse.json({
        success: true,
        order: result.order,
        codeUrl: result.codeUrl,
        package: pkg,
      });
    }
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
