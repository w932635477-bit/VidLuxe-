# 视频上传问题诊断

## 问题描述

生产环境无法上传视频，但本地环境正常。

## 已验证的配置

### ✅ 1. Next.js 配置正确

```javascript
// next.config.mjs
experimental: {
  serverActions: {
    bodySizeLimit: '500mb',  // ✅ 已配置
  },
}
```

生产环境已包含此配置（verified in `.next/required-server-files.json`）

### ✅ 2. 文件系统权限正常

```bash
# 测试结果
当前工作目录: /opt/vidluxe/apps/web/.next/standalone/apps/web
上传目录路径: /opt/vidluxe/apps/web/.next/standalone/apps/web/public/uploads/videos
目录是否存在: true
目录权限: 40755
✅ 写入测试成功
✅ 删除测试成功
```

### ✅ 3. 代码版本一致

```bash
本地 BUILD_ID: nhGA8xcEgXYsFhBt80rM2
生产 BUILD_ID: nhGA8xcEgXYsFhBt80rM2
```

### ✅ 4. Server Action 代码正确

```typescript
// lib/actions/upload.ts
export async function uploadFile(formData: FormData): Promise<UploadResult> {
  const file = formData.get('file');
  // ... 处理逻辑
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);
  fs.writeFileSync(filePath, buffer);
  return { success: true, file: { url: `/uploads/${subDir}/${finalFilename}` } };
}
```

### ✅ 5. 前端调用正确

```typescript
// components/features/try/flows/VideoFlow/index.tsx:245
const formData = new FormData();
formData.append('file', file);
const data = await uploadFile(formData);  // Server Action
```

## 需要诊断的问题

### 可能的原因

1. **浏览器端错误**
   - File API 不可用
   - FormData 序列化失败
   - Server Action 调用失败

2. **网络问题**
   - CDN 拦截大文件上传
   - Nginx 配置限制
   - 超时设置

3. **Server Action 问题**
   - 序列化/反序列化失败
   - 运行时错误未捕获

## 诊断步骤

### 步骤 1：查看浏览器控制台错误

1. 打开 https://vidluxe.com.cn/try?mode=video
2. 打开浏览器开发者工具（F12）
3. 切换到 Console 标签
4. 尝试上传一个小视频（< 10MB）
5. 记录所有错误信息

**预期错误类型**：
- `TypeError: Failed to fetch`
- `Error: Server Action failed`
- `413 Payload Too Large`
- 其他错误信息

### 步骤 2：查看网络请求

1. 在开发者工具中切换到 Network 标签
2. 尝试上传视频
3. 查找 Server Action 请求（通常是 POST 请求）
4. 检查：
   - 请求状态码
   - 请求头
   - 响应内容

### 步骤 3：查看服务器日志

上传后立即运行：

```bash
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "pm2 logs vidluxe --lines 50 --nostream"
```

### 步骤 4：检查 Nginx 配置

```bash
ssh -i ~/.ssh/id_vidluxe root@146.56.193.40 "cat /etc/nginx/conf.d/vidluxe.conf | grep -A5 'client_max_body_size'"
```

**预期配置**：
```nginx
client_max_body_size 500M;
```

## 临时解决方案

如果 Server Action 有问题，可以改用 API Route：

### 方案 A：使用 API Route + Multipart

```typescript
// app/api/upload/route.ts
export const config = {
  api: {
    bodyParser: false,  // 禁用默认 body parser
  },
};

export async function POST(request: Request) {
  // 使用 formidable 或 busboy 处理 multipart
}
```

### 方案 B：使用分片上传

```typescript
// 前端分片上传
const chunkSize = 5 * 1024 * 1024; // 5MB
for (let i = 0; i < file.size; i += chunkSize) {
  const chunk = file.slice(i, i + chunkSize);
  await uploadChunk(chunk, i / chunkSize);
}
```

## 下一步

1. **立即执行**：在浏览器中测试上传，记录错误信息
2. **如果有错误**：根据错误类型选择对应的修复方案
3. **如果没有错误但上传失败**：检查服务器日志和 Nginx 配置

---

**更新时间**: 2026-03-12
**状态**: 等待浏览器测试结果
