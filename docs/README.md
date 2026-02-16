# VidLuxe 技术文档

> Premium Video Enhancement Engine - 视频高级感优化引擎

## 概述

VidLuxe 是一个基于 AI 的视频高级感优化引擎，通过深度学习从优质视频中学习风格特征，自动生成评分并提供智能优化建议。

## 文档导航

| 文档 | 说明 | 状态 |
|------|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构设计 | ✅ |
| [API.md](./API.md) | API 设计规范 | ✅ |
| [DATA_MODELS.md](./DATA_MODELS.md) | 数据模型设计 | ✅ |
| [FRONTEND.md](./FRONTEND.md) | 前端技术规范 | ✅ |
| [TESTING.md](./TESTING.md) | 测试策略 | ✅ |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 部署方案 | ✅ |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南 | ✅ |
| [EVALUATION.md](./EVALUATION.md) | **AI 学习实施评估** | 🆕 |

### 模块文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [MODULES/analyzer.md](./MODULES/analyzer.md) | 分析引擎 | ✅ |
| [MODULES/scorer.md](./MODULES/scorer.md) | 评分引擎 | ✅ |
| [MODULES/processor.md](./MODULES/processor.md) | 处理引擎 | ✅ |
| [MODULES/enhancer.md](./MODULES/enhancer.md) | 增强引擎 | ✅ |
| [MODULES/learning.md](./MODULES/learning.md) | **AI 学习引擎** | 🆕 |

## 技术栈

```yaml
框架: Next.js 14 (App Router)
语言: TypeScript 5.3+
视频处理: Remotion + FFmpeg
AI 学习: CLIP + NIMA + B-LoRA
向量数据库: Supabase pgvector
Monorepo: pnpm + Turborepo
测试: Vitest + Playwright
部署: Vercel + Supabase
```

## 项目结构

```
VidLuxe/
├── apps/
│   └── web/                 # Next.js 应用
├── packages/
│   ├── types/               # 类型定义
│   ├── core/                # 核心引擎
│   ├── learning/            # AI 学习引擎 🆕
│   ├── api/                 # tRPC API
│   └── ui/                  # UI 组件
├── docs/                    # 技术文档
└── pnpm-workspace.yaml
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 运行测试
pnpm test

# 构建生产版本
pnpm build
```

## 开发阶段

### MVP (当前)
- [x] 核心类型定义 (@vidluxe/types)
- [x] 色彩分析器 (ColorAnalyzer)
- [x] 评分引擎 (PremiumScorer)
- [x] 颜色规则库 (ColorRules)

### Phase 2 - AI 学习引擎 🆕
- [ ] CLIP 特征提取器 (FeatureExtractor)
- [ ] NIMA 美学评估器 (AestheticScorer)
- [ ] 风格向量存储 (VectorStore)
- [ ] 风格匹配器 (StyleMatcher)
- [ ] 风格迁移引擎 (StyleTransferEngine)

### Phase 3 - 多维度分析
- [ ] 排版分析器 (TypographyAnalyzer)
- [ ] 构图分析器 (CompositionAnalyzer)
- [ ] 动效分析器 (MotionAnalyzer)
- [ ] 音频分析器 (AudioAnalyzer)
- [ ] 细节分析器 (DetailAnalyzer)

### Phase 4 - 视频增强
- [ ] 视频增强引擎
- [ ] Remotion 集成
- [ ] WebCodecs 处理

## 许可证

MIT
