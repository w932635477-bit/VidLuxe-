/**
 * Supabase 服务端客户端
 * 用于 Server Components 和 API Routes 中的认证和数据操作
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 中调用时可能会失败，可以忽略
            // 这种情况通常发生在尝试设置 cookie 但响应已经发送时
          }
        },
      },
    }
  )
}
