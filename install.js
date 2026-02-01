#!/usr/bin/env node
/**
 * Claude Code 扩展增强 - 一键安装脚本
 *
 * 用法:
 *   Linux/WSL:  node install.js
 *   Windows:    node install.js
 *
 * 新电脑部署:
 *   1. 将整个项目文件夹复制到新电脑
 *   2. 运行: node install.js
 *   3. 重载 VSCode
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// 查找 Claude 扩展目录
function findClaudeExtensions() {
  const platform = os.platform();
  const extensions = [];

  if (platform === 'win32') {
    // Windows

    // 尝试从用户目录查找
    try {
      const userProfile = process.env.USERPROFILE || process.env.HOME;
      if (userProfile && fs.existsSync(userProfile)) {
        const extDir = path.join(userProfile, '.vscode', 'extensions');
        if (fs.existsSync(extDir)) {
          const dirs = fs.readdirSync(extDir)
            .filter(d => d.startsWith('anthropic.claude-code-'))
            .map(d => path.join(extDir, d));
          extensions.push(...dirs);
        }
      }
    } catch (e) {}

    // WSL 访问 Windows 路径 (自动检测用户目录)
    try {
      const userProfile = process.env.USERPROFILE || process.env.HOME;
      if (userProfile) {
        // Windows路径转WSL路径: C:\Users\XXX -> /mnt/c/Users/XXX
        let wslPath = userProfile.replace(/^([A-Z]):\\/i, '/mnt/$1/').replace(/\\/g, '/');
        wslPath = path.join(wslPath, '.vscode', 'extensions');

        if (fs.existsSync(wslPath)) {
          const dirs = fs.readdirSync(wslPath)
            .filter(d => d.startsWith('anthropic.claude-code-') && d.includes('win32'))
            .map(d => path.join(wslPath, d));
          extensions.push(...dirs);
        }
      }
    } catch (e) {}
  } else {
    // Linux/WSL
    const vscodeServerPaths = [
      path.join(os.homedir(), '.vscode-server', 'extensions'),
      path.join(os.homedir(), '.vscode-remote', 'extensions'),
    ];

    for (const basePath of vscodeServerPaths) {
      if (fs.existsSync(basePath)) {
        const dirs = fs.readdirSync(basePath)
          .filter(d => d.startsWith('anthropic.claude-code-') && d.includes('linux'))
          .map(d => path.join(basePath, d));
        extensions.push(...dirs);
      }
    }
  }

  return extensions;
}

// 复制文件
function copyFile(src, dest) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  } catch (e) {
    return false;
  }
}

// 应用补丁
function applyPatch(extDir) {
  const patchScript = path.join(extDir, 'patch_extension.js');
  const extensionJs = path.join(extDir, 'extension.js');

  if (!fs.existsSync(patchScript)) {
    return { success: false, message: 'patch_extension.js not found' };
  }

  if (!fs.existsSync(extensionJs)) {
    return { success: false, message: 'extension.js not found' };
  }

  // 检查是否已经打过补丁
  let content = fs.readFileSync(extensionJs, 'utf8');
  if (content.includes('enhance.js')) {
    return { success: true, message: 'Already patched' };
  }

  try {
    // 直接执行补丁逻辑
    const styleSrcPattern = "u=`style-src \\$\\{e.cspSource\\} 'unsafe-inline'`";
    const styleSrcReplace = "u=`style-src ${e.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com`";

    content = content.replace(
      new RegExp(styleSrcPattern.replace(/\$/g, '\\$'), 'g'),
      styleSrcReplace
    );

    const scriptSrcPattern = "script-src 'nonce-\\$\\{l\\}'";
    const scriptSrcReplace = "script-src 'nonce-${l}' https://cdnjs.cloudflare.com";

    content = content.replace(
      new RegExp(scriptSrcPattern.replace(/\$/g, '\\$'), 'g'),
      scriptSrcReplace
    );

    content = content.replace(
      /script-src 'nonce-\$\{l\}' https:\/\/cdnjs\.cloudflare\.com/g,
      "script-src 'nonce-${l}' https://cdnjs.cloudflare.com; font-src https://cdnjs.cloudflare.com 'self' data:"
    );

    if (!content.includes('font-src')) {
      content = content.replace(
        /script-src 'nonce-\$\{l\}'/g,
        "script-src 'nonce-${l}'; font-src https://cdnjs.cloudflare.com 'self' data:"
      );
    }

    if (!content.includes('enhance.js')) {
      const scriptPattern = 'src="${s}" type="module"></script>';
      const scriptReplace = 'src="${s}" type="module"></script><script nonce="${l}" src="${e.asWebviewUri(wt.Uri.joinPath(this.extensionUri,"webview","enhance.js"))}"></script>';

      content = content.replace(
        new RegExp(scriptPattern.replace(/\$/g, '\\$'), 'g'),
        scriptReplace
      );
    }

    fs.writeFileSync(extensionJs, content, 'utf8');
    return { success: true, message: 'Patched successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// 主函数
function main() {
  log('\n========================================', 'blue');
  log('  Claude Code 扩展增强 - 一键安装', 'blue');
  log('========================================\n', 'blue');

  const scriptDir = __dirname;
  const enhanceJs = path.join(scriptDir, 'webview', 'enhance.js');
  const patchScript = path.join(scriptDir, 'patch_extension.js');

  // 检查源文件
  if (!fs.existsSync(enhanceJs)) {
    log('错误: enhance.js 不存在!', 'red');
    process.exit(1);
  }

  log('步骤 1/4: 查找 Claude 扩展目录...', 'yellow');
  const extDirs = findClaudeExtensions();

  if (extDirs.length === 0) {
    log('错误: 未找到 Claude 扩展目录!', 'red');
    log('请确保已安装 Claude Code VSCode 扩展', 'yellow');
    process.exit(1);
  }

  log(`找到 ${extDirs.length} 个扩展目录:\n`, 'green');
  extDirs.forEach((dir, i) => {
    log(`  [${i + 1}] ${dir}`, 'blue');
  });
  console.log();

  let successCount = 0;

  for (const extDir of extDirs) {
    const extName = path.basename(extDir);
    log(`\n处理: ${extName}`, 'yellow');

    // 复制 enhance.js
    log('  - 复制 enhance.js...', 'blue');
    const targetEnhance = path.join(extDir, 'webview', 'enhance.js');
    if (copyFile(enhanceJs, targetEnhance)) {
      log('    ✓ enhance.js 已复制', 'green');
    } else {
      log('    ✗ 复制失败', 'red');
      continue;
    }

    // 复制 patch_extension.js (如果目标没有)
    const targetPatch = path.join(extDir, 'patch_extension.js');
    if (!fs.existsSync(targetPatch)) {
      copyFile(patchScript, targetPatch);
    }

    // 应用补丁
    log('  - 应用补丁...', 'blue');
    const result = applyPatch(extDir);
    if (result.success) {
      log(`    ✓ ${result.message}`, 'green');
      successCount++;
    } else {
      log(`    ✗ ${result.message}`, 'red');
    }
  }

  console.log();
  log('========================================', 'blue');
  log(`安装完成! 成功: ${successCount}/${extDirs.length}`, 'green');
  log('========================================\n', 'blue');

  log('下一步:', 'yellow');
  log('  1. 在 VSCode 中按 Ctrl+Shift+P', 'blue');
  log('  2. 输入 "Reload Window" 并回车', 'blue');
  log('  3. 重新打开 Claude 侧边栏\n', 'blue');

  log('功能列表:', 'yellow');
  log('  ✓ 代码语法高亮 (Highlight.js)', 'green');
  log('  ✓ LaTeX 公式渲染 (KaTeX)', 'green');
  log('  ✓ 代码块语言标识符', 'green');
  log('  ✓ Ctrl+滚轮缩放界面', 'green');
  log('  ✓ 表格暗色主题', 'green');
  console.log();
}

main();
