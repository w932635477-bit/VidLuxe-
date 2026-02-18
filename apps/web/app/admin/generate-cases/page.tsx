'use client';

import { useState, useCallback } from 'react';
import {
  CASE_CONFIGS,
  CATEGORIES,
  type CaseCategory,
  type CaseConfig,
} from '@/lib/case-generator';

type GenerationStatus = 'idle' | 'generating-before' | 'generating-after' | 'completed' | 'error';

interface CaseResult {
  config: CaseConfig;
  beforeUrl: string | null;
  afterUrl: string | null;
  status: GenerationStatus;
  error?: string;
}

export default function GenerateCasesPage() {
  const [results, setResults] = useState<Map<string, CaseResult>>(new Map());
  const [apiKey, setApiKey] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CaseCategory | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredConfigs =
    selectedCategory === 'all'
      ? CASE_CONFIGS
      : CASE_CONFIGS.filter((c) => c.category === selectedCategory);

  // 生成单张图片
  const generateImage = useCallback(
    async (prompt: string): Promise<string> => {
      const response = await fetch('https://api.evolink.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'nano-banana-2-lite',
          prompt: prompt.trim().replace(/\s+/g, ' '),
          size: '9:16',
          quality: '2K',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Generation failed');
      }

      const task = await response.json();
      return task.id;
    },
    [apiKey]
  );

  // 轮询任务状态
  const pollTask = useCallback(
    async (taskId: string): Promise<string> => {
      const maxAttempts = 60;
      const interval = 2000;

      for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch(`https://api.evolink.ai/v1/tasks/${taskId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check task status');
        }

        const task = await response.json();

        if (task.status === 'completed' && task.results?.[0]) {
          return task.results[0];
        }

        if (task.status === 'failed') {
          throw new Error('Task failed');
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      throw new Error('Task timeout');
    },
    [apiKey]
  );

  // 生成单个案例
  const generateCase = useCallback(
    async (config: CaseConfig) => {
      if (!apiKey) {
        alert('请输入 API Key');
        return;
      }

      // 初始化状态
      setResults((prev) => {
        const next = new Map(prev);
        next.set(config.id, {
          config,
          beforeUrl: null,
          afterUrl: null,
          status: 'generating-before',
        });
        return next;
      });

      try {
        // 生成原片
        const beforeTaskId = await generateImage(config.beforePrompt);
        const beforeUrl = await pollTask(beforeTaskId);

        setResults((prev) => {
          const next = new Map(prev);
          const existing = next.get(config.id);
          if (existing) {
            next.set(config.id, {
              ...existing,
              beforeUrl,
              status: 'generating-after',
            });
          }
          return next;
        });

        // 生成升级后
        const afterTaskId = await generateImage(config.afterPrompt);
        const afterUrl = await pollTask(afterTaskId);

        setResults((prev) => {
          const next = new Map(prev);
          const existing = next.get(config.id);
          if (existing) {
            next.set(config.id, {
              ...existing,
              afterUrl,
              status: 'completed',
            });
          }
          return next;
        });
      } catch (error) {
        setResults((prev) => {
          const next = new Map(prev);
          const existing = next.get(config.id);
          if (existing) {
            next.set(config.id, {
              ...existing,
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
          return next;
        });
      }
    },
    [apiKey, generateImage, pollTask]
  );

  // 批量生成
  const generateAll = useCallback(async () => {
    if (!apiKey) {
      alert('请输入 API Key');
      return;
    }

    setIsGenerating(true);

    for (const config of filteredConfigs) {
      await generateCase(config);
    }

    setIsGenerating(false);
  }, [filteredConfigs, generateCase, apiKey]);

  // 导出结果为 JSON
  const exportResults = useCallback(() => {
    const data = Array.from(results.values())
      .filter((r) => r.status === 'completed')
      .map((r) => ({
        id: r.config.id,
        category: r.config.category,
        categoryLabel: r.config.categoryLabel,
        beforeUrl: r.beforeUrl,
        afterUrl: r.afterUrl,
        recommendedStyle: r.config.recommendedStyle,
      }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cases.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [results]);

  return (
    <main className="min-h-screen bg-dark-bg p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">案例生成器</h1>
        <p className="text-content-secondary mb-8">
          使用 Nano Banana API 生成演示案例图片
        </p>

        {/* 配置区 */}
        <div className="glass-card mb-8">
          <div className="glass-card-inner">
            <div className="grid md:grid-cols-3 gap-4">
              {/* API Key */}
              <div>
                <label className="block text-sm text-content-secondary mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-content-tertiary focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* 分类筛选 */}
              <div>
                <label className="block text-sm text-content-secondary mb-2">
                  分类筛选
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as CaseCategory | 'all')
                  }
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="all">全部分类</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-end gap-2">
                <button
                  onClick={generateAll}
                  disabled={isGenerating || !apiKey}
                  className="btn-primary py-2 px-4 text-sm disabled:opacity-50"
                >
                  {isGenerating ? '生成中...' : '批量生成'}
                </button>
                <button
                  onClick={exportResults}
                  className="btn-secondary py-2 px-4 text-sm"
                >
                  导出 JSON
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 案例列表 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConfigs.map((config) => {
            const result = results.get(config.id);

            return (
              <div key={config.id} className="glass-card">
                <div className="glass-card-inner">
                  {/* 分类标签 */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-content-secondary">
                      {config.categoryLabel}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-brand-500/20 text-brand-500">
                      {config.id}
                    </span>
                  </div>

                  {/* 生成结果 */}
                  {result ? (
                    <div className="space-y-4">
                      {/* 状态 */}
                      <div className="text-sm">
                        {result.status === 'generating-before' && (
                          <span className="text-yellow-500">生成原片中...</span>
                        )}
                        {result.status === 'generating-after' && (
                          <span className="text-blue-500">生成升级后...</span>
                        )}
                        {result.status === 'completed' && (
                          <span className="text-green-500">✓ 已完成</span>
                        )}
                        {result.status === 'error' && (
                          <span className="text-red-500">✗ {result.error}</span>
                        )}
                      </div>

                      {/* 图片预览 */}
                      {result.status === 'completed' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-content-tertiary mb-1">原片</p>
                            <img
                              src={result.beforeUrl!}
                              alt="原片"
                              className="w-full aspect-9-16 object-cover rounded-lg"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-content-tertiary mb-1">升级后</p>
                            <img
                              src={result.afterUrl!}
                              alt="升级后"
                              className="w-full aspect-9-16 object-cover rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => generateCase(config)}
                      disabled={!apiKey || isGenerating}
                      className="w-full py-8 border-2 border-dashed border-white/20 rounded-lg text-content-tertiary hover:border-brand-500 hover:text-brand-500 transition-colors disabled:opacity-50"
                    >
                      点击生成
                    </button>
                  )}

                  {/* 推荐风格 */}
                  <div className="mt-4 text-xs text-content-tertiary">
                    推荐风格：{config.recommendedStyle}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 使用说明 */}
        <div className="mt-12 glass-card">
          <div className="glass-card-inner">
            <h2 className="text-lg font-medium text-white mb-4">使用说明</h2>
            <ol className="space-y-2 text-content-secondary text-sm">
              <li>1. 输入 Nano Banana API Key</li>
              <li>2. 选择要生成的分类（或生成全部）</li>
              <li>3. 点击"批量生成"或单独生成每个案例</li>
              <li>4. 等待生成完成后，点击"导出 JSON"</li>
              <li>5. 将导出的 cases.json 放入 public/cases/ 目录</li>
              <li>6. 更新 HeroSection 和 GallerySection 组件使用新的图片 URL</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg">
              <p className="text-yellow-500 text-sm">
                ⚠️ 注意：生成的图片 URL 有效期为 24 小时，请及时下载保存到自己的存储服务
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
