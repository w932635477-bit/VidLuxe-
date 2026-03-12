# CDN 缓存规则配置 - 快速参考

## 🚀 快速配置（复制粘贴）

### 规则 1: Next.js 静态资源
```
类型: 目录
路径: /_next/static/
缓存: 31536000 秒 (365天)
优先级: 1
```

### 规则 2: 用户上传文件
```
类型: 目录
路径: /uploads/
缓存: 86400 秒 (1天)
优先级: 2
```

### 规则 3: API 请求
```
类型: 目录
路径: /api/
缓存: 不缓存
优先级: 3
```

### 规则 4: HTML 文件
```
类型: 文件后缀
内容: html
缓存: 不缓存
优先级: 4
```

### 规则 5: 关键页面（分别添加）
```
类型: 文件
路径: /
缓存: 不缓存
优先级: 5

类型: 文件
路径: /auth
缓存: 不缓存
优先级: 5

类型: 文件
路径: /try
缓存: 不缓存
优先级: 5

类型: 文件
路径: /pricing
缓存: 不缓存
优先级: 5

类型: 文件
路径: /dashboard
缓存: 不缓存
优先级: 5
```

### 规则 6: 默认规则
```
类型: 全部文件
内容: *
缓存: 600 秒 (10分钟)
优先级: 99
```

---

## 📋 刷新 CDN 缓存

### 目录刷新（推荐）
```
https://vidluxe.com.cn/
https://vidluxe.com.cn/_next/static/
```

### URL 刷新（备选）
```
https://vidluxe.com.cn/
https://vidluxe.com.cn/auth
https://vidluxe.com.cn/try
https://vidluxe.com.cn/pricing
```

---

## ✅ 验证命令

```bash
# 验证静态资源缓存
curl -I https://vidluxe.com.cn/_next/static/css/app-layout.css

# 验证 HTML 不缓存
curl -I https://vidluxe.com.cn/

# 验证 API 不缓存
curl -I https://vidluxe.com.cn/api/health
```

---

## 🎯 预期结果

| 资源类型 | 缓存时间 | X-Cache-Lookup |
|---------|---------|----------------|
| `/_next/static/*` | 365 天 | Cache Hit |
| `/uploads/*` | 1 天 | Cache Hit |
| `/api/*` | 不缓存 | Cache Miss |
| `*.html` | 不缓存 | Cache Miss |
| `/`, `/auth`, `/try` | 不缓存 | Cache Miss |
| 其他 | 10 分钟 | Cache Hit |

---

**详细文档**: `/docs/CDN_SETUP_GUIDE.md`
