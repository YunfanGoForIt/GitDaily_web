# GitDaily 移动端构建指南

支持 Android 和 iOS 双平台。

---

## Android 构建

### 环境要求

- Node.js 18+
- Android Studio (推荐) 或 Android SDK
- JDK 17

### 快速开始

```bash
chmod +x build-android.sh
./build-android.sh
```

或手动构建：

```bash
npm run build
npx cap sync android
npx cap open android
```

在 Android Studio 中点击 **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## iOS 构建 (macOS only)

### 环境要求

- macOS (只有 Mac 能构建 iOS)
- Xcode (从 App Store 安装)
- Node.js 18+
- CocoaPods (Xcode 会自动安装)

### 快速开始

```bash
chmod +x build-ios.sh
./build-ios.sh
```

或手动构建：

```bash
npm run build
npx cap sync ios
npx cap open ios
```

### 首次运行配置

1. **配置签名** (在 Xcode 中):
   - 选择 GitDaily 项目
   - 选择 **Signing & Capabilities**
   - 选择你的 Apple ID 团队

2. **选择运行目标**:
   - 真机：连接 iPhone/iPad
   - 模拟器：选择 iOS Simulator

3. **点击运行按钮** (▶)

### iOS 发布到真机

需要 Apple Developer 账号 ($99/年) 或免费个人账号：
- 免费账号：只能安装到已注册的设备，7 天后需要重新签名
- 付费账号：可以上架 App Store

---

## 开发模式（热重载）

让 App 直接加载开发服务器，方便调试：

1. 获取电脑 IP 地址：
   ```bash
   # Linux/Mac
   ip addr show | grep "inet " | head -1
   # 或
   ifconfig | grep "inet " | head -1
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
   # Android
   npx cap sync android
   npx cap run android

   # iOS (Mac only)
   npx cap sync ios
   npx cap run ios
   ```

---

## 配置后端 API 地址

App 需要连接到后端 API。修改 `src/services/api.ts` 中的 API 基础 URL：

```typescript
// 开发环境（手机和电脑在同一 WiFi）
const API_BASE = 'http://YOUR_COMPUTER_IP:3001/api';

// 生产环境（部署到服务器）
const API_BASE = 'https://your-server.com/api';
```

---

## 项目结构

```
android/                    # Android 原生项目
├── app/src/main/
│   ├── assets/public/      # Web 静态资源
│   └── java/               # Java/Kotlin 代码
└── ...

ios/                        # iOS 原生项目 (Xcode)
├── App/
│   ├── App/                # Swift 代码
│   ├── Assets.xcassets/    # 图标和资源
│   └── public/             # Web 静态资源
└── ...
```

---

## 常见问题

### 无法连接到后端 API

- 确保手机和电脑在同一 WiFi
- 检查防火墙设置
- 确认 API 地址使用了电脑的实际 IP（不是 localhost）

### Android 构建失败

```bash
cd android
./gradlew clean
npx cap sync android
```

### iOS 构建失败

```bash
cd ios/App
pod install
npx cap sync ios
```

### 应用显示白屏

检查 `capacitor.config.ts` 中的 `webDir` 是否正确指向构建输出目录。

---

## 发布到应用商店

### Android (Google Play)

1. 修改版本号：`android/app/build.gradle`
2. 生成签名密钥：
   ```bash
   keytool -genkey -v -keystore gitdaily.keystore -alias gitdaily -keyalg RSA -keysize 2048 -validity 10000
   ```
3. 在 Android Studio 中：**Build → Generate Signed Bundle/APK**

### iOS (App Store)

1. 修改版本号：`ios/App/App.xcodeproj/project.pbxproj`
2. 在 Xcode 中：**Product → Archive**
3. 使用 **Transporter** 或 Xcode 上传到 App Store Connect

---

## 常用命令

| 命令 | 说明 |
|-----|------|
| `npm run build` | 构建前端 |
| `npx cap sync` | 同步到所有平台 |
| `npx cap sync android` | 同步到 Android |
| `npx cap sync ios` | 同步到 iOS |
| `npx cap open android` | 打开 Android Studio |
| `npx cap open ios` | 打开 Xcode |
| `npx cap run android` | 直接运行到 Android 设备 |
| `npx cap run ios` | 直接运行到 iOS 设备/模拟器 |
