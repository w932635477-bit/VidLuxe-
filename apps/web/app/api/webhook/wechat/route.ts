/**
 * 微信支付回调 API (V3)
 * POST /api/webhook/wechat
 *
 * 处理微信支付结果通知
 *
 * 最佳实践：
 * 1. 验证签名（从 header 中获取）
 * 2. 事件幂等性检查（防止重复处理）
 * 3. 快速响应（微信要求 5 秒内响应）
 * 4. 原子操作（防止并发问题）
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  decryptNotifyResource,
  generateNotifySuccessResponse,
  generateNotifyFailResponse,
} from '@/lib/wechat-pay';
import { markOrderAsPaid } from '@/lib/payment/service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ============================================
    // 1. 获取并验证请求头
    // ============================================
    const headers = request.headers;
    const signature = headers.get('wechatpay-signature');
    const timestamp = headers.get('wechatpay-timestamp');
    const nonce = headers.get('wechatpay-nonce');
    const serial = headers.get('wechatpay-serial');

    // TODO: 实现签名验证（生产环境必须）
    // 参考文档：https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_1.shtml
    // 需要获取平台证书并验证签名
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Webhook] Signature verification not implemented');
      // 生产环境建议验证签名
      // if (!verifySignature(signature, timestamp, nonce, body, serial)) {
      //   return new NextResponse(generateNotifyFailResponse('签名验证失败'), {
      //     headers: { 'Content-Type': 'application/json' },
      //   });
      // }
    }

    // ============================================
    // 2. 读取并解析回调数据
    // ============================================
    const body = await request.text();
    const data = JSON.parse(body);

    // 微信回调事件 ID（用于幂等性检查）
    const eventId = data.id;

    if (!eventId) {
      console.error('[Webhook] Missing event ID');
      return new NextResponse(generateNotifyFailResponse('缺少事件ID'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 3. 事件幂等性检查（防止重复处理）
    // ============================================
    const supabase = await createClient();

    // 检查是否已处理过此事件
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('event_id', eventId)
      .single();

    if (existingEvent) {
      console.log('[Webhook] Event already processed:', eventId);
      // 已处理过，直接返回成功（幂等）
      return new NextResponse(generateNotifySuccessResponse(), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 4. 验证事件类型
    // ============================================
    if (data.event_type !== 'TRANSACTION.SUCCESS') {
      console.log('[Webhook] Ignoring non-success event:', data.event_type);

      // 记录非成功事件（用于审计）
      await supabase.from('webhook_events').insert({
        event_id: eventId,
        event_type: data.event_type,
        processed_at: new Date().toISOString(),
        payload: data,
      });

      return new NextResponse(generateNotifySuccessResponse(), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 5. 解密回调数据
    // ============================================
    const resource = data.resource;
    if (!resource || !resource.ciphertext) {
      console.error('[Webhook] Missing resource in notify');
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
      console.error('[Webhook] Failed to decrypt notify resource');
      return new NextResponse(generateNotifyFailResponse('解密失败'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const outTradeNo = decryptedData.out_trade_no as string;
    const transactionId = decryptedData.transaction_id as string;
    const tradeState = decryptedData.trade_state as string;

    if (!outTradeNo) {
      return new NextResponse(generateNotifyFailResponse('缺少订单号'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 6. 检查支付状态
    // ============================================
    if (tradeState !== 'SUCCESS') {
      console.log('[Webhook] Trade state is not success:', tradeState);

      // 记录事件
      await supabase.from('webhook_events').insert({
        event_id: eventId,
        event_type: data.event_type,
        out_trade_no: outTradeNo,
        processed_at: new Date().toISOString(),
        payload: { ...data, decrypted: decryptedData },
      });

      return new NextResponse(generateNotifySuccessResponse(), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 7. 处理支付成功（原子操作）
    // ============================================
    const result = await markOrderAsPaid(outTradeNo, transactionId || null);

    if (!result.success) {
      console.error('[Webhook] Failed to mark order as paid:', result.error);
      return new NextResponse(generateNotifyFailResponse(result.error || '处理失败'), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ============================================
    // 8. 记录已处理事件（幂等性保证）
    // ============================================
    await supabase.from('webhook_events').insert({
      event_id: eventId,
      event_type: data.event_type,
      out_trade_no: outTradeNo,
      processed_at: new Date().toISOString(),
      payload: { ...data, decrypted: decryptedData },
    });

    // ============================================
    // 9. 返回成功响应
    // ============================================
    const processingTime = Date.now() - startTime;
    console.log('[Webhook] Payment processed successfully:', {
      eventId,
      outTradeNo,
      transactionId,
      processingTime: `${processingTime}ms`,
    });

    return new NextResponse(generateNotifySuccessResponse(), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Webhook] Error:', error);
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
    timestamp: new Date().toISOString(),
  });
}
