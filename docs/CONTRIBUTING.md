# VidLuxe 贡献指南

## 概述

感谢您对 VidLuxe 项目的关注！本文档将帮助您了解如何参与项目开发。

---

## 行为准则

### 我们的承诺

为了营造开放和友好的环境，我们承诺：

- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 使用性化的语言或图像
- 发表侮辱性/贬损性评论
- 公开或私下骚扰
- 未经许可发布他人私人信息

---

## 如何贡献

### 报告 Bug

1. **搜索现有 Issues**：确保问题未被报告
2. **使用 Issue 模板**：填写所有必填字段
3. **提供详细信息**：
   - 操作系统和浏览器版本
   - 复现步骤
   - 预期行为 vs 实际行为
   - 截图或录屏

```markdown
## Bug 报告模板

**描述**
简要描述问题

**复现步骤**
1. 访问 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

**预期行为**
应该发生什么

**实际行为**
实际发生了什么

**截图**
如果有，添加截图

**环境**
- OS: [e.g. macOS 14]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
```

### 功能建议

1. **讨论优先**：大型功能先开 Discussion 讨论
2. **描述清晰**：说明功能的价值和使用场景
3. **提供示例**：如有参考产品，请附链接

```markdown
## 功能建议模板

**问题陈述**
当前存在什么问题或痛点

**建议的解决方案**
你希望如何解决

**替代方案**
考虑过的其他方案

**附加信息**
截图、链接等
```

### 提交代码

#### 1. Fork 并克隆仓库

```bash
# Fork 后克隆你的仓库
git clone https://github.com/YOUR_USERNAME/VidLuxe.git
cd VidLuxe

# 添加上游仓库
git remote add upstream https://github.com/vidluxe/VidLuxe.git
```

#### 2. 创建分支

```bash
# 从 main 创建功能分支
git checkout -b feature/your-feature-name

# 或修复分支
git checkout -b fix/your-fix-name
```

#### 3. 安装依赖

```bash
# 安装 pnpm（如未安装）
npm install -g pnpm

# 安装项目依赖
pnpm install
```

#### 4. 开发

```bash
# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck
```

#### 5. 提交代码

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**

```bash
git commit -m "feat(analyzer): add color harmony calculation"
git commit -m "fix(scorer): correct grade threshold logic"
git commit -m "docs(readme): update installation instructions"
```

#### 6. 推送并创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

---

## 代码规范

### TypeScript

```typescript
// 使用 interface 定义对象类型
interface User {
  id: string;
  name: string;
}

// 使用 type 定义联合类型
type Status = 'pending' | 'processing' | 'completed';

// 使用 const assertions
const COLORS = ['red', 'green', 'blue'] as const;

// 优先使用函数组件
export function Component({ prop }: Props) {
  return <div>{prop}</div>;
}

// 避免使用 any
// ❌
function process(data: any) { ... }

// ✅
function process<T>(data: T) { ... }
```

### React

```tsx
// 组件命名：PascalCase
export function ScoreCard({ score }: ScoreCardProps) { ... }

// Hook 命名：use 前缀
function useAnalysis(id: string) { ... }

// 事件处理函数：handle 前缀
function handleClick() { ... }

// 使用组件组合
// ❌
<div className="p-4 m-2 border">...</div>

// ✅
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### CSS (Tailwind)

```tsx
// 类名顺序：布局 -> 尺寸 -> 间距 -> 视觉 -> 状态
<div className="flex items-center justify-between w-full p-4 bg-card rounded-lg hover:bg-accent">

// 使用 cn() 合并类名
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)}>
```

### 文件命名

```
components/
├── ui/
│   ├── button.tsx        # 小写
│   └── card.tsx
├── features/
│   ├── score-card.tsx    # kebab-case
│   └── video-player.tsx
└── __tests__/
    └── score-card.test.tsx  # 测试文件对应源文件
```

---

## 测试规范

### 单元测试

```typescript
describe('ColorAnalyzer', () => {
  describe('analyzeFrame', () => {
    it('should detect high saturation', () => {
      // Arrange
      const imageData = createSolidColorImage(100, 100, { r: 255, g: 0, b: 0 });

      // Act
      const result = analyzer.analyzeFrame(imageData);

      // Assert
      expect(result.saturation.mean).toBeGreaterThan(0.8);
    });
  });
});
```

### 测试覆盖率

- 新代码需要 80%+ 测试覆盖率
- 关键业务逻辑需要 100% 覆盖
- UI 组件至少测试渲染和交互

---

## 项目结构

```
VidLuxe/
├── apps/
│   └── web/                 # Next.js 应用
│       ├── app/             # App Router 页面
│       ├── components/      # React 组件
│       ├── hooks/           # 自定义 Hooks
│       ├── lib/             # 工具函数
│       └── styles/          # 样式文件
│
├── packages/
│   ├── types/               # 类型定义
│   │   └── src/
│   │       └── index.ts
│   │
│   ├── core/                # 核心引擎
│   │   └── src/
│   │       ├── analyzer/    # 分析器
│   │       ├── scorer/      # 评分器
│   │       ├── processor/   # 处理器
│   │       └── enhancer/    # 增强器
│   │
│   └── api/                 # tRPC API
│       └── src/
│           └── router/
│
├── docs/                    # 文档
│
├── e2e/                     # E2E 测试
│
└── turbo.json              # Turborepo 配置
```

---

## 开发工作流

### 分支策略

```
main          # 生产代码，只接受 PR
  └── develop # 开发分支
       ├── feature/xxx
       ├── fix/xxx
       └── refactor/xxx
```

### PR 检查清单

- [ ] 代码通过 lint 检查
- [ ] 代码通过类型检查
- [ ] 所有测试通过
- [ ] 新功能有对应测试
- [ ] 文档已更新（如需要）
- [ ] PR 描述清晰

### Code Review 标准

1. **正确性**：代码是否正确实现了功能
2. **可读性**：代码是否易于理解
3. **可维护性**：代码是否易于修改
4. **性能**：是否存在性能问题
5. **安全性**：是否存在安全漏洞

---

## 发布流程

### 版本号

使用语义化版本 (SemVer)：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的 API 变更
- **MINOR**：向后兼容的功能新增
- **PATCH**：向后兼容的 Bug 修复

### 发布步骤

1. 更新 CHANGELOG.md
2. 创建版本分支 `release/v1.x.x`
3. 更新 package.json 版本号
4. 合并到 main
5. 创建 GitHub Release
6. CI 自动部署

---

## 获取帮助

### 文档

- [架构设计](./ARCHITECTURE.md)
- [API 文档](./API.md)
- [模块文档](./MODULES/)

### 社区

- GitHub Discussions：功能讨论、问答
- GitHub Issues：Bug 报告、功能请求

---

## 许可证

本项目采用 MIT 许可证。贡献的代码将以相同许可证发布。

---

## 致谢

感谢所有贡献者的付出！

<a href="https://github.com/vidluxe/VidLuxe/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=vidluxe/VidLuxe" />
</a>
