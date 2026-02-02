/**
 * 数据库迁移命令行工具
 *
 * 用法:
 *   npm run db:migrate           # 执行所有待定迁移
 *   npm run db:migrate -- --info # 查看当前状态
 *   npm run db:migrate -- --v1.1.0  # 升级到指定版本
 */

import { DatabaseManager } from './database';
import path from 'path';

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--info')) {
    const db = await DatabaseManager.init();
    const info = db.getInfo();
    console.log('========== Database Status ==========');
    console.log(`Current Version: ${info.version}`);
    console.log(`Database Path:   ${path.resolve(info.path)}`);
    console.log(`Database Size:   ${(info.size / 1024).toFixed(2)} KB`);
    console.log(`Branches:        ${info.branch_count}`);
    console.log(`Tasks:           ${info.task_count}`);
    console.log('=====================================');
    db.close();
  } else if (args[0] === '--') {
    const targetVersion = args[1];
    const db = await DatabaseManager.init();
    console.log(`Upgrading to ${targetVersion}...`);
    const result = await db.upgrade(targetVersion as any);
    console.log(result);
    db.close();
  } else {
    const db = await DatabaseManager.init();
    const result = await db.upgrade();
    console.log('Upgrade result:', result);
    db.close();
  }
}

main().catch(console.error);
