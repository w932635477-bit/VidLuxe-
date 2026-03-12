# CDN 配置检查清单

配置完成后，请逐项检查：

## ✅ 配置检查

- [ ] 规则 1：`/_next/static/` → 31536000 秒（365天）
- [ ] 规则 2：`/uploads/` → 86400 秒（1天）
- [ ] 规则 3：`/api/` → 不缓存
- [ ] 规则 4：`html` 后缀 → 不缓存
- [ ] 规则 5a：`/` → 不缓存
- [ ] 规则 5b：`/auth` → 不缓存
- [ ] 规则 5c：`/try` → 不缓存
- [ ] 规则 5d：`/pricing` → 不缓存
- [ ] 规则 5e：`/dashboard` → 不缓存
- [ ] 规则 6：`*` → 600 秒（10分钟）
- [ ] 已刷新 CDN 缓存

## ✅ 功能验证

等待 5-10 分钟后运行以下命令：

```bash
# 1. 验证静态资源缓存（应该看到 Cache-Control: max-age=31536000）
curl -I https://vidluxe.com.cn/_next/static/css/app-layout.css

# 2. 验证 HTML 不缓存（应该看到 Cache-Control: no-cache）
curl -I https://vidluxe.com.cn/

# 3. 验证 API 不缓存（应该看到 Cache-Control: no-cache）
curl -I https://vidluxe.com.cn/api/health
```

## 🎯 预期效果

配置成功后：
- ✅ 静态资源加载速度提升 50%+
- ✅ 服务器带宽成本降低 80%+
- ✅ 缓存命中率 > 90%
- ✅ 不再出现部署后样式丢失问题

## 📊 监控指标

登录腾讯云 CDN 控制台查看：
- **缓存命中率**：目标 > 90%
- **回源带宽**：目标 < 10% 总带宽

---

**配置时间**: 2026-03-12
**预计耗时**: 15 分钟
