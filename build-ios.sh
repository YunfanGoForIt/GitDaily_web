#!/bin/bash
# GitDaily iOS 构建脚本 (macOS only)

set -e

echo "=== GitDaily iOS 构建 ==="

# 检查是否在 macOS 上运行
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "错误: iOS 构建只能在 macOS 上运行"
    echo "请在 Mac 上执行此脚本"
    exit 1
fi

# 检查 Xcode 是否安装
if ! command -v xcodebuild &> /dev/null; then
    echo "错误: 未找到 Xcode"
    echo "请从 App Store 安装 Xcode"
    exit 1
fi

# 1. 构建前端
echo "[1/3] 构建前端..."
npm run build

# 2. 同步到 iOS 项目
echo "[2/3] 同步到 iOS 项目..."
npx cap sync ios

# 3. 打开 Xcode
echo "[3/3] 打开 Xcode..."
echo "请在 Xcode 中选择设备并点击运行按钮"
npx cap open ios

echo ""
echo "=== 完成 ==="
echo "Xcode 已打开，请选择设备："
echo "  - 真机：连接 iPhone/iPad"
echo "  - 模拟器：选择 iOS Simulator"
echo ""
echo "首次运行需要配置签名："
echo "  1. 在 Xcode 中选择 GitDaily 项目"
echo "  2. 选择 Signing & Capabilities"
echo "  3. 选择你的 Apple ID 团队"
echo ""
