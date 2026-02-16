# VidLuxe - Premium Video Engine

> 让你的视频瞬间变得高级

![VidLuxe](https://img.shields.io/badge/version-0.1.0-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 简介

VidLuxe 是一个 AI 驱动的**高级感视频引擎**，帮助内容创作者快速提升视频品质感。

```
上传你的普通视频
    ↓
AI 分析并应用"高级感规则"
    ↓
输出一个"看起来很贵"的版本
```

## 核心功能

### 🎨 高级感六维度评分

| 维度 | 权重 | 说明 |
|------|------|------|
| 色彩协调度 | 25% | 饱和度、色温、和谐度 |
| 排版舒适度 | 20% | 字体、间距、层级 |
| 构图美感度 | 20% | 三分法、背景、焦点 |
| 动效流畅度 | 15% | 缓动曲线、节奏、转场 |
| 音频品质度 | 10% | 人声清晰度、BGM 匹配 |
| 细节精致度 | 10% | 边缘、阴影、渐变 |

### ✨ 一键升级

- **极简风格** - Apple 风格，克制干净
- **暖调奢华** - 温暖高级，有质感
- **冷调专业** - 专业冷静，可信赖
- **莫兰迪色系** - 低饱和，高级灰调

### 📊 高级感诊断

- 实时分析视频品质
- 发现问题并给出建议
- 对比升级前后效果

---

## 快速开始

### 安装

```bash
cd /Users/weilei/VidLuxe
pnpm install
```

### 开发

```bash
# 启动 Web 界面
pnpm web

# 启动 Remotion Studio
pnpm remotion
```

### 构建

```bash
pnpm build
```

---

## 项目结构

```
VidLuxe/
├── apps/
│   ├── web/              # Next.js Web 界面
│   └── remotion/         # Remotion 视频渲染
│
├── packages/
│   ├── core/             # 核心引擎
│   │   ├── analyzer/     # 分析器（色彩、排版等）
│   │   ├── scorer/       # 评分引擎
│   │   └── rules/        # 高级感规则库
│   │
│   └── types/            # 类型定义
│
└── docs/                 # 文档
```

---

## MVP 范围（v0.1.0）

- [x] 项目骨架搭建
- [x] 类型定义
- [x] 色彩分析器 (ColorAnalyzer)
- [x] 评分引擎 (PremiumScorer)
- [x] 高级感规则库
- [ ] 视频帧分析集成
- [ ] 一键升级功能
- [ ] Web UI 完善
- [ ] Nano Banana 图像生成集成

---

## 技术栈

- **渲染**: Remotion 4.0
- **前端**: Next.js 14 + Tailwind CSS
- **语言**: TypeScript
- **构建**: Turborepo + pnpm

---

## 相关文档

- [高级感需求文档](../VidSlide%20AI%20Skills/docs/高级感需求文档.md)
- [市场调研报告](../VidSlide%20AI%20Skills/docs/高级感需求文档.md#十一市场调研与竞品分析)
- [Nano Banana 集成方案](../VidSlide%20AI%20Skills/docs/高级感需求文档.md#十二ai-图像生成集成方案nano-banana)

---

## License

MIT

---

> VidLuxe - Premium Video Engine
>
> 让你的视频瞬间变得高级 ✨
