'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* 返回链接 */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        <h1 className="text-4xl font-bold mb-4">服务条款</h1>
        <p className="text-gray-400 mb-12">最后更新：2026年2月24日</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. 服务说明</h2>
            <p className="text-gray-300 leading-relaxed">
              VidLuxe 是一款 AI 驱动的内容增强工具，帮助用户提升图片和视频的视觉效果。
              使用本服务即表示您同意遵守本服务条款。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. 账户注册</h2>
            <p className="text-gray-300 leading-relaxed">
              使用本服务需要注册账户。您同意：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>提供真实、准确的信息</li>
              <li>保护账户密码安全</li>
              <li>对账户下的所有活动负责</li>
              <li>及时通知我们任何未经授权的使用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. 使用规则</h2>
            <p className="text-gray-300 leading-relaxed">
              您同意不会：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>上传违法、侵权或有害内容</li>
              <li>侵犯他人知识产权或隐私权</li>
              <li>尝试破坏或干扰服务正常运行</li>
              <li>使用自动化工具批量处理内容</li>
              <li>将服务用于任何非法目的</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. 知识产权</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>您的内容：</strong>您保留对上传内容的所有权。通过上传内容，
              您授予我们处理该内容以提供服务的有限许可。
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>生成的作品：</strong>通过我们的 AI 服务生成的增强内容归您所有。
              我们不会声称对生成内容的所有权。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. 付费服务</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>订阅计划：</strong>部分功能需要付费订阅。订阅将自动续费，
              除非您在续费日期前取消。
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong>退款政策：</strong>虚拟商品一经消费不支持退款，
              未使用的订阅期可申请部分退款。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. 免费额度</h2>
            <p className="text-gray-300 leading-relaxed">
              我们为新用户提供免费体验额度。免费额度：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>每24小时重置</li>
              <li>不可累积或转让</li>
              <li>仅限个人非商业使用</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. 服务保证</h2>
            <p className="text-gray-300 leading-relaxed">
              我们努力提供高质量服务，但不保证：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>服务不会中断或无错误</li>
              <li>处理结果完全符合您的期望</li>
              <li>服务将满足您的所有需求</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. 责任限制</h2>
            <p className="text-gray-300 leading-relaxed">
              在法律允许的最大范围内，我们不对任何间接、偶然、特殊或后果性损害承担责任。
              我们的总责任不超过您在过去12个月内支付的费用。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. 服务变更与终止</h2>
            <p className="text-gray-300 leading-relaxed">
              我们保留随时修改或终止服务的权利。重大变更将提前通知。
              如您违反本条款，我们可能暂停或终止您的账户。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">10. 争议解决</h2>
            <p className="text-gray-300 leading-relaxed">
              因本条款引起的争议应首先通过友好协商解决。
              如协商不成，可向我们所在地有管辖权的人民法院提起诉讼。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">11. 其他条款</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>本条款构成您与我们之间的完整协议</li>
              <li>我们未行使任何权利不构成放弃该权利</li>
              <li>如本条款任何条款被认定无效，其余条款仍然有效</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">12. 联系我们</h2>
            <p className="text-gray-300 leading-relaxed">
              如果您对本服务条款有任何疑问，请通过以下方式联系我们：
            </p>
            <p className="text-gray-300 mt-4">
              邮箱：<a href="mailto:legal@vidluxe.com" className="text-amber-500 hover:text-amber-400">legal@vidluxe.com</a>
            </p>
          </section>
        </div>

        {/* 底部导航 */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex justify-between text-sm">
          <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
            隐私政策
          </Link>
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
