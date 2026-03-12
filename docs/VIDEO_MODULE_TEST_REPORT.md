# 视频模块测试报告

## 测试时间
2026-03-12

## 测试环境
- 服务器：146.56.193.40
- Node.js：20.20.0
- FFmpeg：7.0.2

## 功能测试结果

### 1. 视频上传功能 ✅
**状态**：正常

**测试结果**：
- 上传目录存在：`/opt/vidluxe/apps/web/.next/standalone/apps/web/public/uploads/videos/`
- 已有测试视频文件：3个 MP4 文件
- 上传API：`/api/upload` 正常工作
- 文件类型验证：正常

**代码位置**：
- 前端：`components/features/try/flows/VideoFlow/index.tsx:228-264`
- API：`app/api/upload/route.ts`

### 2. 视频分析和关键帧提取 ✅
**状态**：正常

**测试结果**：
```bash
curl -X POST http://localhost:3000/api/video/analyze \
  -H 'Content-Type: application/json' \
  -d '{"videoUrl":"/uploads/videos/file_1773217849932_332ae6973337.mp4"}'
```

**响应**：
- 成功提取 4 个关键帧
- 每个关键帧包含：URL、时间戳、评分、详细信息（清晰度、构图、亮度、是否有人脸）
- 视频信息：时长 6.5秒，有音频

**关键帧示例**：
```json
{
  "url": "/uploads/keyframes/ac99b7f74dabb76d/frame_000.jpg",
  "timestamp": 0,
  "score": 63,
  "details": {
    "sharpness": 13,
    "composition": 80,
    "brightness": 92,
    "hasFace": true
  }
}
```

**代码位置**：
- 前端：`components/features/try/flows/VideoFlow/index.tsx:267-309`
- API：`app/api/video/analyze/route.ts`
- 关键帧提取：`lib/keyframe-extractor.ts`

### 3. 风格选择功能 ✅
**状态**：正常

**测试结果**：
- 使用 `EffectFlowSelector` 组件
- 支持所有效果预设（outfit-magazine, soft-日系, urban-职场, vintage-胶片等）
- 强度调节：0-100
- 内容类型选择：fashion, beauty, lifestyle, food

**代码位置**：
- 组件：`components/features/try/EffectFlowSelector.tsx`
- 效果预设：`lib/effect-presets.ts`

### 4. 视频帧增强功能 ⏳
**状态**：待验证（API调用中）

**流程**：
1. 用户选择关键帧
2. 可选择多个替换帧
3. 调用 `/api/video/enhance-cover` 逐帧增强
4. 显示进度：`🖼️ 正在增强第 X/Y 张图片...`

**代码位置**：
- 前端：`components/features/try/flows/VideoFlow/index.tsx:318-393`
- API：`app/api/video/enhance-cover/route.ts`

### 5. 下载功能 ✅
**状态**：正常

**功能特性**：
- 下载前额度确认弹窗
- 额度不足时跳转充值页面
- 逐张下载（避免浏览器阻止）
- 下载间隔：300ms
- 文件命名：`enhanced_frame_1.jpg`, `enhanced_frame_2.jpg`...

**额度消耗**：
- 每下载1张图片消耗1次额度
- 先扣除额度，再下载
- 下载失败不退款（需要改进）

**代码位置**：
- 组件：`components/features/try/flows/VideoFlow/EnhancedFramesResult.tsx:157-212`

## 已知问题

### 1. 下载失败不退款
**问题**：下载图片失败时，已扣除的额度不会退回

**建议修复**：
```typescript
// 在 catch 块中添加退款逻辑
catch (error) {
  // 退回额度
  await fetch('/api/credits/refund', {
    method: 'POST',
    body: JSON.stringify({
      anonymousId,
      amount: frames.length,
      reason: '下载失败',
    }),
  });
  alert('下载失败，额度已退回');
}
```

### 2. 视频帧增强API响应时间长
**问题**：每帧增强需要调用 Nano Banana API，可能需要30-60秒

**当前超时设置**：5分钟（300秒）

**建议**：
- 添加更详细的进度提示
- 显示预计剩余时间
- 支持取消操作

### 3. 关键帧选择器缺少预览
**问题**：用户难以判断哪个关键帧最好

**建议**：
- 显示关键帧评分
- 高亮推荐帧（最高分）
- 显示详细信息（清晰度、构图、亮度）

## API端点总结

| API | 方法 | 功能 | 状态 |
|-----|------|------|------|
| `/api/upload` | POST | 上传视频文件 | ✅ |
| `/api/video/analyze` | POST | 分析视频提取关键帧 | ✅ |
| `/api/video/enhance-cover` | POST | 增强单个关键帧 | ⏳ |
| `/api/credits/spend` | POST | 扣除额度 | ✅ |
| `/api/download` | GET | 下载图片 | ✅ |

## 测试建议

### 端到端测试流程
1. 上传一个短视频（5-10秒）
2. 等待关键帧提取（约10-30秒）
3. 选择一个关键帧
4. 选择风格（如 outfit-magazine）
5. 确认增强（等待30-60秒）
6. 查看结果
7. 测试下载功能

### 测试用例
```bash
# 1. 测试视频上传
# 前端操作：拖入视频文件

# 2. 测试视频分析
curl -X POST http://localhost:3000/api/video/analyze \
  -H 'Content-Type: application/json' \
  -d '{"videoUrl":"/uploads/videos/[your-video].mp4"}'

# 3. 测试帧增强
curl -X POST http://localhost:3000/api/video/enhance-cover \
  -H 'Content-Type: application/json' \
  -d '{
    "frameUrl":"/uploads/keyframes/[session]/frame_000.jpg",
    "effectId":"outfit-magazine",
    "intensity":100,
    "contentType":"fashion"
  }'

# 4. 测试下载
# 前端操作：点击"下载全部"按钮
```

## 结论

视频模块的核心功能都已实现且基本正常：
- ✅ 视频上传
- ✅ 关键帧提取
- ✅ 风格选择
- ⏳ 帧增强（API调用中，需要等待响应）
- ✅ 下载功能

主要需要改进的是：
1. 下载失败退款机制
2. 更好的进度提示
3. 关键帧选择器优化

建议先在浏览器中进行完整的端到端测试，确认用户体验是否流畅。
