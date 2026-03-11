/**
 * Next.js Instrumentation Hook
 * 用于在服务器启动时初始化全局配置
 */

export async function register() {
  // 仅在服务器端运行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 为 standalone 模式添加 File API polyfill
    // Next.js standalone 模式下，Node.js 的 File API 不可用
    if (typeof globalThis.File === 'undefined') {
      try {
        // 动态导入 undici 的 File
        const { File } = await import('undici');
        globalThis.File = File as unknown as typeof globalThis.File;
        console.log('[Instrumentation] File polyfill applied successfully');
      } catch (error) {
        console.error('[Instrumentation] Failed to apply File polyfill:', error);
      }
    }
  }
}
