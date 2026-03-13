/**
 * Next.js Instrumentation Hook
 * 用于在服务器启动时初始化全局配置
 */

export async function register() {
  // 仅在服务器端运行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 为 standalone 模式添加 File API polyfill
    // Node.js 20+ 提供了实验性的 buffer.File
    if (typeof globalThis.File === 'undefined') {
      try {
        // Node.js 20+ 提供 buffer.File
        const { File } = await import('buffer');
        globalThis.File = File as unknown as typeof globalThis.File;
        console.log('[Instrumentation] File polyfill applied successfully from buffer');
      } catch (bufferError) {
        try {
          // 回退到 undici
          // @ts-expect-error undici dynamic import
          const { File } = await import('undici');
          globalThis.File = File as unknown as typeof globalThis.File;
          console.log('[Instrumentation] File polyfill applied successfully from undici');
        } catch (undiciError) {
          console.error('[Instrumentation] Failed to apply File polyfill:', { bufferError, undiciError });
        }
      }
    }
  }
}
