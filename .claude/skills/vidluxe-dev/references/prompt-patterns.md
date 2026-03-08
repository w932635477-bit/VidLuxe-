# VidLuxe Prompt 工程模式

从 wshobson-prompt-engineering-patterns 中提取的实用模式，针对 VidLuxe 优化。

## 一、Nano Banana API Prompt 模板

### 1.1 基础升级模板

```python
ENHANCEMENT_TEMPLATE = """
升级以下{content_type}图片：
- 风格: {style}
- 强度: {intensity}%
- 保持原图内容和构图
- 提升视觉质感

内容类型: {content_type}
风格特点: {style_description}
"""
```

### 1.2 分类模板（按内容类型）

```python
CONTENT_TEMPLATES = {
    "outfit": """
处理穿搭图片:
- 保持服装细节和质感
- 优化肤色和光影
- 风格: {style}
- 适用场景: 小红书穿搭分享
""",
    "beauty": """
处理美妆图片:
- 保持妆容细节
- 优化皮肤质感
- 风格: {style}
- 适用场景: 美妆教程/产品展示
""",
    "cafe": """
处理探店图片:
- 保持空间氛围
- 优化光线和色调
- 风格: {style}
- 适用场景: 探店分享
""",
    "travel": """
处理旅游图片:
- 保持风景特色
- 优化色彩和构图
- 风格: {style}
- 适用场景: 旅行记录
""",
    "food": """
处理美食图片:
- 保持食物质感
- 优化色彩和光影
- 风格: {style}
- 适用场景: 美食分享
""",
}
```

### 1.3 风格描述模板

```python
STYLE_DESCRIPTIONS = {
    "magazine": """
高级杂志风格:
- 专业摄影质感
- 奢华高级感
- 精致光影
- 杂志封面构图
""",
    "soft": """
温柔日系风格:
- 柔和自然光
- 低饱和度
- 治愈氛围
- 生活感
""",
    "urban": """
都市职场风格:
- 干净利落
- 专业可信
- 现代简约
- 商务质感
""",
    "vintage": """
复古胶片风格:
- 胶片颗粒感
- 暖色调
- 怀旧氛围
- 电影感
""",
}
```

## 二、Token 优化技巧

### 2.1 冗余词汇替换

| 冗余表达 | 优化后 |
|---------|--------|
| `in order to` | `to` |
| `due to the fact that` | `because` |
| `at this point in time` | `now` |
| `in the event that` | `if` |
| `with regard to` | `about` |

### 2.2 Prompt 压缩示例

**优化前 (冗余):**
```
In order to create a high-quality fashion magazine style image,
due to the fact that the user wants a premium look,
you should apply professional lighting and composition techniques.
```

**优化后 (简洁):**
```
Create premium fashion magazine image with professional lighting and composition.
```

### 2.3 VidLuxe Prompt 压缩规则

```python
def compress_prompt(prompt: str) -> str:
    """压缩 VidLuxe prompt，减少 token 使用"""
    replacements = [
        ("high-quality", "HQ"),
        ("professional photography", "pro photo"),
        ("magazine cover style", "magazine"),
        ("fashion editorial", "editorial"),
        ("natural lighting", "natural light"),
        ("atmosphere and mood", "mood"),
        ("texture and details", "texture"),
    ]

    result = prompt
    for old, new in replacements:
        result = result.replace(old, new)
    return result
```

## 三、错误处理模式

### 3.1 重试 Prompt 模板

```python
RETRY_TEMPLATE = """
任务失败，请重试:
- 原因: {error_reason}
- 调整: {adjustment}
- 保持: {keep_requirements}

注意: 不要改变核心风格要求
"""
```

### 3.2 降级策略

```python
FALLBACK_STRATEGIES = {
    "timeout": {
        "adjustment": "简化 prompt，减少细节要求",
        "max_retries": 3,
    },
    "quality_unsatisfied": {
        "adjustment": "增强风格关键词强度",
        "intensity_boost": 20,
    },
    "style_mismatch": {
        "adjustment": "重新选择风格预设",
        "suggest_alternatives": True,
    },
}
```

## 四、模板组合模式

### 4.1 模块化组合

```python
class PromptBuilder:
    """VidLuxe Prompt 构建器"""

    def __init__(self):
        self.components = {}

    def add_content_type(self, content_type: str):
        """添加内容类型模块"""
        self.components["content"] = CONTENT_TEMPLATES.get(content_type, "")

    def add_style(self, style: str):
        """添加风格模块"""
        self.components["style"] = STYLE_DESCRIPTIONS.get(style, "")

    def add_intensity(self, intensity: int):
        """添加强度参数"""
        self.components["intensity"] = f"强度: {intensity}%"

    def build(self) -> str:
        """组合最终 prompt"""
        return "\n".join(self.components.values())

# 使用示例
builder = PromptBuilder()
builder.add_content_type("outfit")
builder.add_style("magazine")
builder.add_intensity(80)
prompt = builder.build()
```

