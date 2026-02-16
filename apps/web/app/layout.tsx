import PremiumScoreCard from './components/PremiumScoreCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="p-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-2">
          VidLuxe
        </h1>
        <p className="text-gray-400 text-xl">
          Premium Video Engine - 让你的视频瞬间变得高级
        </p>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <section className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white mb-6">
              上传视频
            </h2>
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center hover:border-orange-500 transition-colors cursor-pointer">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-gray-300 text-lg mb-2">
                拖拽视频文件到这里
              </p>
              <p className="text-gray-500 text-sm">
                或点击选择文件
              </p>
            </div>
          </section>

          {/* Score Preview */}
          <section>
            <PremiumScoreCard />
          </section>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <FeatureCard
            icon="🎨"
            title="色彩高级感"
            description="智能分析色彩饱和度、和谐度，一键优化至高级感标准"
          />
          <FeatureCard
            icon="📊"
            title="六维度评分"
            description="色彩、排版、构图、动效、音频、细节，全方位诊断"
          />
          <FeatureCard
            icon="✨"
            title="一键升级"
            description="选择风格，调整强度，瞬间让你的视频变得高级"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500">
        <p>VidLuxe v0.1.0 - Premium Video Engine</p>
      </footer>
    </main>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800/30 rounded-xl p-6 backdrop-blur hover:bg-gray-800/50 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
