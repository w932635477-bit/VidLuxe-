/**
 * 查询支付订单状态 API
 * GET /api/payment/query?orderId=xxx
 */
import { NextRequest, NextResponse } from 'next/server';
import { queryPaymentOrder } from '@/lib/payment/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    const result = await queryPaymentOrder(orderId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
    });
  } catch (error) {
    console.error('Payment query error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
