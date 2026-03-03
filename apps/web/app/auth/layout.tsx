// 禁用静态渲染，确保 auth 页面始终动态生成
// 这样 redirect 参数才能正确工作
export const dynamic = 'force-dynamic';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
