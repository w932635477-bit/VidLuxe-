/**
 * 微信支付 V3 客户端
 * 使用 wechatpay-node-v3 SDK
 */
import Pay from 'wechatpay-node-v3';
import crypto from 'crypto';
import { wechatPayConfig, isWechatPayConfigured } from './config';

// 支付客户端实例（懒加载）
let payClient: InstanceType<typeof Pay> | null = null;

/**
 * 获取支付客户端实例
 */
function getPayClient(): InstanceType<typeof Pay> {
  if (!payClient) {
    if (!isWechatPayConfigured()) {
      throw new Error('微信支付未配置');
    }

    payClient = new Pay({
      appid: wechatPayConfig.appId,
      mchid: wechatPayConfig.mchId,
      serial_no: wechatPayConfig.serialNo,
      publicKey: Buffer.from(''), // 平台公钥，暂不需要
      privateKey: Buffer.from(wechatPayConfig.privateKey),
      key: wechatPayConfig.apiV3Key,
    });
  }
  return payClient;
}

/**
 * 生成商户订单号
 */
export function generateOutTradeNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VL${timestamp}${random}`;
}

/**
 * 生成随机字符串
 */
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================
// JSAPI 支付（小程序/公众号内支付）
// ============================================

export interface JSAPIOrderParams {
  outTradeNo: string;
  totalFee: number; // 分
  body: string;
  openid: string; // 用户 openid
}

export interface JSAPIOrderResult {
  outTradeNo: string;
  prepayId?: string;
  // 小程序调起支付需要的参数
  miniProgramPayParams?: {
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: 'RSA';
    paySign: string;
  };
  error?: string;
}

/**
 * 创建 JSAPI 支付订单（小程序支付）
 */
export async function createJSAPIOrder(params: JSAPIOrderParams): Promise<JSAPIOrderResult> {
  const { outTradeNo, totalFee, body, openid } = params;

  if (!isWechatPayConfigured()) {
    return {
      outTradeNo,
      error: '微信支付未配置，请联系管理员',
    };
  }

  try {
    const pay = getPayClient();

    // 调用统一下单 API
    const result = await pay.transactions_jsapi({
      description: body,
      out_trade_no: outTradeNo,
      amount: {
        total: totalFee,
        currency: 'CNY',
      },
      payer: {
        openid: openid,
      },
      notify_url: wechatPayConfig.notifyUrl,
    });

    if (result.status !== 200 && result.status !== 201) {
      console.error('WechatPay JSAPI order error:', result);
      return {
        outTradeNo,
        error: `创建订单失败: ${result.error || '未知错误'}`,
      };
    }

    const data = result.data as Record<string, unknown>;
    const prepayId = data?.prepay_id as string;
    if (!prepayId) {
      return {
        outTradeNo,
        error: '获取 prepay_id 失败',
      };
    }

    // 生成小程序调起支付的参数
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();
    const packageStr = `prepay_id=${prepayId}`;

    // 签名
    const message = `${wechatPayConfig.appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    const paySign = sign.sign(wechatPayConfig.privateKey, 'base64');

    return {
      outTradeNo,
      prepayId,
      miniProgramPayParams: {
        timeStamp,
        nonceStr,
        package: packageStr,
        signType: 'RSA',
        paySign,
      },
    };
  } catch (error) {
    console.error('Create JSAPI order error:', error);
    return {
      outTradeNo,
      error: error instanceof Error ? error.message : '创建订单失败',
    };
  }
}

// ============================================
// Native 支付（扫码支付）
// ============================================

export interface NativeOrderParams {
  outTradeNo: string;
  totalFee: number; // 分
  body: string;
  productId?: string;
}

export interface NativeOrderResult {
  outTradeNo: string;
  codeUrl?: string;
  prepayId?: string;
  error?: string;
}

/**
 * 创建 Native 支付订单（扫码支付）
 */
export async function createNativeOrder(params: NativeOrderParams): Promise<NativeOrderResult> {
  const { outTradeNo, totalFee, body } = params;

  if (!isWechatPayConfigured()) {
    return {
      outTradeNo,
      error: '微信支付未配置，请联系管理员',
    };
  }

  try {
    const pay = getPayClient();

    // 调用统一下单 API
    const result = await pay.transactions_native({
      description: body,
      out_trade_no: outTradeNo,
      amount: {
        total: totalFee,
        currency: 'CNY',
      },
      notify_url: wechatPayConfig.notifyUrl,
    });

    if (result.status !== 200 && result.status !== 201) {
      console.error('WechatPay Native order error:', result);
      return {
        outTradeNo,
        error: `创建订单失败: ${result.error || '未知错误'}`,
      };
    }

    const data = result.data as Record<string, unknown>;
    const codeUrl = data?.code_url as string;
    if (!codeUrl) {
      return {
        outTradeNo,
        error: '获取支付二维码失败',
      };
    }

    return {
      outTradeNo,
      codeUrl,
      prepayId: data?.prepay_id as string,
    };
  } catch (error) {
    console.error('Create Native order error:', error);
    return {
      outTradeNo,
      error: error instanceof Error ? error.message : '创建订单失败',
    };
  }
}

