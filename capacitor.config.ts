import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gitdaily.app',
  appName: 'GitDaily',
  webDir: 'dist',
  server: {
    // 开发时使用本地服务器，生产时注释掉这行
    // url: 'http://YOUR_COMPUTER_IP:3000',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
