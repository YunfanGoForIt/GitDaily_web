#!/bin/bash
# GitDaily Android 构建脚本

set -e

echo "=== GitDaily Android 构建 ==="

# 1. 构建前端
echo "[1/4] 构建前端..."
npm run build

# 2. 同步到 Android 项目
echo "[2/4] 同步到 Android 项目..."
npx cap sync android

# 3. 检查 Android SDK
echo "[3/4] 检查 Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    echo "警告: ANDROID_HOME 未设置"
    echo "请设置 Android SDK 路径，例如:"
    echo "export ANDROID_HOME=$HOME/Android/Sdk"
fi

# 4. 构建 APK (如果安装了 Android SDK)
echo "[4/4] 构建 APK..."
if command -v ./android/gradlew &> /dev/null; then
    cd android
    ./gradlew assembleDebug
    echo ""
    echo "=== 构建完成 ==="
    echo "APK 位置: android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "未找到 gradlew，尝试用 npx 构建..."
    cd android
    npx gradle assembleDebug || {
        echo ""
        echo "=== 构建失败 ==="
        echo "请使用 Android Studio 打开项目构建:"
        echo "  npx cap open android"
        exit 1
    }
fi
