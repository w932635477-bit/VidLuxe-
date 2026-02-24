/**
 * 微信支付回调 API
 * POST /api/webhook/wechat
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseNotifyXml, generateNotifyResponse, verifyNotify } from '@/lib/wechat-pay';
import { purchasePackage } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    // 读取回调数据
    const body = await request.text();

    // 解析 XML
    const params = parseNotifyXml(body);

    // 验证签名
    const sign = params.sign || '';
    if (!verifyNotify(params, sign)) {
      console.error('Invalid signature');
      return new NextResponse(generateNotifyResponse(false, '签名验证失败'), {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    // 检查支付结果
    const returnCode = params.return_code;
    const resultCode = params.result_code;

    if (returnCode !== 'SUCCESS' || resultCode !== 'SUCCESS') {
      console.error('Payment failed:', params);
      return new NextResponse(generateNotifyResponse(false, '支付失败'), {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    const outTradeNo = params.out_trade_no;
    const transactionId = params.transaction_id;

    if (!outTradeNo) {
      return new NextResponse(generateNotifyResponse(false, '缺少订单号'), {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    // 从订单号解析套餐信息（格式: VL{timestamp}{random}）
    // 实际生产环境应该从数据库查询订单
    // TODO: 迁移到 Supabase 后从数据库查询

    // 模拟处理：根据订单金额确定套餐
    const totalFee = parseInt(params.total_fee || '0', 10);
    let packageId = 'small';

    if (totalFee === 2900) packageId = 'small';
    else if (totalFee === 7900) packageId = 'medium';
    else if (totalFee === 19900) packageId = 'large';
    else if (totalFee === 49900) packageId = 'xlarge';

    // 获取用户 ID（实际应从订单表获取）
    // 这里使用一个临时的方案：从回调的附加数据中获取
    // 实际生产环境必须在创建订单时保存用户 ID
    const attach = params.attach;
    const anonymousId = attach || 'temp_user';

    // 使用现有的 credits 系统处理购买
    const result = purchasePackage(anonymousId, packageId);

    if (!result.success) {
      console.error('Failed to add credits:', result.error);
      return new NextResponse(generateNotifyResponse(false, result.error), {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    // 记录日志
    console.log('Payment success:', {
      outTradeNo,
      transactionId,
      packageId,
      anonymousId,
    });

    // 返回成功响应
    return new NextResponse(generateNotifyResponse(true), {
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse(generateNotifyResponse(false, '服务器错误'), {
      headers: { 'Content-Type': 'application/xml' }
    });
  }
}

// GET 请求用于验证 URL 有效性
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WeChat Pay Webhook Endpoint',
    status: 'active'
  });
}
