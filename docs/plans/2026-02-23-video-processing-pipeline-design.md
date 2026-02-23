# 统一视频处理管线设计

> 日期：2026-02-23
> 状态：已批准

## 概述

重构视频处理 API 架构，建立统一的视频处理管线，支持封面嵌入和调色滤镜功能。

## 需求总结

1. **封面嵌入**：将 AI 增强的封面嵌入视频元数据，不重新编码视频（秒级处理）
2. **调色预览**：生成 5 秒调色预览片段（约 10 秒完成）
3. **完整调色**：后台异步处理完整视频
4. **LUT 导出**：提供 .cube 格式 LUT 文件下载

## 整体流程

```
用户上传视频
    ↓
[分析] 提取关键帧
    ↓
[选择] 用户选择关键帧
    ↓
[增强] AI 生成高级感封面
    ↓
[嵌入] 封面嵌入视频元数据
    ↓
┌───────────────────────────────────────┐
│           结果页面                      │
├───────────────────────────────────────┤
│  📷 下载封面图                          │
│  🎬 下载带封面的视频（秒级完成）          │
│  ────────────────────────────────────  │
│  🎨 调色预览（3种风格，5秒片段）         │
│  📥 应用调色到完整视频（后台处理）        │
│  📦 下载 LUT 文件                       │
└───────────────────────────────────────┘
```

## API 设计

### 1. 封面嵌入 API

**端点**：`POST /api/video/embed-cover`

**请求**：
```json
{
  "videoUrl": "/uploads/videos/xxx.mp4",
  "coverUrl": "/uploads/covers/xxx.jpg"
}
```

**响应**：
```json
{
  "success": true,
  "videoUrl": "/uploads/videos/with-cover/xxx.mp4"
}
```

**技术实现**：
```bash
ffmpeg -i video.mp4 -i cover.jpg \
  -map 0 -map 1 \
  -c copy \
  -disposition:v:1 attached_pic \
  output.mp4
```

**特点**：
- 使用 `-c copy` 不重新编码
- 处理时间：< 5 秒
- 文件大小几乎不变

### 2. 调色预览 API

**端点**：`POST /api/video/preview-grading`

**请求**：
```json
{
  "videoUrl": "/uploads/videos/xxx.mp4",
  "style": "magazine" | "warm" | "cinematic",
  "duration": 5
}
```

**响应**：
```json
{
  "success": true,
  "previewUrl": "/uploads/videos/preview/xxx_magazine.mp4"
}
```

**技术实现**：
```bash
ffmpeg -i video.mp4 -t 5 \
  -vf "lut3d=magazine.cube" \
  -c:v libx264 -preset fast \
  -c:a copy \
  output.mp4
```

### 3. 完整调色 API

**端点**：`POST /api/video/apply-grading`

**请求**：
```json
{
  "videoUrl": "/uploads/videos/xxx.mp4",
  "style": "magazine" | "warm" | "cinematic"
}
```

**响应**：
```json
{
  "success": true,
  "taskId": "task_xxx",
  "estimatedTime": 180
}
```

**特点**：
- 后台异步处理
- 支持进度查询
- 完成后通知

### 4. LUT 下载 API

**端点**：`GET /api/video/lut/[style]`

**响应**：`.cube` 文件下载

## 调色风格定义

| 风格 | 特点 | 适用场景 |
|------|------|----------|
| magazine | 冷色调、高对比、高级灰 | 穿搭、美妆 |
| warm | 温暖、柔和、金色调 | 美食、探店 |
| cinematic | 低饱和、青橙色调 | 生活方式、旅行 |

## 文件结构

```
apps/web/
├── app/api/video/
│   ├── analyze/route.ts        # 现有：视频分析
│   ├── enhance-cover/route.ts  # 现有：封面增强
│   ├── embed-cover/route.ts    # 新增：封面嵌入
│   ├── preview-grading/route.ts # 新增：调色预览
│   ├── apply-grading/route.ts   # 新增：完整调色
│   └── lut/[style]/route.ts     # 新增：LUT 下载
├── lib/
│   ├── video-processor.ts       # 新增：统一处理逻辑
│   └── luts/                    # 新增：LUT 文件
│       ├── magazine.cube
│       ├── warm.cube
│       └── cinematic.cube
└── public/uploads/
    └── videos/
        ├── with-cover/         # 带封面视频
        └── preview/            # 预览视频
```

## 前端流程修改

1. 封面增强成功后，调用 `/api/video/embed-cover`
2. 结果页面显示：
   - 视频预览（带封面）
   - 下载封面图按钮
   - 下载视频按钮
   - 调色风格选择器
   - 预览调色按钮
   - 应用完整调色按钮
   - 下载 LUT 按钮

## 处理时间预估

| 操作 | 3分钟视频 |
|------|----------|
| 封面嵌入 | < 5 秒 |
| 调色预览（5秒） | ~10 秒 |
| 完整调色 | 2-4 分钟（后台） |
| LUT 下载 | 即时 |

## 实施计划

### Phase 1：封面嵌入（优先）
1. 创建 `/api/video/embed-cover` API
2. 修改前端结果页面

### Phase 2：调色功能
1. 准备 3 种 LUT 文件
2. 创建 `/api/video/preview-grading` API
3. 创建 `/api/video/apply-grading` API
4. 创建 `/api/video/lut/[style]` API
5. 修改前端添加调色 UI

### Phase 3：优化
1. 后台任务进度显示
2. 错误处理优化
3. 性能调优

## 验收标准

1. 封面嵌入后，视频文件可显示 AI 增强的封面缩略图
2. 调色预览能清晰展示风格差异
3. 完整调色处理后色调统一
4. LUT 文件可在 Premiere/FCP 中使用
