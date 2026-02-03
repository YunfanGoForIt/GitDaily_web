# GitDaily Android 构建指南

## 环境要求

- Node.js 18+
- Android Studio (推荐) 或 Android SDK
- JDK 17

## 快速开始

### 1. 自动构建

```bash
chmod +x build-android.sh
./build-android.sh
```

### 2. 手动构建

```bash
# 构建前端
npm run build

# 同步到 Android 项目
npx cap sync android

# 打开 Android Studio
npx cap open android

# 在 Android Studio 中点击 Build -> Build Bundle(s) / APK(s) -> Build APK(s)
```

## 开发模式（热重载）

让 App 直接加载开发服务器，方便调试：

1. 获取电脑 IP 地址：
   ```bash
   ip addr show | grep "inet " | head -1
   ```

2. 修改 `capacitor.config.ts`，取消注释 server.url：
   ```typescript
   server: {
     url: 'http://YOUR_IP:3000',
     cleartext: true
   }
   ```

3. 启动开发服务器：
   ```bash
   npm run dev -- --host
   ```

4. 同步并运行：
   ```bash
   npx cap sync android
   npx cap run android
   ```

## 配置后端 API 地址

App 需要连接到后端 API。修改 `src/services/api.ts` 中的 API 基础 URL：

```typescript
// 开发环境（手机和电脑在同一 WiFi）
const API_BASE = 'http://YOUR_COMPUTER_IP:3001/api';

// 生产环境（部署到服务器）
const API_BASE = 'https://your-server.com/api';
```

## 项目结构

```
android/                    # Android 原生项目
├── app/src/main/
│   ├── assets/public/      # Web 静态资源 (由 Capacitor 同步)
│   ├── java/               # Java/Kotlin 代码
│   └── res/                # 资源文件
├── build.gradle            # 构建配置
└── ...
```

## 常见问题

### 1. 无法连接到后端 API

- 确保手机和电脑在同一 WiFi
- 检查防火墙设置
- 确认 API 地址使用了电脑的实际 IP（不是 localhost）

### 2. 构建失败

```bash
# 清理重建
cd android
./gradlew clean
npx cap sync android
```

### 3. 应用显示白屏

检查 `capacitor.config.ts` 中的 `webDir` 是否正确指向构建输出目录。

## 发布到应用商店

1. 修改版本号：`android/app/build.gradle` 中的 `versionCode` 和 `versionName`
2. 生成签名密钥：
   ```bash
   keytool -genkey -v -keystore gitdaily.keystore -alias gitdaily -keyalg RSA -keysize 2048 -validity 10000
   ```
3. 在 Android Studio 中选择 Build -> Generate Signed Bundle/APK
