/**
 * 视频处理 API 测试
 *
 * 测试流程：
 * 1. 测试视频分析 API - 提取关键帧
 * 2. 测试封面增强 API - 增强关键帧
 */

const BASE_URL = 'http://localhost:3000';

// 测试视频 - 使用项目中已有的视频
const TEST_VIDEOS = [
  '/uploads/videos/file_1771663757088_164f36141ddc.mp4',
];

// 测试效果
const TEST_EFFECT = 'outfit-magazine';

interface KeyFrame {
  timestamp: number;
  url: string;
  score: number;
}

interface TestResult {
  api: string;
  success: boolean;
  duration: number;
  data?: any;
  error?: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 测试视频分析 API
 */
async function testVideoAnalyze(videoUrl: string): Promise<TestResult> {
  const startTime = Date.now();
  console.log(`\n📹 测试视频分析 API`);
  console.log(`   视频URL: ${videoUrl}`);

  try {
    const res = await fetch(`${BASE_URL}/api/video/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    });

    const json = await res.json();
    const duration = Date.now() - startTime;

    if (!json.success) {
      console.log(`   ❌ 失败: ${json.error}`);
      return { api: 'video/analyze', success: false, duration, error: json.error };
    }

    const keyframes = json.keyframes as KeyFrame[];
    console.log(`   ✅ 成功: 提取了 ${keyframes.length} 个关键帧`);
    console.log(`   ⏱️  耗时: ${(duration / 1000).toFixed(1)}s`);

    // 显示前3个关键帧信息
    keyframes.slice(0, 3).forEach((frame, i) => {
      console.log(`   帧${i + 1}: 时间=${frame.timestamp.toFixed(1)}s, 评分=${frame.score.toFixed(2)}, URL=${frame.url.slice(0, 50)}...`);
    });

    return {
      api: 'video/analyze',
      success: true,
      duration,
      data: { keyframes, videoInfo: json.videoInfo }
    };
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ 异常: ${e.message}`);
    return { api: 'video/analyze', success: false, duration, error: e.message };
  }
}

/**
 * 测试封面增强 API
 */
async function testEnhanceCover(frameUrl: string, effectId: string): Promise<TestResult> {
  const startTime = Date.now();
  console.log(`\n🖼️ 测试封面增强 API`);
  console.log(`   帧URL: ${frameUrl.slice(0, 60)}...`);
  console.log(`   效果ID: ${effectId}`);

  try {
    const res = await fetch(`${BASE_URL}/api/video/enhance-cover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frameUrl,
        effectId,
        intensity: 100,
        contentType: 'fashion',
      }),
    });

    const json = await res.json();
    const duration = Date.now() - startTime;

    if (!json.success) {
      console.log(`   ❌ 失败: ${json.error}`);
      return { api: 'video/enhance-cover', success: false, duration, error: json.error };
    }

    console.log(`   ✅ 成功: 增强完成`);
    console.log(`   ⏱️  耗时: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   结果URL: ${json.enhancedUrl}`);

    return {
      api: 'video/enhance-cover',
      success: true,
      duration,
      data: { enhancedUrl: json.enhancedUrl }
    };
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ 异常: ${e.message}`);
    return { api: 'video/enhance-cover', success: false, duration, error: e.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('视频处理 API 测试');
  console.log('='.repeat(60));
  console.log(`\n测试环境: ${BASE_URL}`);
  console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);

  const results: TestResult[] = [];

  // 测试视频分析
  console.log('\n' + '='.repeat(60));
  console.log('第1步: 测试视频分析 API');
  console.log('='.repeat(60));

  const analyzeResult = await testVideoAnalyze(TEST_VIDEOS[0]);
  results.push(analyzeResult);

  if (!analyzeResult.success || !analyzeResult.data?.keyframes?.length) {
    console.log('\n❌ 视频分析失败，无法继续测试封面增强');
    return;
  }

  // 测试封面增强 - 只测试第一个关键帧
  console.log('\n' + '='.repeat(60));
  console.log('第2步: 测试封面增强 API');
  console.log('='.repeat(60));

  const firstFrame = analyzeResult.data.keyframes[0];
  const enhanceResult = await testEnhanceCover(firstFrame.url, TEST_EFFECT);
  results.push(enhanceResult);

  // 汇总结果
  console.log('\n' + '='.repeat(60));
  console.log('测试汇总');
  console.log('='.repeat(60) + '\n');

  console.log('| API端点 | 状态 | 耗时 |');
  console.log('|---------|------|------|');

  for (const result of results) {
    const status = result.success ? '✅ 通过' : '❌ 失败';
    const duration = `${(result.duration / 1000).toFixed(1)}s`;
    console.log(`| ${result.api} | ${status} | ${duration} |`);
  }

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log('\n' + '-'.repeat(60));
  console.log(`总计: ${totalCount} 项测试`);
  console.log(`通过: ${successCount} 项`);
  console.log(`失败: ${totalCount - successCount} 项`);
  console.log(`通过率: ${((successCount / totalCount) * 100).toFixed(1)}%`);

  if (successCount === totalCount) {
    console.log('\n🎉 所有视频 API 测试通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查日志');
  }
}

runTests().catch(console.error);
