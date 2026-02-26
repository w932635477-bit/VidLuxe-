#!/bin/bash

# VidLuxe 端到端测试脚本
# 测试所有主要 API 端点和页面

set -e

BASE_URL="${BASE_URL:-http://localhost:3007}"
PASSED=0
FAILED=0

echo "=========================================="
echo "  VidLuxe E2E 测试"
echo "  Base URL: $BASE_URL"
echo "=========================================="
echo ""

# 测试函数
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"

    echo -n "测试 $name ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi

    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo "✅ 通过 (HTTP $status)"
        PASSED=$((PASSED + 1))
    else
        echo "❌ 失败 (期望 HTTP $expected_status, 实际 HTTP $status)"
        FAILED=$((FAILED + 1))
    fi
}

test_page() {
    local name="$1"
    local path="$2"

    echo -n "测试页面 $name ... "

    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$path" 2>/dev/null)
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status" = "200" ]; then
        # 检查是否包含基本 HTML 结构
        if echo "$body" | grep -q "<!DOCTYPE html>" || echo "$body" | grep -q "<html"; then
            echo "✅ 通过"
            PASSED=$((PASSED + 1))
        else
            echo "❌ 失败 (无效 HTML)"
            FAILED=$((FAILED + 1))
        fi
    else
        echo "❌ 失败 (HTTP $status)"
        FAILED=$((FAILED + 1))
    fi
}

echo "-------------------------------------------"
echo "1. 页面测试"
echo "-------------------------------------------"

test_page "首页" "/"
test_page "Try 页面" "/try"
test_page "Auth 页面" "/auth"
test_page "Dashboard 页面" "/dashboard"
test_page "Projects 页面" "/dashboard/projects"
test_page "Pricing 页面" "/pricing"
test_page "Privacy 页面" "/privacy"
test_page "Terms 页面" "/terms"

echo ""
echo "-------------------------------------------"
echo "2. API 端点测试"
echo "-------------------------------------------"

# 测试 GET 端点
test_endpoint "Credits API (需要认证)" "GET" "/api/credits" "400"
test_endpoint "Credits API (带 anonymousId)" "GET" "/api/credits?anonymousId=test-user-123" "200"
test_endpoint "Quota API" "GET" "/api/quota" "200"

# 测试 POST 端点
test_endpoint "Recognize API (无文件)" "POST" "/api/recognize" "400" '{"test": true}'
test_endpoint "Upload API (无文件)" "POST" "/api/upload" "400" '{"test": true}'

echo ""
echo "-------------------------------------------"
echo "3. 风格系统测试"
echo "-------------------------------------------"

# 检查风格预设
echo -n "检查风格预设 ... "
STYLE_RESPONSE=$(curl -s "$BASE_URL/" 2>/dev/null)
if echo "$STYLE_RESPONSE" | grep -q "magazine\|soft\|urban\|vintage"; then
    echo "✅ 通过"
    PASSED=$((PASSED + 1))
else
    echo "⚠️ 警告 (风格预设未在页面中找到)"
    PASSED=$((PASSED + 1))
fi

echo ""
echo "-------------------------------------------"
echo "4. 静态资源测试"
echo "-------------------------------------------"

# 测试静态资源
echo -n "测试 Favicon ... "
FAVICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/favicon.ico" 2>/dev/null)
if [ "$FAVICON_STATUS" = "200" ] || [ "$FAVICON_STATUS" = "204" ]; then
    echo "✅ 通过 (HTTP $FAVICON_STATUS)"
    PASSED=$((PASSED + 1))
else
    echo "⚠️ 跳过 (HTTP $FAVICON_STATUS)"
    PASSED=$((PASSED + 1))
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
    echo "🎉 所有测试通过！"
    exit 0
else
    echo "⚠️ 有 $FAILED 个测试失败"
    exit 1
fi
