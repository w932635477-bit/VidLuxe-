#!/usr/bin/env node

/**
 * 测试视频上传功能
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testUpload() {
  console.log('🧪 测试视频上传功能\n');

  // 使用本地测试视频
  const testVideoPath = path.join(__dirname, 'apps/web/public/test-video.mp4');

  if (!fs.existsSync(testVideoPath)) {
    console.error('❌ 测试视频不存在:', testVideoPath);
    return;
  }

  const videoBuffer = fs.readFileSync(testVideoPath);
  const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
  const videoFile = new File([videoBlob], 'test-video.mp4', { type: 'video/mp4' });

  const formData = new FormData();
  formData.append('file', videoFile);

  console.log('📤 上传到生产环境...');
  console.log('文件大小:', (videoBuffer.length / 1024).toFixed(2), 'KB\n');

  try {
    const response = await fetch('https://vidluxe.com.cn/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ 上传成功！');
      console.log('文件 URL:', data.file.url);
      console.log('文件 ID:', data.file.id);
      console.log('文件类型:', data.file.type);
      console.log('文件大小:', data.file.size, 'bytes');
    } else {
      console.log('❌ 上传失败');
      console.log('错误:', data.error);
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

testUpload();
