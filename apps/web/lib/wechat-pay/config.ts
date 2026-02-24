/**
 * 微信支付配置
 */
export const wechatPayConfig = {
  appId: process.env.WECHAT_PAY_APP_ID || '',
  mchId: process.env.WECHAT_PAY_MCH_ID || '',
  apiKey: process.env.WECHAT_PAY_API_KEY || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || 'https://vidluxe.com/api/webhook/wechat',
};

/**
 * 检查微信支付是否已配置
 */
export function isWechatPayConfigured(): boolean {
  return !!(wechatPayConfig.appId && wechatPayConfig.mchId && wechatPayConfig.apiKey);
}
