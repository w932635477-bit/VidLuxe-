# Nano Banana API 錆成文档

## 如述

Nano Banana 是 VidLuxe 的 AI 图片生成引擎。

## 配置
```typescript
// apps/web/lib/workflow.ts
const NANO_BANANA_CONFIG = {
  baseUrl: 'https://api.evolink.ai',
  apiKey: process.env.NANO_BANANA_API_KEY, // 服务端专用
  model: 'nano-banana-2-lite',
  timeout: {
    create: 30000,    // 创建任务 30s
    poll: 10000,        // 轮询单次 10s
    total: 180000,    // 总超时 3 分钟
  },
  maxPollAttempts: 90,
  pollInterval: 2000,    // 2秒
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 4000,
  },
};
```

## API 稡型

**nano-banana-2-lite**
- 支持 Text-to-image（带 image_urls 参数）
- 支持 pure text生成
- 输出格式: 2K (推荐) / 1K / 4K
- 支持 9:16 绚动比例（竖版适合小红书)

- 支持 3:4 / 16:9 (横版适合视频背景)

- 支持 1:1 (正方形)
- 支持 16:9 / 4:3 / 1920x1080 (横向视频)
- 支持 4:3 / 16 竖动比例（竖版视频封面)

- 支持 16:9 / 4:3 / 1920x1080 (横向视频)
- 支持 1:1 / 4:3 / 1920x1080 (超宽屏)

- 支持 3:4 / 16 / 1:1 / 2:1 / 16:9 / 9:16 / 4:3 / 16:9

- 支持 1K / 2K / 4K 质量

- 支持 1K / 2K（推荐)
- 支持 2K
- 支持 4K

- 4K 质量输出细节更好但但生成时间更长

- 超时时间: 1K 8-15s, 2K 20-30s, 4K 45-60s

- 总超时: 3 分钟（180秒）
## API 调用流程

### 1. 创建任务
```bash
POST /v1/images/generations
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "model": "nano-banana-2-lite",
  "prompt": "<prompt text>",
  "image_urls": ["<image URL>"],  // 可选，用于 I2I
  "size": "9:16",           // 比例格式
  "quality": "2K"           // 质量等级
}
```
**响应:**
```json
{
  "id": "task-uuid",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```
### 2. 查询任务状态
```bash
GET /v1/tasks/{task_id}
Authorization: Bearer <API_KEY>
```
**响应:**
```json
{
  "id": "task-uuid",
  "status": "pending | processing | completed | failed",
  "progress": 0-100,
  "results": ["<image URL>"]  // 仅当 status=completed 时
}
```
### 3. 轮询直到完成
```typescript
// 推荐: 每 2 秒轮询一次，最多 90 次
while (status !== 'completed') {
  await delay(2000);
  status = await getTaskStatus(taskId);

  if (status === 'failed') {
    throw new Error('Generation failed');
  }
}
```
## 错误处理
| 错误类型 | 億理方法 |
|--------|------|
| 401 Bad Request | 检查 prompt 是否过长、 检查 image_urls 格式 |
| 401 Unauthorized | 检查 API Key 是否有效 |
| 429 Too Many Requests | 实现速率限制 |
| 500+ Server Error | 指数退避重试（最多 3 次， 1s-2s-4s 延迟） |
| Timeout | 壞超时时间到 180s |
| Network Error | 重试请求 |

## 跻加新效果预设

### 步骤
1. 在 `effect-presets.ts` 中添加新预设:
```typescript
export const OUTFIT_EFFECTS: EffectPreset[] = [
  {
    id: 'outfit-new-style',
    name: '新风格 · 描述',
    shortName: '新风格',
    contentType: 'outfit',
    preview: {
      before: '/comparisons/before.jpg',
      after: '/comparisons/after.jpg',
    },
    promptTemplate: 'Prompt template...',
    negativePrompt: 'negative prompt...',
    popularity: 500,
    isHot: false,
    accentColor: '#HEXCOLOR',
  },
];
```
2. 更新 `E6-presets-by-type` 映射
3. 添加预览图到 `/public/comparisons/` 目录
4. 运行测试验证效果显示正常

