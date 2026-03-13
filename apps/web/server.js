/**
 * 服务器启动脚本
 * 在服务器启动时全局注入 undici File polyfill
 * 解决 Next.js standalone 模式下 File API 不可用的问题
 */

// @ts-nocheck require-any
import { File } from 'undici';

if (!globalThis.File) {
  globalThis.File = File;
}

console.log('[Server] File polyfill applied successfully');
