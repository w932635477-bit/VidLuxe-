/**
 * Try Layout - 强制动态渲染
 *
 * 防止 CDN 缓存 /try 页面
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function TryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
