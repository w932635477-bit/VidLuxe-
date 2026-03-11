# VidLuxe 推广视频自动化系统设计

> 版本：v1.0
> 日期：2026-03-10
> 状态：设计中

---

## 一、项目概述

### 1.1 目标

搭建半自动化工具链，帮助 VidLuxe 高效生产爆款推广视频。

### 1.2 核心流程

```
爆款雷达 → 内容工厂 → 数据追踪
    ↓           ↓          ↓
 发现爆款    生成脚本    监控效果
```

### 1.3 成功指标

- 制作 1 条视频时间：从 4-6 小时 → 1-2 小时
- 4 周目标：6-8 条视频，50+ 注册用户

---

## 二、技术架构

### 2.1 项目位置

```
~/Projects/VidLuxe-Marketing/    # 新项目（独立于 VidLuxe）
```

### 2.2 技术栈

| 组件 | 技术选型 | 原因 |
|------|----------|------|
| 语言 | Python 3.11+ | 爬虫/AI 生态成熟 |
| 数据库 | Supabase（共用 VidLuxe） | 数据互通 |
| AI 分析 | Gemini 2.5 Pro | vvagent 方案 |
| 脚本生成 | OpenAI GPT-4 | Viral-Video-AI 方案 |

### 2.3 混合工具策略

| 模块 | 现成工具 | 自己写 |
|------|----------|--------|
| 视频下载 | Douyin_TikTok_Download_API | - |
| 爆款分析 | vvagent (Gemini) | - |
| 脚本生成 | Viral-Video-AI-Creative-Assistant | - |
| 数据追踪 | - | tracker.py |
| 工具串联 | - | radar.py, factory.py |

---

## 三、模块设计

### 3.1 爆款雷达 (radar.py)

**功能**：自动发现并分析爆款视频

```
输入：关键词（如"修图对比"）
处理：
  1. 搜索抖音/小红书热门视频
  2. 下载视频 + 元数据
  3. AI 分析视频结构
  4. 提取爆款模板
输出：爆款模板库（存入 Supabase）
```

**爆款模板结构**：
```json
{
  "video_id": "xxx",
  "platform": "douyin",
  "title": "原始标题",
  "stats": {"likes": 10000, "comments": 500},
  "structure": {
    "hook": "前3秒钩子",
    "body": "中间铺垫",
    "climax": "转折/高潮",
    "cta": "结尾行动号召"
  },
  "viral_factors": ["情绪点1", "情绪点2"],
  "product_fit": "适合植入的方式"
}
```

### 3.2 内容工厂 (factory.py)

**功能**：基于爆款模板生成适配 VidLuxe 的脚本

```
输入：
  - 爆款模板 ID
  - VidLuxe 产品信息（卖点、风格、URL）
处理：
  1. 读取爆款模板
  2. AI 改编，植入产品
  3. 生成拍摄/剪辑脚本
输出：
  - 标题（爆款公式）
  - 脚本（分镜 + 文案）
  - 标签（话题推荐）
```

### 3.3 数据追踪 (tracker.py)

**功能**：追踪已发布视频的效果

```
输入：已发布视频列表
处理：
  1. 定时查询播放量/互动数据
  2. 关联网站访问量（GA/Supabase）
  3. 计算转化率
输出：
  - 效果报表
  - 爆款预警（播放量突增）
  - 优化建议
```

---

## 四、项目结构

```
VidLuxe-Marketing/
├── README.md
├── requirements.txt
├── config.yaml              # 配置（API keys, 关键词等）
├── .env                     # 敏感信息（不提交）
│
├── src/
│   ├── __init__.py
│   ├── radar.py             # 爆款雷达
│   ├── factory.py           # 内容工厂
│   ├── tracker.py           # 数据追踪
│   ├── downloader.py        # 视频下载（封装现成工具）
│   └── analyzer.py          # AI 分析（封装 Gemini）
│
├── templates/
│   └── vidluxe_product.yaml # VidLuxe 产品信息模板
│
├── output/
│   ├── videos/              # 下载的爆款视频
│   ├── scripts/             # 生成的脚本
│   └── reports/             # 效果报表
│
└── data/
    └── viral_templates.json # 本地缓存
```

---

## 五、实现计划

### Phase 1：基础框架（Day 1）

- [ ] 创建项目结构
- [ ] 配置 Python 环境 + 依赖
- [ ] 编写 config.yaml 和 .env 模板

### Phase 2：爆款雷达（Day 1-2）

- [ ] 集成 Douyin_TikTok_Download_API
- [ ] 实现 AI 分析逻辑（Gemini）
- [ ] 完成雷达主流程

### Phase 3：内容工厂（Day 2）

- [ ] 实现脚本生成逻辑（GPT-4）
- [ ] 植入 VidLuxe 产品信息
- [ ] 输出标准化脚本格式

### Phase 4：数据追踪（Day 3）

- [ ] 实现播放量追踪
- [ ] 生成效果报表
- [ ] 爆款预警功能

---

## 六、依赖清单

```txt
# requirements.txt
requests>=2.31.0
python-dotenv>=1.0.0
pyyaml>=6.0
google-generativeai>=0.3.0
openai>=1.12.0
supabase>=2.3.0
rich>=13.7.0           # 美化终端输出
```

---

## 七、使用示例

```bash
# 1. 发现爆款
python src/radar.py --keyword "修图对比" --limit 10

# 2. 生成脚本
python src/factory.py --template-id abc123 --product vidluxe

# 3. 追踪效果
python src/tracker.py --sync
```

---

## 八、待确认事项

- [ ] Gemini API Key 是否已准备？
- [ ] OpenAI API Key 是否已准备？
- [ ] 是否需要接入 Supabase 存储？（或先用本地 JSON）

---

> 文档状态：待用户确认后开始实现
