#!/bin/bash
# 部署前页面完整性验证脚本
# 确保首页和 try 页面没有被错误修改

set -e

echo "🔍 验证页面完整性..."

# 检查首页是否包含正确的组件导入
HOMEPAGE="apps/web/app/page.tsx"

if ! grep -q "BeforeAfterSlider" "$HOMEPAGE"; then
    echo "❌ 错误：首页缺少 BeforeAfterSlider 组件"
    exit 1
fi

if ! grep -q "HorizontalHeroSlider" "$HOMEPAGE"; then
    echo "❌ 错误：首页缺少 HorizontalHeroSlider 组件"
    exit 1
fi

if grep -q "ImageSingleFlow\|ImageBatchFlow\|VideoFlow" "$HOMEPAGE"; then
    echo "❌ 错误：首页错误地导入了 try 页面的 Flow 组件"
    exit 1
fi

# 检查 try 页面是否包含正确的组件导入
TRYPAGE="apps/web/app/try/page.tsx"

if ! grep -q "ImageSingleFlow\|ImageBatchFlow\|VideoFlow" "$TRYPAGE"; then
    echo "❌ 错误：try 页面缺少 Flow 组件"
    exit 1
fi

if grep -q "BeforeAfterSlider\|HorizontalHeroSlider" "$TRYPAGE"; then
    echo "❌ 错误：try 页面错误地导入了 landing 组件"
    exit 1
fi

# 检查是否存在备份文件
BACKUP_FILES=$(find apps/web -name "*.backup" -o -name "*.bak" -o -name ".backup" -type d 2>/dev/null | head -5)
if [ -n "$BACKUP_FILES" ]; then
    echo "⚠️  警告：发现备份文件："
    echo "$BACKUP_FILES"
    echo "建议删除这些文件以避免混淆"
fi

echo "✅ 页面完整性验证通过"
echo "   - 首页组件导入正确"
echo "   - try 页面组件导入正确"
