# VidLuxe 技术文档

> Premium Video Enhancement Engine - 视频高级感优化引擎

## 概述

VidLuxe 是一个基于 AI 的视频高级感生成引擎，采用**渐进式混合架构**，通过 B-LoRA 学习风格，Nano Banana/SDXL 生成素材，Remotion 合成视频。

> **核心理念**："先用成熟 API 快速验证商业价值，再逐步自建技术壁垒"

## 文档导航

| 文档 | 说明 | 状态 |
|------|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构设计（渐进式） | ✅ |
| [API.md](./API.md) | API 设计规范 | ✅ |
| [DATA_MODELS.md](./DATA_MODELS.md) | 数据模型设计 | ✅ |
| [FRONTEND.md](./FRONTEND.md) | 前端技术规范 | ✅ |
| [TESTING.md](./TESTING.md) | 测试策略 | ✅ |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 部署方案 | ✅ |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南 | ✅ |
| [EVALUATION.md](./EVALUATION.md) | **实施评估（渐进式方案）** | ✅ |
| [DECISION_FINAL.md](./DECISION_FINAL.md) | **最终决策分析** | 🆕 |
| [ALTERNATIVE_ANALYSIS.md](./ALTERNATIVE_ANALYSIS.md) | **方案对比分析** | 🆕 |

### 模块文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [MODULES/analyzer.md](./MODULES/analyzer.md) | 分析引擎 | ✅ |
| [MODULES/scorer.md](./MODULES/scorer.md) | 评分引擎 | ✅ |
| [MODULES/processor.md](./MODULES/processor.md) | 处理引擎 | ✅ |
| [MODULES/enhancer.md](./MODULES/enhancer.md) | 增强引擎 | ✅ |
| [MODULES/learning.md](./MODULES/learning.md) | **AI 学习引擎（B-LoRA）** | ✅ |
| [MODULES/generator.md](./MODULES/generator.md) | **AI 生成引擎** | 🆕 |

### 实施文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [IMPLEMENTATION/BLORA_INTEGRATION.md](./IMPLEMENTATION/BLORA_INTEGRATION.md) | **B-LoRA 风格学习集成** | 🆕 |
| [IMPLEMENTATION/NANOBANANA_API.md](./IMPLEMENTATION/NANOBANANA_API.md) | **Nano Banana API 封装** | 🆕 |
| [IMPLEMENTATION/REMOTION_TEMPLATES.md](./IMPLEMENTATION/REMOTION_TEMPLATES.md) | **Remotion 视频模板** | 🆕 |
| [IMPLEMENTATION/MODNET_INTEGRATION.md](./IMPLEMENTATION/MODNET_INTEGRATION.md) | **MODNet 抠像集成** | 🆕 |
| [IMPLEMENTATION/PROMPT_ENGINEERING.md](./IMPLEMENTATION/PROMPT_ENGINEERING.md) | **Prompt 工程指南** | 🆕 |
| [IMPLEMENTATION/WORKFLOW.md](./IMPLEMENTATION/WORKFLOW.md) | **端到端工作流设计** | 🆕 |
| [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md) | **工作流程图（Mermaid）** | 🆕 |

## 渐进式技术方案

### MVP 阶段（0-3 月）
```yaml
风格学习: B-LoRA（单图学习）⭐ 核心升级
素材生成: Nano Banana API
人物抠像: MODNet API
视频合成: Remotion Lambda
成本: ~$100/月，~$0.25/视频
```

### 标准阶段（3-6 月）
```yaml
风格学习: B-LoRA（保持）
素材生成: SDXL + B-LoRA（自部署）
视频风格: + AnimateDiff
成本: ~$150/月，~$0.10/视频
```

### 专业阶段（6-12 月）
```yaml
全流程: ComfyUI 工作流
差异化: 自训练风格模型
成本: ~$200/月，~$0.05/视频
```

## 技术栈

```yaml
框架: Next.js 14 (App Router)
语言: TypeScript 5.3+
风格学习: B-LoRA (SDXL + LoRA)
素材生成: Nano Banana / SDXL
视频处理: Remotion + FFmpeg
人物抠像: MODNet
部署: Vercel + Supabase + Modal
```

## 项目结构

```
VidLuxe/
├── apps/
│   └── web/                 # Next.js 应用
├── packages/
│   ├── types/               # 类型定义
│   ├── core/                # 核心引擎
│   ├── learning/            # AI 学习引擎（B-LoRA）
│   ├── generator/           # AI 生成引擎 🆕
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

### MVP 阶段（当前）
- [x] 核心类型定义 (@vidluxe/types)
- [x] 色彩分析器 (ColorAnalyzer)
- [x] 评分引擎 (PremiumScorer)
- [ ] **B-LoRA 风格学习器** 🆕
- [ ] **Nano Banana 生成器** 🆕
- [ ] **MODNet 抠像集成**
- [ ] **Remotion 视频合成**

### 标准阶段
- [ ] SDXL + B-LoRA 自部署
- [ ] AnimateDiff 风格迁移
- [ ] 成本优化

### 专业阶段
- [ ] ComfyUI 工作流
- [ ] 自训练风格模型
- [ ] 技术壁垒建立

## 许可证

MIT
