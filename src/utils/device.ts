/**
 * 设备检测工具
 * 自动检测设备类型（桌面浏览器、移动端浏览器、Capacitor App）
 */

import { Capacitor } from '@capacitor/core';

export type DeviceType = 'desktop' | 'mobile';

/**
 * 获取当前设备类型
 * - Capacitor原生应用（iOS/Android）→ 'mobile'
 * - 浏览器环境：根据屏幕宽度判断（>=768为desktop，否则为mobile）
 */
export function getDeviceType(): DeviceType {
  // 检测Capacitor原生应用
  if (Capacitor.isNativePlatform()) {
    // Capacitor App统一视为移动端
    return 'mobile';
  }

  // 浏览器环境通过屏幕宽度判断
  // 768px是Tailwind的md断点
  return window.innerWidth >= 768 ? 'desktop' : 'mobile';
}

/**
 * 检测是否在Capacitor原生应用中运行
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * 获取详细的平台信息
 * 用于调试和显示
 */
export function getPlatformInfo(): {
  deviceType: DeviceType;
  isNative: boolean;
  platform: string;
  screenWidth: number;
} {
  return {
    deviceType: getDeviceType(),
    isNative: isNativeApp(),
    platform: Capacitor.getPlatform(),
    screenWidth: window.innerWidth,
  };
}
