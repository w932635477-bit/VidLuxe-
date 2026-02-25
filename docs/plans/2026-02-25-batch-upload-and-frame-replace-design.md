# 批量上传与视频帧替换设计文档

> 版本：1.0 | 日期：2026-02-25 | 状态：待实施

---

## 一、概述

### 1.1 背景
- 图片上传目前只支持单文件
- 视频处理只支持选择一个封面帧，消耗太少
- 需要增加用户消耗点，提升商业价值

### 1.2 目标
1. **图片批量上传**：支持一次上传最多 9 张图片，批量生成
2. **视频多选帧替换**：支持多选关键帧，批量生成后替换原视频帧

---

## 二、图片批量上传设计

### 2.1 数据结构

```typescript
// 批量上传文件项
export interface BatchFileItem {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl: string | null;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// 上传模式
export type UploadMode = 'single' | 'batch';

// 批量结果项
export interface BatchResultItem {
  originalUrl: string;
  enhancedUrl: string;
  style: MultiStyleType;
  score?: SeedingScore;
}
```

### 2.2 功能规则

| 规则 | 值 |
|------|-----|
| 最大图片数 | 9 张（小红书九宫格）|
| 结果数量 | N 张图片 × M 种风格 = N×M 张 |
| 额度消耗 | N×M 个额度 |
| 下载方式 | 九宫格展示 + 打包下载 |

### 2.3 UI 交互流程

```
上传区（支持多选）
    ↓
缩略图预览区（显示已上传图片，可删除）
    ↓
风格多选（使用现有 StyleMultiSelector）
    ↓
点击生成 → 弹窗确认额度消耗
    ↓
处理中（批量处理进度）
    ↓
结果页（九宫格展示 + 打包下载按钮）
```

### 2.4 上传组件修改

**UploadSection.tsx 修改点：**
- `<input>` 添加 `multiple` 属性
- 拖拽处理支持 `files` 数组
- 显示"可多选"提示

**新增组件：**
- `BatchPreviewGrid.tsx` - 缩略图预览网格
- `BatchConfirmModal.tsx` - 额度消耗确认弹窗
- `BatchResultGrid.tsx` - 结果九宫格展示

### 2.5 Hook 扩展

**useFileUpload 扩展为支持批量：**
```typescript
interface UseFileUploadReturn {
  // 现有单文件
  uploadedFile: File | null;
  uploadedFileUrl: string | null;

  // 新增批量
  batchFiles: BatchFileItem[];
  uploadMode: UploadMode;

  // 方法
  handleFileChange: (file: File) => Promise<void>;
  handleBatchFilesChange: (files: File[]) => Promise<void>;
  removeBatchFile: (id: string) => void;
  clearBatchFiles: () => void;
}
```

---

## 三、视频多选帧替换设计

### 3.1 当前流程 vs 新流程

| 阶段 | 当前流程 | 新流程 |
|------|----------|--------|
| 关键帧选择 | 单选 1 个封面帧 | 多选最多 9 个帧 |
| 封面处理 | 增强后嵌入元数据 | 指定封面帧，增强后嵌入首帧 |
| 其他帧 | 无处理 | 增强后替换原视频对应时间点 |
| 额度消耗 | 1 个额度 | N 个额度（N = 选中帧数）|

### 3.2 新流程详解

```
视频上传 → AI识别 → 风格选择 → 调色分析 → 确认调色
    ↓
关键帧提取（提取 5-10 个候选帧）
    ↓
用户多选关键帧（最多选 9 个）
    ↓
用户指定封面帧（从已选帧中选 1 个）
    ↓
弹窗确认："已选 N 帧，消耗 N 额度"
    ↓
批量生成增强图
    ↓
封面帧 → 嵌入首帧
其他帧 → 替换原视频对应时间点
    ↓
结果展示
```

### 3.3 数据结构

```typescript
// 关键帧选择状态
interface KeyframeSelection {
  selectedFrames: KeyFrame[];     // 已选中的帧
  coverFrame: KeyFrame | null;    // 指定的封面帧
}
```

### 3.4 UI 组件修改

**关键帧选择器修改：**
- 支持多选（checkbox 或点击切换）
- 显示"已选 N 帧，消耗 N 额度"
- 封面帧标记（星标或"封面"标签）
- 指定封面按钮

### 3.5 API 需求

**新增/修改 API：**

1. **帧替换 API**：`POST /api/video/replace-frames`
```typescript
{
  videoUrl: string;
  frames: {
    timestamp: number;
    enhancedImageUrl: string;
  }[];
}
```

2. **批量帧增强 API**：`POST /api/video/enhance-frames`
```typescript
{
  frameUrls: string[];
  style: StyleType;
}
```

---

## 四、自动识别逻辑

### 4.1 识别规则

```typescript
function detectUploadMode(files: File[]): UploadMode {
  if (files.length === 0) return 'single';
  if (files.length === 1) {
    return files[0].type.startsWith('video/') ? 'single' : 'single';
  }
  // 多文件且都是图片
  const allImages = files.every(f => f.type.startsWith('image/'));
  return allImages ? 'batch' : 'single';
}
```

### 4.2 流程分发

| 上传内容 | contentType | 处理流程 |
|----------|-------------|----------|
| 单张图片 | 'image' | 图片单图流程（现有）|
| 多张图片 | 'image' + batch | 图片批量流程（新增）|
| 视频 | 'video' | 视频流程（修改）|

---

## 五、实施计划

### 5.1 阶段一：图片批量上传（P0）

1. 扩展 `useFileUpload` Hook 支持批量
2. 修改 `UploadSection` 支持多选
3. 新建 `BatchPreviewGrid` 组件
4. 新建 `BatchConfirmModal` 组件
5. 修改 `handleStartProcessing` 支持批量
6. 新建 `BatchResultGrid` 组件
7. 实现打包下载功能

### 5.2 阶段二：视频多选帧替换（P1）

1. 修改关键帧选择器支持多选
2. 添加封面帧指定功能
3. 新建批量帧增强 API
4. 新建帧替换 API
5. 修改 `handleEnhanceCover` 支持批量

---

## 六、风险与缓解

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 批量上传性能 | 中 | 限制最大 9 张，并发上传 |
| 帧替换视频质量 | 中 | 使用 FFmpeg 高质量编码 |
| 打包下载大文件 | 低 | 使用 ZIP 流式压缩 |

---

> 文档版本：1.0
> 更新日期：2026-02-25
> 状态：待实施
