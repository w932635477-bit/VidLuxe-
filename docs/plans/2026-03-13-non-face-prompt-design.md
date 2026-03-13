# 非人脸 Prompt 最佳实践框架设计文档

**日期**: 2026-03-13
**状态**: 已批准
**目标**: 实现自动人脸检测 + 自适应 Prompt + 自动评分 + 持续优化的完整框架

## 问题背景

用户上传非人脸图片（产品、物品、植物等）时，系统使用人脸优化的 prompt 生成效果不佳。需要建立一套完整的框架来：
1. 自动检测图片是否有人脸
2. 根据内容类型选择合适的 prompt
3. 自动评分生成结果
4. 收集用户反馈
5. 持续优化 prompt 库

## 架构设计

### 核心流程

```
图片上传 → 人脸检测 → 选择 Prompt 模式 → 调用 API (3 个版本)
  ↓
自动评分 (5 维度) → 存储结果 → 用户反馈 → 周期性优化
```

### 核心组件

1. **人脸检测模块** (`lib/face-detection.ts`)
   - 集成 MediaPipe Face Detection
   - 返回：`{ hasFace, confidence, faceCount }`

2. **扩展 Prompt 库** (`lib/style-prompts.ts`)
   - 为每个风格创建 3 个版本（A/B/C）
   - 支持两种模式：`face` 和 `product`
   - 结构化 prompt（分层设计）

3. **自动评分系统** (`lib/image-evaluation.ts`)
   - CLIP 评分：prompt 一致性
   - LPIPS 评分：视觉质量
   - 自定义评分：风格一致性、清晰度、色彩

4. **A/B 测试框架** (`lib/ab-testing.ts`)
   - 测试用例管理
   - 结果聚合和统计分析
   - 赢家判定逻辑

5. **用户反馈系统** (`lib/user-feedback.ts`)
   - 反馈收集和存储
   - 问题分类和统计

6. **监控仪表板** (`lib/monitoring.ts`)
   - 实时指标计算
   - 趋势分析

7. **持续优化引擎** (`lib/prompt-optimization.ts`)
   - 周期性优化流程
   - 改进建议生成

## 数据库表结构

```sql
-- 测试结果表
CREATE TABLE prompt_test_results (
  id UUID PRIMARY KEY,
  image_url TEXT,
  original_image_url TEXT,
  style PresetStyle,
  content_mode 'face' | 'product',
  prompt_version 'A' | 'B' | 'C',
  prompt_text TEXT,
  generated_image_url TEXT,
  metrics JSONB,
  created_at TIMESTAMP,
  user_id UUID
);

-- 用户反馈表
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY,
  test_result_id UUID REFERENCES prompt_test_results,
  rating 1-5,
  issue_type TEXT,
  feedback_text TEXT,
  created_at TIMESTAMP,
  user_id UUID
);

-- 优化历史表
CREATE TABLE prompt_optimization_history (
  id UUID PRIMARY KEY,
  style PresetStyle,
  content_mode 'face' | 'product',
  version 'A' | 'B' | 'C',
  old_prompt TEXT,
  new_prompt TEXT,
  reason TEXT,
  improvement_metrics JSONB,
  created_at TIMESTAMP
);
```

## 实施阶段

**第 1 阶段（第 1-2 天）**：
- 人脸检测集成
- 产品版 Prompt 库（3 个版本 × 4 个风格）
- 基础 A/B 测试框架

**第 2 阶段（第 3-4 天）**：
- 自动评分系统（CLIP + LPIPS）
- 用户反馈收集 UI
- 数据库表创建

**第 3 阶段（第 5-6 天）**：
- 监控仪表板
- 持续优化引擎
- 测试和验证

**第 7 天**：
- 生产部署
- 生成端效果测试

## 成功指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| Prompt 一致性 | > 0.75 | CLIP 评分 |
| 视觉质量 | > 0.70 | LPIPS 评分 |
| 风格一致性 | > 0.75 | 自动分析 + 用户反馈 |
| 细节清晰度 | > 0.70 | 锐度检测 |
| 用户满意度 | > 4.0/5 | 用户评分 |
| 问题率 | < 10% | 用户反馈统计 |
