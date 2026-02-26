/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 部署需要 standalone 输出
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.evolink.ai',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
    // 跳过图片优化，直接使用原图
    unoptimized: true,
  },
  // 将使用 WebAssembly 的包排除在 bundler 之外
  serverExternalPackages: ['@imgly/background-removal'],
  // Webpack 配置
  webpack: (config, { isServer }) => {
    // 排除 WASM 相关的包
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('@imgly/background-removal');
      }
    }
    return config;
  },
};

export default nextConfig;
