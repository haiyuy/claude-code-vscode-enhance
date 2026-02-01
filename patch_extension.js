#!/usr/bin/env node
/**
 * Claude Code 扩展补丁脚本 v3
 * 1. 修改 CSP 策略允许外部 CDN (style-src, script-src, font-src)
 * 2. 注入 enhance.js
 */

const fs = require('fs');
const path = require('path');

const extDir = __dirname;
const extensionJs = path.join(extDir, 'extension.js');

console.log('[Claude Code Patch] Applying v3...');

// 读取文件
let content = fs.readFileSync(extensionJs, 'utf8');

// 检查是否需要更新 (检查CDN是否已添加)
if (content.includes('cdnjs.cloudflare.com')) {
  console.log('[Claude Code Patch] Already patched with CDN!');
  process.exit(0);
}

// 修改 1: 添加 https://cdnjs.cloudflare.com 到 style-src
const styleSrcPattern = "u=`style-src $\{e.cspSource} 'unsafe-inline'`";
const styleSrcReplace = "u=`style-src ${e.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com`";

content = content.replace(
  new RegExp(styleSrcPattern.replace(/\$/g, '\\$'), 'g'),
  styleSrcReplace
);

// 修改 2: 添加 https://cdnjs.cloudflare.com 到 script-src
const scriptSrcPattern = "script-src 'nonce-$\{l}'";
const scriptSrcReplace = "script-src 'nonce-${l}' https://cdnjs.cloudflare.com";

content = content.replace(
  new RegExp(scriptSrcPattern.replace(/\$/g, '\\$'), 'g'),
  scriptSrcReplace
);

// 修改 3: 添加 font-src 允许 KaTeX 字体
// 在 script-src 后面添加 font-src
content = content.replace(
  /script-src 'nonce-\$\{l\}' https:\/\/cdnjs\.cloudflare\.com/g,
  "script-src 'nonce-${l}' https://cdnjs.cloudflare.com; font-src https://cdnjs.cloudflare.com 'self' data:"
);

// 如果上面没匹配到，尝试另一种模式
if (!content.includes('font-src')) {
  content = content.replace(
    /script-src 'nonce-\$\{l\}'/g,
    "script-src 'nonce-${l}'; font-src https://cdnjs.cloudflare.com 'self' data:"
  );
}

// 修改 4: 注入 enhance.js (如果还没有)
if (!content.includes('enhance.js')) {
  const scriptPattern = 'src="${s}" type="module"></script>';
  const scriptReplace = 'src="${s}" type="module"></script><script nonce="${l}" src="${e.asWebviewUri(wt.Uri.joinPath(this.extensionUri,"webview","enhance.js"))}"></script>';

  content = content.replace(
    new RegExp(scriptPattern.replace(/\$/g, '\\$'), 'g'),
    scriptReplace
  );
}

// 写回文件
fs.writeFileSync(extensionJs, content, 'utf8');
console.log('[Claude Code Patch] Done!');
console.log('[Claude Code Patch] CSP updated to allow cdnjs.cloudflare.com (style, script, font)');
console.log('[Claude Code Patch] Please reload VSCode window.');