### 4.2 条件模板

```python
def build_conditional_prompt(base_prompt: str, **conditions) -> str:
    """根据条件构建 prompt"""
    parts = [base_prompt]

    if conditions.get("has_face"):
        parts.append("保持面部自然")

    if conditions.get("has_text"):
        parts.append("保持文字清晰")

    if conditions.get("high_contrast"):
        parts.append("增强对比度")

    return "\n".join(parts)
```

## 五、风格一致性检查

### 5.1 Prompt 一致性验证

```python
def validate_prompt_consistency(prompt: str, style: str) -> dict:
    """验证 prompt 与风格是否一致"""
    style_keywords = {
        "magazine": ["luxury", "premium", "editorial", "vogue"],
        "soft": ["gentle", "natural", "muted", "dreamy"],
        "urban": ["professional", "clean", "modern", "minimal"],
        "vintage": ["film", "grain", "warm", "nostalgic"],
    }

    keywords = style_keywords.get(style, [])
    found = [k for k in keywords if k.lower() in prompt.lower()]

    return {
        "consistent": len(found) >= 2,
        "found_keywords": found,
        "expected_keywords": keywords,
    }
```

### 5.2 自动修正

```python
def auto_fix_prompt(prompt: str, style: str) -> str:
    """自动添加缺失的风格关键词"""
    required_keywords = {
        "magazine": ["editorial", "premium"],
        "soft": ["gentle", "natural"],
        "urban": ["clean", "professional"],
        "vintage": ["film", "warm"],
    }

    keywords = required_keywords.get(style, [])
    additions = []

    for keyword in keywords:
        if keyword.lower() not in prompt.lower():
            additions.append(keyword)

    if additions:
        return f"{prompt}\n\nAdditional style notes: {', '.join(additions)}"

    return prompt
```

## 六、测试模式

### 6.1 A/B 测试模板

```python
AB_TEST_TEMPLATE = """
测试版本 {version}:
- Prompt: {prompt}
- 样本数: {sample_size}
- 评估指标: {metrics}

对比基准:
- 版本 A: {baseline_prompt}
- 版本 B: {variant_prompt}
"""
```

### 6.2 效果评估

```python
def evaluate_prompt_effectiveness(
    original_prompt: str,
    optimized_prompt: str,
    test_cases: list
) -> dict:
    """评估 prompt 优化效果"""
    results = {
        "original": {"success": 0, "avg_quality": 0},
        "optimized": {"success": 0, "avg_quality": 0},
    }

    # 测试原始 prompt
    for case in test_cases:
        result = test_prompt(original_prompt, case)
        results["original"]["success"] += result["success"]
        results["original"]["avg_quality"] += result["quality"]

    # 测试优化 prompt
    for case in test_cases:
        result = test_prompt(optimized_prompt, case)
        results["optimized"]["success"] += result["success"]
        results["optimized"]["avg_quality"] += result["quality"]

    # 计算改进
    n = len(test_cases)
    improvement = {
        "success_rate": (results["optimized"]["success"] - results["original"]["success"]) / n,
        "quality_gain": (results["optimized"]["avg_quality"] - results["original"]["avg_quality"]) / n,
    }

    return {
        "results": results,
        "improvement": improvement,
        "winner": "optimized" if improvement["quality_gain"] > 0 else "original",
    }
```

## 七、最佳实践清单

### 7.1 Prompt 编写检查

- [ ] 包含具体的内容类型 (outfit/beauty/cafe/travel/food)
- [ ] 指定明确的风格 (magazine/soft/urban/vintage)
- [ ] 设置合适的强度 (50-100)
- [ ] 移除冗余词汇
- [ ] 验证风格关键词一致性
- [ ] 添加负面 prompt (避免不想要的效果)

### 7.2 常见错误

| 错误 | 正确 |
|------|------|
| 风格描述模糊 | 使用具体风格名称 |
| Token 过多 | 压缩到 500 字符内 |
| 缺少负面 prompt | 添加 negativePrompt |
| 强度未指定 | 明确 intensity 参数 |

### 7.3 性能优化

```python
# 缓存常用 prompt
PROMPT_CACHE = {}

def get_cached_prompt(style: str, content_type: str) -> str:
    """获取缓存的 prompt"""
    key = f"{style}_{content_type}"
    if key not in PROMPT_CACHE:
        builder = PromptBuilder()
        builder.add_content_type(content_type)
        builder.add_style(style)
        PROMPT_CACHE[key] = builder.build()
    return PROMPT_CACHE[key]
```

## 维护

- 来源: wshobson-prompt-engineering-patterns
- 最后更新: 2025-03-07
- 适用范围: VidLuxe 图片/视频升级系统
