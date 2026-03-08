# VidLuxe 流程架构

## 如述

VidLuxe 有两条主要流程：图片单图流程和视频流程。

## 图片单图流程 (ImageSingleFlow)

```
步骤: upload → recognition → style → processing → result

### 1. Upload (上传)
- 用户上传图片
- 验证文件格式和大小
- 存储到本地或云存储

### 2. Recognition (识别)
- 可选：识别图片内容类型
- 提取图片特征

### 3. Style (风格选择)
- 选择内容类型 (outfit/beauty/cafe/travel/food)
- 选择效果预设 (magazine/soft/urban/vintage/...)
- 可选强度调整

### 4. Processing (处理)
- 调用 Nano Banana API
- 等待处理完成
- 计算评分

### 5. Result (结果)
- 显示对比图
- 显示评分结果
- 提供下载

## 视频流程 (VideoFlow)

```
步骤: upload → recognition → style → keyframe → processing → result

### 1-3. 同图片流程

### 4. Keyframe (关键帧)
- 提取视频关键帧
- 用户选择关键帧
- 对选中的帧进行升级

### 5. Processing (处理)
- 对每个关键帧调用 Nano Banana API
- 合成视频
- 添加封面

### 6. Result (结果)
- 显示视频对比
- 提供下载
```

## 数据流

```
用户操作 → FlowStore → API Route → Workflow → Nano Banana API
     ↓
   Result Data ← Store Update → UI 更新
```

## 关键文件位置

| 文件 | 职责 |
|-----|------|
| `flows/ImageSingleFlow/index.tsx` | 图片流程组件 |
| `flows/VideoFlow/index.tsx` | 视频流程组件 |
| `lib/stores/flows/` | Zustand stores |
| `lib/workflow.ts` | 工作流编排 |
| `app/api/enhance/[taskId]/route.ts` | 增强 API |
