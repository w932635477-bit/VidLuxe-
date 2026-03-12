#!/usr/bin/env python3
"""
腾讯云 CDN 缓存规则配置脚本 - 使用 SDK
"""

import json
from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.cdn.v20180606 import cdn_client, models

# 从环境变量或 tccli 配置读取凭证
import os
SECRET_ID = os.getenv("TENCENT_SECRET_ID", "")
SECRET_KEY = os.getenv("TENCENT_SECRET_KEY", "")
REGION = "ap-guangzhou"
DOMAIN = "vidluxe.com.cn"

if not SECRET_ID or not SECRET_KEY:
    print("❌ 请设置环境变量 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY")
    print("或运行: tccli configure")
    exit(1)

def configure_cdn_cache():
    """配置 CDN 缓存规则"""
    try:
        print("🚀 开始配置腾讯云 CDN 缓存规则\n")

        # 创建认证对象
        cred = credential.Credential(SECRET_ID, SECRET_KEY)

        # 创建 CDN 客户端
        client = cdn_client.CdnClient(cred, REGION)

        # 构建请求
        req = models.UpdateDomainConfigRequest()
        params = {
            "Domain": DOMAIN,
            "Cache": {
                "RuleCache": {
                    "RuleCacheConfig": [
                        {
                            "CacheType": "path",
                            "CacheContents": ["/_next/static/"],
                            "CacheTime": 31536000,  # 365 天
                            "RulePaths": ["/_next/static/"],
                            "RuleType": "directory"
                        },
                        {
                            "CacheType": "path",
                            "CacheContents": ["/uploads/"],
                            "CacheTime": 86400,  # 1 天
                            "RulePaths": ["/uploads/"],
                            "RuleType": "directory"
                        },
                        {
                            "CacheType": "path",
                            "CacheContents": ["/api/"],
                            "CacheTime": 0,  # 不缓存
                            "RulePaths": ["/api/"],
                            "RuleType": "directory"
                        },
                        {
                            "CacheType": "suffix",
                            "CacheContents": ["html"],
                            "CacheTime": 0,  # 不缓存
                            "RulePaths": ["html"],
                            "RuleType": "suffix"
                        },
                        {
                            "CacheType": "index",
                            "CacheContents": ["/"],
                            "CacheTime": 0,  # 不缓存
                            "RulePaths": ["/"],
                            "RuleType": "index"
                        },
                        {
                            "CacheType": "path",
                            "CacheContents": ["/auth"],
                            "CacheTime": 0,  # 不缓存
                            "RulePaths": ["/auth"],
                            "RuleType": "file"
                        },
                        {
                            "CacheType": "path",
                            "CacheContents": ["/try"],
                            "CacheTime": 0,  # 不缓存
                            "RulePaths": ["/try"],
                            "RuleType": "file"
                        },
                        {
                            "CacheType": "path",
                            "CacheContents": ["/pricing"],
                            "CacheTime": 0,  # 不缓存
                            "RulePaths": ["/pricing"],
                            "RuleType": "file"
                        },
                        {
                            "CacheType": "path",
                            "CacheContents": ["/dashboard"],
                            "CacheTime": 0,  # 不缓存
                            "RulePaths": ["/dashboard"],
                            "RuleType": "file"
                        },
                        {
                            "CacheType": "all",
                            "CacheContents": ["*"],
                            "CacheTime": 600,  # 10 分钟
                            "RulePaths": ["*"],
                            "RuleType": "all"
                        }
                    ],
                    "FollowOrigin": "on"
                }
            }
        }

        req.from_json_string(json.dumps(params))

        print("📝 配置内容:")
        print(json.dumps(params, indent=2, ensure_ascii=False))
        print()

        # 发送请求
        print("🔧 正在更新 CDN 配置...")
        resp = client.UpdateDomainConfig(req)

        print("✅ CDN 缓存规则配置成功！")
        print(f"请求 ID: {resp.RequestId}")

        # 刷新缓存
        print("\n🔄 刷新 CDN 缓存...")
        purge_req = models.PurgePathCacheRequest()
        purge_params = {
            "Paths": [
                "https://vidluxe.com.cn/",
                "https://vidluxe.com.cn/_next/static/"
            ],
            "FlushType": "delete"
        }
        purge_req.from_json_string(json.dumps(purge_params))
        purge_resp = client.PurgePathCache(purge_req)

        print("✅ CDN 缓存刷新任务已提交")
        print(f"任务 ID: {purge_resp.TaskId}")

        print("\n" + "="*60)
        print("🎉 CDN 配置完成！")
        print("="*60)
        print("\n⏰ 请等待 5-10 分钟后验证配置是否生效")
        print("\n验证命令：")
        print("  curl -I https://vidluxe.com.cn/_next/static/css/app-layout.css")
        print("  curl -I https://vidluxe.com.cn/")
        print("  curl -I https://vidluxe.com.cn/api/health")

    except TencentCloudSDKException as err:
        print(f"❌ 配置失败: {err}")
        return False

    return True

if __name__ == "__main__":
    configure_cdn_cache()
