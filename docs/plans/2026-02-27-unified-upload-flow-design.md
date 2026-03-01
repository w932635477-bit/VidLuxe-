# 统一上传流程设计文档

## 概述

重构 `/try` 页面，支持三种模式：单图、批量图片、视频。统一图床、等待动画、下载功能。

## 页面架构

```
/try 页面
├── 顶部 Tab 切换: [ 单图 | 批量 | 视频 ]
│
├── ImageSingleFlow    单图流程（已有）
├── ImageBatchFlow     批量图片流程（已有，增强打包下载）
└── VideoFlow          视频流程（重构）
```

## 视频流程详细设计

### 流程阶段

```
upload → colorGrade → keyframe → enhance → result
 上传     AI调色      关键帧选择   增强帧     结果导出
```

### 各阶段详情

| 阶段 | 用户操作 | 后端处理 |
|------|----------|----------|
| upload | 上传视频 | 存储视频，返回 URL |
| colorGrade | 选择风格，确认调色效果 | AI 分析 + FFmpeg 调色 |
| keyframe | 选择封面帧 + 替换帧 | FFmpeg 提取关键帧 |
| enhance | 确认开始增强 | AI 增强选中的帧 |
| result | 导出视频/下载封面 | FFmpeg 合成视频 |

### 关键帧设计

| 类型 | 必选性 | 用途 | 数量 |
|------|--------|------|------|
| 封面帧 | 必选 | 生成独立封面图 | 1 张 |
| 替换帧 | 可选 | 增强后替换视频帧 | 0-9 张 |

## API 端点

### 现有 API（需确认/增强）

| API | 功能 | 状态 |
|-----|------|------|
| POST /api/upload | 文件上传 | ✅ 已有 |
| POST /api/video/analyze | 提取关键帧 | ✅ 已有 |
| POST /api/video/color-grade | AI 调色 | ✅ 已有，需增强 |

### 新增 API

| API | 功能 |
|-----|------|
| POST /api/video/enhance-frames | 批量增强关键帧 |
| POST /api/video/replace-frames | FFmpeg 替换帧并合成新视频 |
| POST /api/download/zip | 批量图片打包下载 |

## 共享基础设施

### 1. 图床服务

- 本地存储: `public/uploads/`
- 云存储: Cloudflare R2（生产环境）
- 临时图床: litterbox.catbox.moe（备选）

### 2. 等待动画

- ProcessingAnimation 组件（已有）
- 支持不同模式的进度展示
- 显示当前阶段、进度百分比、预计时间

### 3. 下载服务

| 功能 | 实现方式 |
|------|----------|
| 单图下载 | 前端 fetch + blob + download |
| 批量图片打包 | 后端 JSZip 打包 |
| 视频下载 | FFmpeg 合成后返回文件流 |

## 技术选型

| 需求 | 方案 |
|------|------|
| 后端视频处理 | FFmpeg |
| 视频调色 | AI 分析 + FFmpeg 滤镜（eq, colorbalance, curves） |
| 批量打包 | JSZip |
| 文件存储 | 本地 / Cloudflare R2 |

## 实现优先级

1. **P0**: 修复视频上传入口（Tab 切换）
2. **P1**: 视频流程重构（关键帧选择、FFmpeg 集成）
3. **P2**: 批量图片打包下载
4. **P3**: 优化等待动画

## 风险点

1. FFmpeg 服务器部署和资源消耗
2. 大视频处理时间较长，需要良好的进度反馈
3. AI 调色效果需要调优
