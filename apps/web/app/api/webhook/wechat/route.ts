/**
 * 微信支付回调 API (V3)
 * POST /api/webhook/wechat
 *
 * 处理微信支付结果通知
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  decryptNotifyResource,
  generateNotifySuccessResponse,
  generateNotifyFailResponse,
} from '@/lib/wechat-pay';
import { markOrderAsPaid } from '@/lib/payment/service';

export async function POST(request: NextRequest) {
  try {
    // 读取回调数据
    const body = await request.text();
    const data = JSON.parse(body);

    // V3 API 回调格式
    // {
    //   "id": "...",
    //   "create_time": "...",
    //   "resource_type": "encrypt-resource",
    //   "event_type": "TRANSACTION.SUCCESS",
    //   "resource": {
    //     "algorithm": "AEAD_AES_256_GCM",
    //     "ciphertext": "...",
    //     "associated_data": "",
    //     "nonce": "..."
    //   }
    // }

    // 验证事件类型
    if (data.event_type !== 'TRANSACTION.SUCCESS') {
      console.log('Ignoring non-success event:', data.event_type);
      return new NextResponse(generateNotifySuccessResponse(), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 解密回调数据
    const resource = data.resource;
    if (!resource || !resource.ciphertext) {
      console.error('Missing resource in notify');
      return new NextResponse(generateNotifyFailResponse('缺少资源数据'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const decryptedData = decryptNotifyResource({
      ciphertext: resource.ciphertext,
      associated_data: resource.associated_data || '',
      nonce: resource.nonce,
    });

    if (!decryptedData) {
      console.error('Failed to decrypt notify resource');
      return new NextResponse(generateNotifyFailResponse('解密失败'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Decrypted notify data:', decryptedData);

    // 解密后的数据格式
    // {
    //   "mchid": "...",
    //   "appid": "...",
    //   "out_trade_no": "...",
    //   "transaction_id": "...",
    //   "trade_type": "JSAPI/NATIVE",
    //   "trade_state": "SUCCESS",
    //   "success_time": "...",
    //   "amount": { "total": 100, "currency": "CNY" },
    //   "payer": { "openid": "..." }
    // }

    const outTradeNo = decryptedData.out_trade_no as string;
    const transactionId = decryptedData.transaction_id as string;
    const tradeState = decryptedData.trade_state as string;

    if (!outTradeNo) {
      return new NextResponse(generateNotifyFailResponse('缺少订单号'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 检查支付状态
    if (tradeState !== 'SUCCESS') {
      console.log('Trade state is not success:', tradeState);
      return new NextResponse(generateNotifySuccessResponse(), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 标记订单为已支付并发放积分
    const result = await markOrderAsPaid(outTradeNo, transactionId || null);

    if (!result.success) {
      console.error('Failed to mark order as paid:', result.error);
      return new NextResponse(generateNotifyFailResponse(result.error || '处理失败'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 记录日志
    console.log('Payment success:', {
      outTradeNo,
      transactionId,
      tradeType: decryptedData.trade_type,
    });

    // 返回成功响应
    return new NextResponse(generateNotifySuccessResponse(), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse(generateNotifyFailResponse('服务器错误'), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// GET 请求用于验证 URL 有效性
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WeChat Pay Webhook Endpoint (V3)',
    status: 'active',
  });
}
