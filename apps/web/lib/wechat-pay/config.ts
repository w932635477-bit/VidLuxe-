/**
 * 微信支付 V3 配置
 */

export interface WechatPayConfig {
  // 小程序/公众号 AppID
  appId: string;
  // 商户号
  mchId: string;
  // APIv3 密钥（32位）
  apiV3Key: string;
  // 商户私钥（apiclient_key.pem 内容）
  privateKey: string;
  // 证书序列号
  serialNo: string;
  // 支付回调地址
  notifyUrl: string;
}

/**
 * 微信支付配置
 * 从环境变量读取
 */
export const wechatPayConfig: WechatPayConfig = {
  appId: process.env.WECHAT_PAY_APP_ID || '',
  mchId: process.env.WECHAT_PAY_MCH_ID || '',
  apiV3Key: process.env.WECHAT_PAY_API_V3_KEY || '',
  privateKey: process.env.WECHAT_PAY_PRIVATE_KEY || '',
  serialNo: process.env.WECHAT_PAY_SERIAL_NO || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || 'https://vidluxe.com/api/webhook/wechat',
};

/**
 * 检查微信支付是否已配置
 */
export function isWechatPayConfigured(): boolean {
  return !!(
    wechatPayConfig.appId &&
    wechatPayConfig.mchId &&
    wechatPayConfig.apiV3Key &&
    wechatPayConfig.privateKey
  );
}

/**
 * 获取配置状态（用于调试，不暴露敏感信息）
 */
export function getConfigStatus(): Record<string, boolean> {
  return {
    appId: !!wechatPayConfig.appId,
    mchId: !!wechatPayConfig.mchId,
    apiV3Key: !!wechatPayConfig.apiV3Key,
    privateKey: !!wechatPayConfig.privateKey,
    serialNo: !!wechatPayConfig.serialNo,
    notifyUrl: !!wechatPayConfig.notifyUrl,
  };
}
