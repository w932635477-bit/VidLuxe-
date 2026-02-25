'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-bold mb-4">隐私政策</h1>
        <p className="text-gray-400 mb-12">最后更新：2026年2月24日</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. 信息收集</h2>
            <p className="text-gray-300 leading-relaxed">
              我们收集您使用服务时提供的信息，包括上传的图片和视频文件、联系方式（如邮箱、手机号）、
              以及设备信息（如IP地址、浏览器类型）。这些信息用于提供和改进我们的服务。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. 信息使用</h2>
            <p className="text-gray-300 leading-relaxed">
              我们使用收集的信息来：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>提供图片和视频增强服务</li>
              <li>处理您的订单和付款</li>
              <li>发送服务相关通知</li>
              <li>改进产品功能和用户体验</li>
              <li>防止欺诈和滥用行为</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. 信息共享</h2>
            <p className="text-gray-300 leading-relaxed">
              我们不会将您的个人信息出售给第三方。我们仅在以下情况下共享信息：
              获得您的明确同意、法律法规要求、与帮助我们运营服务的受信任合作伙伴共享
              （如支付处理商、云服务提供商），这些合作伙伴均受保密协议约束。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. 数据安全</h2>
            <p className="text-gray-300 leading-relaxed">
              我们采用行业标准的安全措施保护您的数据，包括数据加密、访问控制、安全审计等。
              您上传的文件在处理完成后会定期删除，我们不会长期存储您的内容。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. 用户权利</h2>
            <p className="text-gray-300 leading-relaxed">
              您有权：
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>访问和下载您的个人数据</li>
              <li>更正不准确的信息</li>
              <li>删除您的账户和相关数据</li>
              <li>撤回对数据处理的同意</li>
              <li>向监管机构投诉</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Cookie 政策</h2>
            <p className="text-gray-300 leading-relaxed">
              我们使用 Cookie 和类似技术来提供、保护和改进我们的服务。
              您可以通过浏览器设置管理 Cookie 偏好，但这可能影响某些功能的使用。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. 儿童隐私</h2>
            <p className="text-gray-300 leading-relaxed">
              我们的服务不面向13岁以下儿童。如果我们发现无意中收集了儿童的信息，
              将会尽快删除相关数据。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">8. 政策更新</h2>
            <p className="text-gray-300 leading-relaxed">
              我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，
              重大变更将通过邮件或站内通知告知您。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">9. 联系我们</h2>
            <p className="text-gray-300 leading-relaxed">
              如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
            </p>
            <p className="text-gray-300 mt-4">
              邮箱：<a href="mailto:privacy@vidluxe.com" className="text-amber-500 hover:text-amber-400">privacy@vidluxe.com</a>
            </p>
          </section>
        </div>

        {/* 底部导航 */}
        <div className="mt-16 pt-8 border-t border-gray-800 flex justify-between text-sm">
          <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
            服务条款
          </Link>
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
