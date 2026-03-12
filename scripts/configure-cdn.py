#!/usr/bin/env python3
"""
腾讯云 CDN 缓存规则配置脚本
"""

import json
import subprocess
import sys

def run_tccli(command):
    """执行 tccli 命令"""
    full_command = f"export PATH=\"$HOME/Library/Python/3.9/bin:$PATH\" && {command}"
    result = subprocess.run(
        full_command,
        shell=True,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"❌ 命令执行失败: {command}")
        print(f"错误: {result.stderr}")
        return None

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"⚠️ 无法解析 JSON 响应")
        print(f"输出: {result.stdout}")
        return None

def get_domain_info():
    """获取域名信息"""
    print("📋 获取域名信息...")

    result = run_tccli('tccli cdn DescribeDomains')

    if not result or 'Domains' not in result:
        print("❌ 无法获取域名列表")
        return None

    # 查找 vidluxe.com.cn
    for domain in result['Domains']:
        if domain['Domain'] == 'vidluxe.com.cn':
            print(f"✅ 找到域名: {domain['Domain']}")
            return domain

    print("❌ 未找到域名 vidluxe.com.cn")
    return None

def update_cache_rules(domain):
    """更新缓存规则"""
    print("\n🔧 配置缓存规则...")

    # 构建缓存规则配置 - 使用腾讯云 API 正确格式
    cache_rules = [
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
            "CacheContents": ["/auth", "/try", "/pricing", "/dashboard"],
            "CacheTime": 0,  # 不缓存
            "RulePaths": ["/auth", "/try", "/pricing", "/dashboard"],
            "RuleType": "file"
        },
        {
            "CacheType": "all",
            "CacheContents": ["*"],
            "CacheTime": 600,  # 10 分钟
            "RulePaths": ["*"],
            "RuleType": "all"
        }
    ]

    # 构建 JSON 配置
    config = {
        "Domain": "vidluxe.com.cn",
        "Cache": {
            "RuleCache": {
                "RuleCacheConfig": cache_rules
            }
        }
    }

    # 保存配置到临时文件
    config_file = "/tmp/cdn_cache_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)

    print(f"📝 配置文件已保存: {config_file}")
    print(json.dumps(config, indent=2, ensure_ascii=False))

    # 执行更新
    command = f'tccli cdn UpdateDomainConfig --cli-input-json file://{config_file}'
    result = run_tccli(command)

    if result:
        print("✅ CDN 缓存规则配置成功！")
        return True
    else:
        print("❌ CDN 缓存规则配置失败")
        return False

def purge_cache():
    """刷新 CDN 缓存"""
    print("\n🔄 刷新 CDN 缓存...")

    urls = [
        "https://vidluxe.com.cn/",
        "https://vidluxe.com.cn/_next/static/"
    ]

    config = {
        "Paths": urls,
        "FlushType": "delete"
    }

    config_file = "/tmp/cdn_purge_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)

    command = f'tccli cdn PurgePathCache --cli-input-json file://{config_file}'
    result = run_tccli(command)

    if result:
        print("✅ CDN 缓存刷新任务已提交")
        print(f"任务 ID: {result.get('TaskId', 'N/A')}")
        return True
    else:
        print("❌ CDN 缓存刷新失败")
        return False

def main():
    print("🚀 开始配置腾讯云 CDN 缓存规则\n")

    # 1. 获取域名信息
    domain = get_domain_info()
    if not domain:
        sys.exit(1)

    # 2. 更新缓存规则
    if not update_cache_rules(domain):
        sys.exit(1)

    # 3. 刷新缓存
    if not purge_cache():
        print("⚠️ 缓存刷新失败，但规则已配置")

    print("\n" + "="*60)
    print("🎉 CDN 配置完成！")
    print("="*60)
    print("\n⏰ 请等待 5-10 分钟后验证配置是否生效")
    print("\n验证命令：")
    print("  curl -I https://vidluxe.com.cn/_next/static/css/app-layout.css")
    print("  curl -I https://vidluxe.com.cn/")
    print("  curl -I https://vidluxe.com.cn/api/health")

if __name__ == "__main__":
    main()
