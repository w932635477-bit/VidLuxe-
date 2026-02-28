/**
 * 微信支付回调 API
 * POST /api/webhook/wechat
 *
 * 处理微信支付结果通知
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseNotifyXml, generateNotifyResponse, verifyNotify } from '@/lib/wechat-pay';
import { markOrderAsPaid } from '@/lib/payment/service';

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

    // 标记订单为已支付并发放积分
    const result = await markOrderAsPaid(outTradeNo, transactionId || null);

    if (!result.success) {
      console.error('Failed to mark order as paid:', result.error);
      return new NextResponse(generateNotifyResponse(false, result.error || '处理失败'), {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    // 记录日志
    console.log('Payment success:', {
      outTradeNo,
      transactionId,
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
