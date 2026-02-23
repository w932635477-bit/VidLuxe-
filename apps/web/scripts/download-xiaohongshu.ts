import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import http from 'http';

const DOWNLOAD_DIR = path.join(__dirname, '../public/uploads/test');

// 确保下载目录存在
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// 下载图片的辅助函数
function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadImage(response.headers.location!, filepath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('启动浏览器...');
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });

  const page: Page = await context.newPage();

  // 存储下载的图片URL
  const imageUrls: string[] = [];

  // 监听网络请求，捕获图片URL
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('xhscdn.com') && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp'))) {
      if (!imageUrls.includes(url)) {
        imageUrls.push(url);
        console.log(`发现图片: ${url.substring(0, 80)}...`);
      }
    }
  });

  try {
    // 访问小红书搜索页面 - 美妆类内容
    console.log('\n访问小红书搜索页面...');
    await page.goto('https://www.xiaohongshu.com/search_result?keyword=%E7%BE%8E%E5%A6%86%E6%95%99%E7%A8%8B', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 等待页面加载
    await page.waitForTimeout(3000);

    // 滚动页面以加载更多内容
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
    }

    console.log(`\n发现 ${imageUrls.length} 张图片`);

    // 下载前 5 张图片
    const toDownload = imageUrls.slice(0, 5);
    console.log(`\n开始下载 ${toDownload.length} 张测试图片...`);

    for (let i = 0; i < toDownload.length; i++) {
      const url = toDownload[i];
      const ext = url.includes('.png') ? 'png' : url.includes('.webp') ? 'webp' : 'jpg';
      const filename = `xiaohongshu-test-${i + 1}.${ext}`;
      const filepath = path.join(DOWNLOAD_DIR, filename);

      try {
        await downloadImage(url, filepath);
        console.log(`✓ 下载成功: ${filename}`);
      } catch (err) {
        console.log(`✗ 下载失败: ${filename} - ${err}`);
      }
    }

    // 同时访问穿搭类内容
    console.log('\n访问小红书穿搭搜索页面...');
    await page.goto('https://www.xiaohongshu.com/search_result?keyword=%E6%98%A5%E5%A4%8F%E7%A9%BF%E6%90%AD', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
    }

    // 下载更多图片
    const newUrls = imageUrls.slice(5, 10);
    for (let i = 0; i < newUrls.length; i++) {
      const url = newUrls[i];
      const ext = url.includes('.png') ? 'png' : url.includes('.webp') ? 'webp' : 'jpg';
      const filename = `xiaohongshu-outfit-${i + 1}.${ext}`;
      const filepath = path.join(DOWNLOAD_DIR, filename);

      try {
        await downloadImage(url, filepath);
        console.log(`✓ 下载成功: ${filename}`);
      } catch (err) {
        console.log(`✗ 下载失败: ${filename} - ${err}`);
      }
    }

  } catch (error) {
    console.error('发生错误:', error);
  }

  // 列出下载的文件
  console.log('\n下载的文件:');
  const files = fs.readdirSync(DOWNLOAD_DIR);
  files.forEach(file => {
    const stat = fs.statSync(path.join(DOWNLOAD_DIR, file));
    console.log(`  ${file} - ${(stat.size / 1024).toFixed(1)} KB`);
  });

  await browser.close();
  console.log('\n完成！');
}

main().catch(console.error);
