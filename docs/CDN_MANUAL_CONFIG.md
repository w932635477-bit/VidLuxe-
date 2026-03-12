# CDN 缓存规则配置说明

由于腾讯云 CDN API 的复杂性，建议通过以下方式配置：

## 方式 1：使用腾讯云控制台（推荐，15 分钟）

1. 访问：https://console.cloud.tencent.com/cdn/domains/vidluxe.com.cn?tab=cache

2. 点击「缓存配置」→「缓存规则配置」→「新增规则」

3. 按照以下顺序添加规则：

### 规则 1：Next.js 静态资源
- 类型：目录
- 内容：`/_next/static/`
- 缓存时间：31536000 秒（365天）
- 点击「确定」

### 规则 2：用户上传文件
- 类型：目录
- 内容：`/uploads/`
- 缓存时间：86400 秒（1天）
- 点击「确定」

### 规则 3：API 请求
- 类型：目录
- 内容：`/api/`
- 缓存时间：0 秒（不缓存）
- 点击「确定」

### 规则 4：HTML 文件
- 类型：文件后缀
- 内容：`html`
- 缓存时间：0 秒（不缓存）
- 点击「确定」

### 规则 5：关键页面（需添加 5 次）
- 类型：文件
- 内容：`/`（然后分别添加 `/auth`、`/try`、`/pricing`、`/dashboard`）
- 缓存时间：0 秒（不缓存）
- 每个都点击「确定」

### 规则 6：默认规则
- 类型：全部文件
- 内容：`*`
- 缓存时间：600 秒（10分钟）
- 点击「确定」

4. 刷新 CDN 缓存
   - 进入「缓存刷新」页面
   - 选择「目录刷新」
   - 输入：
     ```
     https://vidluxe.com.cn/
     https://vidluxe.com.cn/_next/static/
     ```
   - 点击「提交」

5. 等待 5-10 分钟后验证

## 方式 2：使用 Playwright 自动化（需要浏览器）

如果你想自动化配置，可以使用 Playwright 脚本登录控制台并自动配置。

## 验证命令

配置完成后运行：

```bash
# 验证静态资源缓存
curl -I https://vidluxe.com.cn/_next/static/css/app-layout.css

# 验证 HTML 不缓存
curl -I https://vidluxe.com.cn/

# 验证 API 不缓存
curl -I https://vidluxe.com.cn/api/health
```

## 预期效果

- ✅ 静态资源加载速度提升 50%+
- ✅ 服务器带宽成本降低 80%+
- ✅ 缓存命中率 > 90%
- ✅ 不再出现部署后样式丢失问题
