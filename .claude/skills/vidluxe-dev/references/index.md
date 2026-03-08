# VidLuxe 开发参考文档

## 核心文档

| 文档 | 描述 |
|------|------|
| [prompt-patterns.md](prompt-patterns.md) | **Prompt 工程模式库** (推荐) |
| [api-nano-banana.md](api-nano-banana.md) | Nano Banana API 集成文档 |
| [prompt-engineering.md](prompt-engineering.md) | Prompt 工程最佳实践 |
| [flow-diagrams.md](flow-diagrams.md) | 流程架构图解 |
| [troubleshooting.md](troubleshooting.md) | 常见问题排查 |

## 代码位置

| 模块 | 路径 | 描述 |
|------|------|------|
| 流程类型 | `lib/types/flow.ts` | FlowType,Step 类型定义 |
| 效果预设 | `lib/effect-presets.ts` | EffectPreset 配置 |
| 内容类型 | `lib/content-types.ts` | ContentType 配置 |
| 工作流 | `lib/workflow.ts` | 图片/视频处理逻辑 |
| 评分器 | `lib/scorer.ts` | 高级感评分算法 |
| 图片流程 | `components/features/try/flows/ImageSingleFlow/` | 单图处理流程 |
| 视频流程 | `components/features/try/flows/VideoFlow/` | 视频处理流程 |

## 外部资源

- [Claude Skills 官方文档](https://support.claude.com/en/articles/12512176-what-are-skills)
- [Nano Banana API](https://api.evolink.ai/docs)

## 使用建议

1. 鷻加新功能: 参考 [flow-diagrams.md] 了解架构
2. 跻加新风格: 参考 [prompt-engineering.md] 和 [api-nano-banana.md]
3. 修复 Bug: 参考 [troubleshooting.md]
