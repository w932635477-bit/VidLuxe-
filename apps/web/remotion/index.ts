/**
 * Remotion 配置文件
 */

import { Config } from '@remotion/cli/config';

// 配置视频输出
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Lambda 配置
Config.setLambdaFunctionMemory(2048); // 至少 2GB 内存
Config.setLambdaFunctionTimeout(120); // 2 分钟超时

// 并发渲染配置
Config.setMaxTimelineTracks(4);
