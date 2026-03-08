# Prompt 工程指南

## 如述

VidLuxe 使用分层 Prompt 系统，确保风格一致性和可扩展性。

## Prompt 结构

```
基础风格 Prompt + 内容类型关键词 + 效果预设模板 + 负面 Prompt
```

## 鼴格级别

### 1. 基础风格 (style-prompts.ts)
- `magazine`: 杂志大片风格
- `soft`: 日系温柔风格
- `urban`: 都市职场风格
- `vintage`: 复古胶片风格

### 2. 内容类型增强 (content-types.ts)
```typescript
// 穿搭
keywords: 'fashion photography, outfit details, street style...'

// 美妆
keywords: 'beauty close-up, makeup details, skin texture...'

// 探店
keywords: 'interior atmosphere, cozy vibe, lifestyle...'

// 旅游
keywords: 'travel photography, landscape, scenic view...'

// 美食
keywords: 'food photography, appetizing, warm lighting...'
```

### 3. 效果预设 (effect-presets.ts)
完整的 Prompt 模板，包含具体风格描述。

## 最佳实践

1. **Prompt 鑑优顺序**: 韱体部分最重要
2. **负面 Prompt**: 始终包含 `amateur, low quality, blurry`
3. **2K 质量标签**: 大多数 Prompt 结尾添加 `2K quality`
4. **风格关键词**: 使用具体品牌/杂志名增强风格感

## 示例

```typescript
// 完整 Prompt 构建
const prompt = `
  ${baseStylePrompt}
  ${contentTypeKeywords}
  ${effectPromptTemplate}
  2K quality
`.trim();

// 负面 Prompt
const negativePrompt = `
  amateur, low quality, blurry, distorted, ugly,
  bad anatomy, bad proportions, watermark, signature
`;
```

## 常见问题

1. **Prompt 过长**: 訡型可能截断，保持简洁
2. **风格冲突**: 不同层级 Prompt 要一致
3. **忽略负面 Prompt**: 质量明显下降
