/**
 * API 输入验证 Schema
 *
 * 使用 Zod 进行类型安全的输入验证
 */

import { z } from 'zod';

// 预设风格
export const presetStyleSchema = z.enum(['magazine', 'soft', 'urban', 'minimal', 'vintage', 'warmLuxury', 'coolPro', 'morandi']);

// 内容类型
export const contentTypeSchema = z.enum(['image', 'video']);

// 风格来源类型
export const styleSourceTypeSchema = z.enum(['reference', 'preset']);

// URL 验证（支持相对路径和绝对 URL）
export const urlSchema = z.string()
  .min(1, 'URL is required')
  .max(2048, 'URL too long')
  .refine(
    (url) => {
      // 允许相对路径
      if (url.startsWith('/') || url.startsWith('./')) {
        return true;
      }
      // 允许 http/https URL
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: 'Invalid URL format' }
  );

// 匿名 ID 验证
export const anonymousIdSchema = z.string()
  .min(1, 'Anonymous ID is required')
  .max(64, 'Anonymous ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid anonymous ID format');

// 内容 Schema
export const contentSchema = z.object({
  type: contentTypeSchema,
  url: urlSchema,
});

// 风格来源 Schema
export const styleSourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('preset'),
    presetStyle: presetStyleSchema,
  }),
  z.object({
    type: z.literal('reference'),
    referenceUrl: urlSchema,
  }),
]);

// 增强请求 Schema
export const enhanceRequestSchema = z.object({
  content: contentSchema,
  styleSource: styleSourceSchema,
  anonymousId: anonymousIdSchema,
});

// 类型导出
export type EnhanceRequest = z.infer<typeof enhanceRequestSchema>;
export type ContentInput = z.infer<typeof contentSchema>;
export type StyleSourceInput = z.infer<typeof styleSourceSchema>;
export type PresetStyle = z.infer<typeof presetStyleSchema>;
export type ContentType = z.infer<typeof contentTypeSchema>;

/**
 * 验证辅助函数
 */
export function validateEnhanceRequest(data: unknown): {
  success: true;
  data: EnhanceRequest;
} | {
  success: false;
  error: string;
} {
  const result = enhanceRequestSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // 提取第一个错误信息
  const firstError = result.error.issues[0];
  const errorMessage = firstError
    ? `${firstError.path.join('.')}: ${firstError.message}`
    : 'Validation failed';

  return { success: false, error: errorMessage };
}
