---
name: vidluxe-dev
description: "VidLuxe 开发指南：AI 图片/视频升级引擎。包括流程编排、效果预设、API 集成、评分系统、Prompt 工程。Use when: 处理 image-single/video flow、添加效果预设、调试 Nano Banana API、修改 scorer、优化 prompt。"
---

# VidLuxe 开发 Skill

AI 驱动的高级感升级引擎开发指南，帮助小红书博主将普通素材一键升级为杂志级质感内容。

## When to Use This Skill

触发此 Skill：
- 开发/调试图片升级流程 (`ImageSingleFlow`) 或视频流程 (`VideoFlow`)
- 添加新的效果预设 (`EffectPreset`) 或内容类型 (`ContentType`)
- 调用 Nano Banana API 进行图片生成
- 修改评分系统 (`scorer`) 或种草力评估
- 处理关键帧提取、视频合成
- 修复额度系统、支付流程问题
- **优化 Prompt 工程** - 减少token、提升风格一致性

## Not For / Boundaries

**不处理：**
- 前端 UI 组件设计（除非涉及流程逻辑）
- 运维部署（参考 DEPLOY_PROGRESS.md）
- 数据库迁移（除非涉及业务逻辑）
- 第三方服务配置（微信支付、OSS 等）

**必问问题：**
1. 修改涉及图片还是视频流程？
2. 是添加新功能还是修复 bug？
3. 有没有具体的错误信息？

## Quick Reference

### 项目启动

```bash
pnpm web          # 启动 Web 开发服务器
pnpm build        # 构建生产版本
pnpm test         # 运行测试
```

### 核心流程类型

```typescript
// apps/web/lib/types/flow.ts
type FlowType = 'image-single' | 'video';

type ImageSingleStep = 'upload' | 'recognition' | 'style' | 'processing' | 'result';
type VideoStep = 'upload' | 'recognition' | 'style' | 'keyframe' | 'processing' | 'result';

type ContentType = 'outfit' | 'beauty' | 'cafe' | 'travel' | 'food';
type StyleType = 'magazine' | 'soft' | 'urban' | 'vintage';
```

### 效果预设系统

```typescript
// apps/web/lib/effect-presets.ts
interface EffectPreset {
  id: string;              // 'outfit-magazine'
  name: string;            // '杂志大片 · 高级奢华'
  shortName: string;       // '杂志大片'
  contentType: ContentType;
  preview: { before: string; after: string; };
  promptTemplate: string;
  negativePrompt: string;
  popularity: number;
  isHot: boolean;
  accentColor: string;
}

// 获取效果
getEffectsByContentType(contentType)
getDefaultEffectId(contentType)
```

### Prompt 工程快速参考

```typescript
// 1. 模块化构建 Prompt
builder = PromptBuilder()
builder.add_content_type("outfit")
builder.add_style("magazine")
builder.add_intensity(80)
prompt = builder.build()

// 2. Token 优化
"high-quality" → "HQ"
"professional photography" → "pro photo"
"magazine cover style" → "magazine"

// 3. 风格关键词
magazine: ["luxury", "premium", "editorial", "vogue"]
soft: ["gentle", "natural", "muted", "dreamy"]
urban: ["professional", "clean", "modern", "minimal"]
vintage: ["film", "grain", "warm", "nostalgic"]

// 4. 一致性验证
validate_prompt_consistency(prompt, style)
auto_fix_prompt(prompt, style)  // 自动修正
```

### Nano Banana API

```typescript
// 创建任务
POST /v1/images/generations
{
  model: 'nano-banana-2-lite',
  prompt: string,
  image_urls?: string[],
  size: '9:16' | '1:1' | '16:9',
  quality: '1K' | '2K' | '4K'
}

// 查询状态
GET /v1/tasks/{task_id}
Response: { status, progress, results?, error? }
```

### 常用调试命令

```bash
# 查看服务日志
pm2 logs vidluxe --lines 100

# 测试 API
curl http://localhost:3000/api/health

# 检查 Nano Banana API
curl -H "Authorization: Bearer $NANO_BANANA_API_KEY" \
  https://api.evolink.ai/v1/tasks/{task_id}
```

## Rules & Constraints

- **MUST**: Nano Banana API Key 仅服务端使用 (`NANO_BANANA_API_KEY`)
- **MUST**: 图片 URL 必须公网可访问
- **MUST**: Prompt 保持风格一致性 (验证关键词)
- **SHOULD**: 使用 2K 质量，9:16 比例
- **SHOULD**: 压缩 Prompt 减少 token 消耗
- **NEVER**: 客户端暴露 API Key
- **NEVER**: 跳过超时处理和重试机制

## Examples

### Example 1: 添加新效果预设

- **Input**: 添加 "街头酷感" 风格到穿搭类型
- **Steps**:
  1. 在 `effect-presets.ts` 中添加新预设:
     ```typescript
     {
       id: 'outfit-street-cool',
       name: '街头酷感 · 高对比度',
       shortName: '街头酷感',
       contentType: 'outfit',
       promptTemplate: 'High-fashion street photography...',
       negativePrompt: 'soft, pastel, gentle...',
       isHot: false,
     }
     ```
  2. 添加预览图到 `/public/comparisons/`
  3. 运行测试验证效果显示正常
- **Acceptance**: 新效果在选择器中显示，可正常使用

### Example 2: 优化 Prompt Token 消耗

- **Input**: 当前 prompt 过长，需要压缩
- **Steps**:
  1. 使用 Token 优化规则:
     ```
     "high-quality" → "HQ"
     "professional photography" → "pro photo"
     ```
  2. 验证风格关键词一致性
  3. 测试生成效果是否保持质量
- **Acceptance**: Token 减少 20%+，效果质量不降低

### Example 3: 调试 API 超时问题

- **Input**: 用户反馈图片处理经常超时
- **Steps**:
  1. 检查日志: `pm2 logs vidluxe`
  2. 检查图片 URL 是否可访问: `curl -I {image_url}`
  3. 增加 timeout.total 配置
  4. 添加客户端超时提示
- **Acceptance**: 超时率下降，用户有明确反馈

## Troubleshooting

| 症状 | 可能原因 | 诊断 | 修复 |
|------|---------|------|------|
| API 超时 | 网络问题/图片过大 | `pm2 logs vidluxe` | 增加 timeout，压缩图片 |
| 图片 URL 错误 | 本地路径未上传 | 检查 `isPublicUrl()` | 上传到图床 |
| 风格不一致 | Prompt 缺少关键词 | `validate_prompt_consistency()` | 添加风格关键词 |
| 评分异常 | 图片处理失败 | 检查 scorer 输入 | 添加错误边界 |

## References

- `references/index.md`: 参考文档导航
- `references/prompt-patterns.md`: **Prompt 工程模式库** (推荐)
- `references/api-nano-banana.md`: Nano Banana API 详细文档
- `references/flow-diagrams.md`: 流程架构图解
- `references/troubleshooting.md`: 完整故障排查

## Maintenance

- Sources: 项目源码 + Nano Banana API 文档 + wshobson-prompt-engineering-patterns
- Last updated: 2025-03-07
- Known limits: 视频流程的背景移除功能为可选，MVP 阶段可能不稳定

## Quality Gate

Minimum checks before shipping:
1. `description` 包含触发关键词
2. Prompt 风格一致性验证通过
3. Token 消耗在合理范围
4. 测试覆盖核心流程
5. 错误处理完善
