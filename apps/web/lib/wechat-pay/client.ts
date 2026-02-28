/**
 * 微信支付客户端工具
 * MVP 阶段提供基础的支付功能
 */
import crypto from 'crypto';
import { wechatPayConfig, isWechatPayConfigured } from './config';

// 生成随机字符串
function generateNonceStr(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成签名（MD5 方式，适用于旧版 API）
function generateSign(params: Record<string, string>, apiKey: string): string {
  const sortedParams = Object.keys(params)
    .filter(key => params[key] !== undefined && params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const stringSignTemp = `${sortedParams}&key=${apiKey}`;
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
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
 * 创建 H5 支付订单参数
 * 返回用于调起微信支付的参数
 */
export async function createH5Order(params: {
  outTradeNo: string;
  totalFee: number; // 分
  body: string;
  clientIp: string;
}): Promise<{ outTradeNo: string; prepayId?: string; error?: string }> {
  const { appId, mchId, apiKey, notifyUrl } = wechatPayConfig;

  // 检查配置
  if (!isWechatPayConfigured()) {
    return {
      outTradeNo: params.outTradeNo,
      error: '微信支付未配置，请联系管理员',
    };
  }

  // 构建订单参数
  const orderParams: Record<string, string> = {
    appid: appId,
    mch_id: mchId,
    nonce_str: generateNonceStr(),
    body: params.body,
    out_trade_no: params.outTradeNo,
    total_fee: params.totalFee.toString(),
    spbill_create_ip: params.clientIp,
    notify_url: notifyUrl,
    trade_type: 'H5',
    scene_info: JSON.stringify({
      h5_info: {
        type: 'Wap',
        wap_url: 'https://vidluxe.com',
        wap_name: 'VidLuxe',
      },
    }),
  };

  // 生成签名
  orderParams.sign = generateSign(orderParams, apiKey);

  // 注意：实际生产环境中，这里需要调用微信支付统一下单 API
  // 由于需要商户证书和企业资质，MVP 阶段先返回模拟数据
  // 正式上线前需要：
  // 1. 申请微信支付商户号
  // 2. 配置 API 证书
  // 3. 使用 wechatpay-node-v3 等官方 SDK

  // 模拟返回（开发测试用）
  return {
    outTradeNo: params.outTradeNo,
    prepayId: `mock_prepay_id_${Date.now()}`,
  };
}

/**
 * 创建 JSAPI 支付订单（微信公众号/小程序内支付）
 */
export async function createJSAPIOrder(params: {
  outTradeNo: string;
  totalFee: number;
  body: string;
  openid: string;
}): Promise<{ outTradeNo: string; prepayId?: string; error?: string }> {
  const { appId, mchId, apiKey, notifyUrl } = wechatPayConfig;

  if (!isWechatPayConfigured()) {
    return {
      outTradeNo: params.outTradeNo,
      error: '微信支付未配置，请联系管理员',
    };
  }

  const orderParams: Record<string, string> = {
    appid: appId,
    mch_id: mchId,
    nonce_str: generateNonceStr(),
    body: params.body,
    out_trade_no: params.outTradeNo,
    total_fee: params.totalFee.toString(),
    spbill_create_ip: '127.0.0.1',
    notify_url: notifyUrl,
    trade_type: 'JSAPI',
    openid: params.openid,
  };

  orderParams.sign = generateSign(orderParams, apiKey);

  // 模拟返回（开发测试用）
  return {
    outTradeNo: params.outTradeNo,
    prepayId: `mock_prepay_id_${Date.now()}`,
  };
}

/**
 * 创建 Native 支付订单（扫码支付）
 * 返回 code_url 用于生成二维码
 */
export async function createNativeOrder(params: {
  outTradeNo: string;
  totalFee: number; // 分
  body: string;
  productId?: string;
}): Promise<{ outTradeNo: string; codeUrl?: string; prepayId?: string; error?: string }> {
  const { appId, mchId, apiKey, notifyUrl } = wechatPayConfig;

  // 检查配置
  if (!isWechatPayConfigured()) {
    return {
      outTradeNo: params.outTradeNo,
      error: '微信支付未配置，请联系管理员',
    };
  }

  // 构建订单参数
  const orderParams: Record<string, string> = {
    appid: appId,
    mch_id: mchId,
    nonce_str: generateNonceStr(),
    body: params.body,
    out_trade_no: params.outTradeNo,
    total_fee: params.totalFee.toString(),
    spbill_create_ip: '127.0.0.1',
    notify_url: notifyUrl,
    trade_type: 'NATIVE',
    product_id: params.productId || params.outTradeNo,
  };

  // 生成签名
  orderParams.sign = generateSign(orderParams, apiKey);

  // 实际生产环境：调用微信支付统一下单 API
  // POST https://api.mch.weixin.qq.com/pay/unifiedorder
  // 使用 wechatpay-node-v3 或类似 SDK

  // 模拟返回（开发测试用）
  // 生产环境需要从微信 API 获取真实的 code_url
  const mockCodeUrl = `weixin://wxpay/bizpayurl?pr=${params.outTradeNo}`;

  return {
    outTradeNo: params.outTradeNo,
    codeUrl: mockCodeUrl,
    prepayId: `mock_prepay_id_${Date.now()}`,
  };
}

/**
 * 查询订单状态
 */
export async function queryOrder(outTradeNo: string): Promise<{
  tradeState: 'SUCCESS' | 'REFUND' | 'NOTPAY' | 'CLOSED' | 'REVOKED' | 'USERPAYING' | 'PAYERROR';
  transactionId?: string;
  totalFee?: number;
  timeEnd?: string;
  error?: string;
}> {
  const { appId, mchId, apiKey } = wechatPayConfig;

  if (!isWechatPayConfigured()) {
    return {
      tradeState: 'PAYERROR',
      error: '微信支付未配置',
    };
  }

  // 构建查询参数
  const queryParams: Record<string, string> = {
    appid: appId,
    mch_id: mchId,
    out_trade_no: outTradeNo,
    nonce_str: generateNonceStr(),
  };

  queryParams.sign = generateSign(queryParams, apiKey);

  // 实际生产环境：调用微信支付订单查询 API
  // POST https://api.mch.weixin.qq.com/pay/orderquery

  // 模拟返回（开发测试用）
  return {
    tradeState: 'NOTPAY',
  };
}

/**
 * 验证支付回调签名
 */
export function verifyNotify(params: Record<string, string>, sign: string): boolean {
  if (!isWechatPayConfigured()) {
    return false;
  }
  const expectedSign = generateSign(params, wechatPayConfig.apiKey);
  return expectedSign === sign;
}

/**
 * 解析微信支付回调 XML
 * 简单实现，生产环境建议使用 xml2js 库
 */
export function parseNotifyXml(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const key = match[1] || match[3];
    const value = match[2] || match[4];
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * 生成回调响应 XML
 */
export function generateNotifyResponse(success: boolean, message?: string): string {
  if (success) {
    return '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
  }
  return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${message || 'FAIL'}]]></return_msg></xml>`;
}
