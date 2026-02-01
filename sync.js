#!/usr/bin/env node
/**
 * Claude Code 增强脚本同步工具
 * 自动同步 enhance.js 到 Windows 扩展目录
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const extDir = __dirname;
const enhanceJs = path.join(extDir, 'webview', 'enhance.js');
const windowsExtPath = '/mnt/c/Users/Sophomores/.vscode/extensions';

console.log('[Claude Sync] Starting...');

// 检查 enhance.js 是否存在
if (!fs.existsSync(enhanceJs)) {
  console.error('[Claude Sync] enhance.js not found!');
  process.exit(1);
}

// 查找 Windows 扩展目录
function findWindowsExtDir() {
  try {
    const dirs = fs.readdirSync(windowsExtPath)
      .filter(d => d.startsWith('anthropic.claude-code-') && d.includes('win32'));
    return dirs.map(d => path.join(windowsExtPath, d));
  } catch (e) {
    return [];
  }
}

const windowsDirs = findWindowsExtDir();

if (windowsDirs.length === 0) {
  console.log('[Claude Sync] No Windows extension directories found.');
  console.log('[Claude Sync] Make sure you access VSCode from WSL first.');
  process.exit(0);
}

// 同步文件
let synced = 0;
windowsDirs.forEach(dir => {
  const targetDir = path.join(dir, 'webview');
  const targetFile = path.join(targetDir, 'enhance.js');

  try {
    // 确保目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 复制文件
    fs.copyFileSync(enhanceJs, targetFile);
    console.log(`[Claude Sync] Synced to: ${dir}`);
    synced++;
  } catch (e) {
    console.error(`[Claude Sync] Failed to sync to ${dir}: ${e.message}`);
  }
});

console.log(`[Claude Sync] Done! Synced to ${synced} location(s).`);
console.log('[Claude Sync] Remember to run patch_extension.js on Windows.');
