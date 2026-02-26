#!/bin/bash

# VidLuxe 封装测试脚本
# 验证组件 API 和公共接口的封装正确性

set -e

PASSED=0
FAILED=0

echo "=========================================="
echo "  VidLuxe 封装测试"
echo "=========================================="
echo ""

# 测试函数
check_export() {
    local name="$1"
    local file="$2"
    local export="$3"

    echo -n "检查 $name ... "

    if grep -q "export.*$export" "$file" 2>/dev/null; then
        echo "✅ 通过"
        PASSED=$((PASSED + 1))
    else
        echo "❌ 失败 (未找到导出: $export)"
        FAILED=$((FAILED + 1))
    fi
}

check_type_export() {
    local name="$1"
    local file="$2"
    local type="$3"

    echo -n "检查类型 $name ... "

    if grep -q "export type.*$type\|export interface.*$type" "$file" 2>/dev/null; then
        echo "✅ 通过"
        PASSED=$((PASSED + 1))
    else
        echo "❌ 失败 (未找到类型导出: $type)"
        FAILED=$((FAILED + 1))
    fi
}

check_no_internal_export() {
    local dir="$1"
    local pattern="$2"

    echo -n "检查 $dir 无内部泄露 ... "

    # 检查是否有敏感信息被导出
    if grep -r "export.*API_KEY\|export.*SECRET\|export.*PASSWORD" "$dir" --include="*.ts" --include="*.tsx" 2>/dev/null; then
        echo "❌ 失败 (发现敏感信息导出)"
        FAILED=$((FAILED + 1))
    else
        echo "✅ 通过"
        PASSED=$((PASSED + 1))
    fi
}

echo "-------------------------------------------"
echo "1. 核心类型导出测试"
echo "-------------------------------------------"

check_type_export "StyleType" "apps/web/lib/stores/try-store.ts" "StyleType"
check_type_export "MultiStyleType" "apps/web/lib/stores/try-store.ts" "MultiStyleType"
check_type_export "CategoryType" "apps/web/lib/types/seeding.ts" "CategoryType"
check_type_export "PresetStyle" "apps/web/lib/style-prompts.ts" "PresetStyle"
check_type_export "PremiumStyle" "packages/types/src/index.ts" "PremiumStyle"

echo ""
echo "-------------------------------------------"
echo "2. 组件导出测试"
echo "-------------------------------------------"

check_export "StyleSelector" "apps/web/components/features/try/StyleSelector.tsx" "StyleSelector"
check_export "AuthProvider" "apps/web/components/auth/AuthProvider.tsx" "AuthProvider"
check_export "useAuth" "apps/web/components/auth/AuthProvider.tsx" "useAuth"

echo ""
echo "-------------------------------------------"
echo "3. API 函数导出测试"
echo "-------------------------------------------"

check_export "getAvailableCredits" "apps/web/lib/credits/manager.ts" "getAvailableCredits"
check_export "spendCredits" "apps/web/lib/credits/manager.ts" "spendCredits"
check_export "getTaskQueue" "apps/web/lib/task-queue.ts" "getTaskQueue"
check_export "getFileStorage" "apps/web/lib/file-storage.ts" "getFileStorage"

echo ""
echo "-------------------------------------------"
echo "4. 安全检查"
echo "-------------------------------------------"

check_no_internal_export "apps/web/lib" "敏感信息"

echo ""
echo "-------------------------------------------"
echo "5. 模块封装测试"
echo "-------------------------------------------"

# 检查 lib 目录的 index 文件
echo -n "检查 credits 模块封装 ... "
if [ -f "apps/web/lib/credits/index.ts" ]; then
    echo "✅ 通过"
    PASSED=$((PASSED + 1))
else
    echo "❌ 失败"
    FAILED=$((FAILED + 1))
fi

echo -n "检查 stores 模块封装 ... "
if [ -f "apps/web/lib/stores/try-store.ts" ]; then
    echo "✅ 通过"
    PASSED=$((PASSED + 1))
else
    echo "❌ 失败"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "-------------------------------------------"
echo "6. 类型一致性测试"
echo "-------------------------------------------"

# 检查风格类型是否一致
echo -n "检查风格类型一致性 ... "
STYLE_COUNT=$(grep -r "'magazine'\\|'soft'\\|'urban'\\|'vintage'" apps/web/lib/style-prompts.ts apps/web/lib/stores/try-store.ts packages/types/src/index.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$STYLE_COUNT" -gt 0 ]; then
    echo "✅ 通过 (找到 $STYLE_COUNT 处风格定义)"
    PASSED=$((PASSED + 1))
else
    echo "❌ 失败"
    FAILED=$((FAILED + 1))
fi

# 检查旧风格是否已清理
echo -n "检查旧风格已清理 ... "
OLD_STYLE_COUNT=$(grep -r "'minimal'\\|'warmLuxury'\\|'coolPro'\\|'morandi'" apps/web/lib/*.ts 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
if [ "$OLD_STYLE_COUNT" -eq 0 ]; then
    echo "✅ 通过"
    PASSED=$((PASSED + 1))
else
    echo "❌ 失败 (发现 $OLD_STYLE_COUNT 处旧风格)"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "-------------------------------------------"
echo "7. 包导出测试"
echo "-------------------------------------------"

# 检查 packages 的导出
echo -n "检查 @vidluxe/types 导出 ... "
if [ -f "packages/types/src/index.ts" ] && grep -q "export" "packages/types/src/index.ts"; then
    echo "✅ 通过"
    PASSED=$((PASSED + 1))
else
    echo "❌ 失败"
    FAILED=$((FAILED + 1))
fi

echo -n "检查 @vidluxe/core 导出 ... "
if [ -f "packages/core/src/index.ts" ] && grep -q "export" "packages/core/src/index.ts"; then
    echo "✅ 通过"
    PASSED=$((PASSED + 1))
else
    echo "❌ 失败"
    FAILED=$((FAILED + 1))
fi

echo ""
echo "=========================================="
echo "  测试结果汇总"
echo "=========================================="
echo ""
echo "✅ 通过: $PASSED"
echo "❌ 失败: $FAILED"
echo "总计: $((PASSED + FAILED)) 个测试"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 所有封装测试通过！"
    exit 0
else
    echo "⚠️ 有 $FAILED 个测试失败"
    exit 1
fi
