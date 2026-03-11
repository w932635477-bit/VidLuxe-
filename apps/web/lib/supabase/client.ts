/**
 * Supabase 浏览器端客户端
 * 用于客户端组件中的认证和数据操作
 *
 * 使用单例模式避免 React Strict Mode 下的锁冲突：
 * - Strict Mode 会双重挂载组件
 * - 如果每次渲染都创建新客户端，会导致 gotrue-js 锁竞争
 * - 单例确保整个应用共享同一个客户端实例
 */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
