/**
 * 支付订单创建 API
 * POST /api/payment/create
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createH5Order, generateOutTradeNo, isWechatPayConfigured } from '@/lib/wechat-pay';
import { CREDIT_PACKAGES, purchasePackage } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    // 解析请求
    const { packageId, simulate } = await request.json();

    if (!packageId) {
      return NextResponse.json({ error: '请选择套餐' }, { status: 400 });
    }

    // 查找套餐
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: '套餐不存在' }, { status: 400 });
    }

    if (pkg.price === 0) {
      return NextResponse.json({ error: '免费套餐无需购买' }, { status: 400 });
    }

    // 模拟支付模式（用于测试）
    if (simulate) {
      // 直接发放额度（仅测试用）
      const result = purchasePackage(user.id, packageId);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        simulated: true,
        message: '模拟支付成功，额度已发放',
        package: pkg,
        newCredits: result.credits?.balance,
      });
    }

    // 检查微信支付配置
    if (!isWechatPayConfigured()) {
      return NextResponse.json({
        error: '在线支付暂未开放',
        code: 'PAYMENT_NOT_CONFIGURED',
        message: '请联系客服完成购买：upgrade@vidluxe.com',
        contact: {
          email: 'upgrade@vidluxe.com',
          wechat: 'vidluxe_support',
        },
        package: pkg,
      }, { status: 503 });
    }

    // 生成订单号
    const outTradeNo = generateOutTradeNo();

    // 创建微信支付订单
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1';

    const orderResult = await createH5Order({
      outTradeNo,
      totalFee: pkg.price,
      body: `VidLuxe - ${pkg.name} (${pkg.credits}额度)`,
      clientIp,
    });

    if (orderResult.error) {
      return NextResponse.json({ error: orderResult.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: outTradeNo,
      prepayId: orderResult.prepayId,
      mwebUrl: `https://vidluxe.com/payment/pending?orderId=${outTradeNo}`,
      package: pkg,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