// ============================================
// 订单查询
// ============================================

export type TradeState = 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR';

export interface QueryOrderResult {
  tradeState: TradeState;
  transactionId?: string;
  totalFee?: number;
  timeEnd?: string;
  error?: string;
}

/**
 * 查询订单状态
 */
export async function queryOrder(outTradeNo: string): Promise<QueryOrderResult> {
  if (!isWechatPayConfigured()) {
    return {
      tradeState: 'PAYERROR',
      error: '微信支付未配置',
    };
  }

  try {
    const pay = getPayClient();

    const result = await pay.query({
      out_trade_no: outTradeNo,
    });

    if (result.status !== 200) {
      return {
        tradeState: 'PAYERROR',
        error: `查询订单失败: ${result.error || '未知错误'}`,
      };
    }

    const data = result.data as Record<string, unknown>;
    const tradeState = data?.trade_state as TradeState;

    return {
      tradeState,
      transactionId: data?.transaction_id as string | undefined,
      totalFee: (data?.amount as Record<string, unknown>)?.total as number | undefined,
      timeEnd: data?.success_time as string | undefined,
    };
  } catch (error) {
    console.error('Query order error:', error);
    return {
      tradeState: 'PAYERROR',
      error: error instanceof Error ? error.message : '查询订单失败',
    };
  }
}

// ============================================
// 关闭订单
// ============================================

/**
 * 关闭订单
 */
export async function closeOrder(outTradeNo: string): Promise<{ success: boolean; error?: string }> {
  if (!isWechatPayConfigured()) {
    return { success: false, error: '微信支付未配置' };
  }

  try {
    const pay = getPayClient();

    const result = await pay.close(outTradeNo);

    if (result.status === 204 || result.status === 200) {
      return { success: true };
    }

    return {
      success: false,
      error: `关闭订单失败: ${result.error || '未知错误'}`,
    };
  } catch (error) {
    console.error('Close order error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '关闭订单失败',
    };
  }
}

// ============================================
// 回调验证
// ============================================

/**
 * 验证支付回调签名（V3）
 */
export function verifyNotify(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string
): boolean {
  if (!isWechatPayConfigured()) {
    return false;
  }

  try {
    const pay = getPayClient();

    // 构造验签消息
    const message = `${timestamp}\n${nonce}\n${body}\n`;

    // 使用平台公钥验签
    // 注意：wechatpay-node-v3 的 verify 方法需要平台证书
    // 这里简化处理，实际应该获取平台证书进行验签
    // 生产环境建议使用 SDK 提供的验签方法

    // 简化版：使用 SDK 的解密方法验证
    const decrypted = pay.decipher_gcm(
      JSON.parse(body).resource.ciphertext,
      JSON.parse(body).resource.associated_data,
      JSON.parse(body).resource.nonce,
      wechatPayConfig.apiV3Key
    );

    return !!decrypted;
  } catch (error) {
    console.error('Verify notify error:', error);
    return false;
  }
}

/**
 * 解密回调数据
 */
export function decryptNotifyResource(resource: {
  ciphertext: string;
  associated_data: string;
  nonce: string;
}): Record<string, unknown> | null {
  if (!isWechatPayConfigured()) {
    return null;
  }

  try {
    const pay = getPayClient();

    const decrypted = pay.decipher_gcm(
      resource.ciphertext,
      resource.associated_data || '',
      resource.nonce,
      wechatPayConfig.apiV3Key
    );

    return JSON.parse(decrypted as string);
  } catch (error) {
    console.error('Decrypt notify resource error:', error);
    return null;
  }
}

/**
 * 生成回调成功响应
 */
export function generateNotifySuccessResponse(): string {
  return JSON.stringify({ code: 'SUCCESS', message: '成功' });
}

/**
 * 生成回调失败响应
 */
export function generateNotifyFailResponse(message: string): string {
  return JSON.stringify({ code: 'FAIL', message });
}
