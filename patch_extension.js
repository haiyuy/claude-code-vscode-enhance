#!/usr/bin/env node
/**
 * Claude Code 扩展补丁脚本 v7 (增强版)
 * 适配 VSCode 本地安装 + Remote/WSL (vscode-server) 安装
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function printHelp() {
  // 保持输出简短，避免刷屏
  console.log(`
Usage:
  node patch_extension.js [options]

Options:
  --extension-dir <dir>   Patch a specific extension directory
  --base <dir>            Add a base extensions directory to search (repeatable)
  --all                   Patch all found Claude Code installs (all versions)
  --dry-run               Print what would change, but do not write files
  --list                  List detected installs and exit
  -h, --help              Show this help
`.trim());
}

function parseArgs(argv) {
  const opts = {
    extensionDir: null,
    bases: [],
    all: false,
    dryRun: false,
    list: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--extension-dir' || arg === '--ext-dir') {
      opts.extensionDir = argv[++i];
      continue;
    }
    if (arg === '--base') {
      opts.bases.push(argv[++i]);
      continue;
    }
    if (arg === '--all') {
      opts.all = true;
      continue;
    }
    if (arg === '--dry-run') {
      opts.dryRun = true;
      continue;
    }
    if (arg === '--list') {
      opts.list = true;
      continue;
    }
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }

    console.error('[Patch] Unknown arg:', arg);
    printHelp();
    process.exit(1);
  }

  return opts;
}

function getHomeDir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir();
}

function getDefaultBases(home) {
  return [
    path.join(home, '.vscode', 'extensions'),
    path.join(home, '.vscode-insiders', 'extensions'),
    // VSCode Remote / WSL / SSH
    path.join(home, '.vscode-server', 'extensions'),
    path.join(home, '.vscode-server-insiders', 'extensions'),
    // VSCodium / OSS builds
    path.join(home, '.vscode-server-oss', 'extensions'),
  ];
}

function listExtensionDirs(baseDir) {
  if (!baseDir || !fs.existsSync(baseDir)) return [];
  try {
    return fs
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('anthropic.claude-code-'))
      .map((d) => path.join(baseDir, d.name));
  } catch {
    return [];
  }
}

function parseVersionFromDirName(dirName) {
  const prefix = 'anthropic.claude-code-';
  if (!dirName.startsWith(prefix)) return null;
  const rest = dirName.slice(prefix.length);
  const versionPart = rest.split('-')[0];
  const parts = versionPart.split('.').map((x) => Number(x));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  return parts;
}

function compareVersions(a, b) {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function pickLatestByVersion(dirs) {
  const scored = dirs
    .map((dir) => {
      const base = path.basename(dir);
      const version = parseVersionFromDirName(base);
      return { dir, base, version };
    })
    .filter((x) => x.version);

  if (scored.length === 0) {
    // 回退：按目录名排序
    return dirs.sort().pop() || null;
  }

  scored.sort((a, b) => compareVersions(a.version, b.version));
  return scored[scored.length - 1].dir;
}

function detectWebviewVar(content) {
  const m1 = content.match(/style-src \$\{(\w+)\.cspSource\}/);
  if (m1) return m1[1];
  const m2 = content.match(/font-src \$\{(\w+)\.cspSource\}/);
  if (m2) return m2[1];
  return null;
}

function detectVscodeVar(content) {
  const m = content.match(/(\w+)\.Uri\.joinPath\(this\.extensionUri,\s*["']webview["']/);
  if (m) return m[1];
  return null;
}

function patchOneExtension(extDir, opts) {
  const extensionJs = path.join(extDir, 'extension.js');
  const enhanceJs = path.join(__dirname, 'webview', 'enhance.js');
  const targetEnhance = path.join(extDir, 'webview', 'enhance.js');

  if (!fs.existsSync(extensionJs)) {
    console.warn('[Patch] Skipped (extension.js not found):', extDir);
    return false;
  }
  if (!fs.existsSync(path.dirname(targetEnhance))) {
    console.warn('[Patch] Skipped (webview dir not found):', extDir);
    return false;
  }

  console.log('[Patch] Extension dir:', extDir);

  let enhanceUpdated = false;
  try {
    const srcBuf = fs.readFileSync(enhanceJs);
    const dstBuf = fs.existsSync(targetEnhance) ? fs.readFileSync(targetEnhance) : null;
    enhanceUpdated = !dstBuf || !srcBuf.equals(dstBuf);
    if (enhanceUpdated) {
      if (!opts.dryRun) fs.copyFileSync(enhanceJs, targetEnhance);
      console.log(`[Patch] ${opts.dryRun ? 'Would copy' : 'Copied'} enhance.js`);
    } else {
      console.log('[Patch] enhance.js: already up to date');
    }
  } catch (e) {
    console.warn('[Patch] Failed to check/copy enhance.js:', e?.message || e);
  }

  const original = fs.readFileSync(extensionJs, 'utf8');
  let content = original;

  const webviewVar = detectWebviewVar(content);
  const vscodeVar = detectVscodeVar(content);

  // ========== 修改 1: style-src 添加 CDN ==========
  if (!/style-src[^`]*cdnjs\.cloudflare\.com/.test(content)) {
    const stylePattern = /(\w+)=`style-src \$\{(\w+)\.cspSource\} 'unsafe-inline'`/;
    const styleMatch = content.match(stylePattern);
    if (styleMatch) {
      const [full, varName, objName] = styleMatch;
      const replacement = `${varName}=\`style-src \${${objName}.cspSource} 'unsafe-inline' https://cdnjs.cloudflare.com\``;
      content = content.replace(full, replacement);
      console.log('[Patch] Updated style-src CSP');
    } else {
      console.warn('[Patch] style-src pattern not found');
    }
  } else {
    console.log('[Patch] style-src: already patched');
  }

  // ========== 修改 2: script-src 添加 CDN ==========
  if (!content.match(/script-src 'nonce-\$\{[^}]+\}' https:\/\/cdnjs/)) {
    const next = content.replace(
      /script-src 'nonce-\$\{(\w+)\}'/g,
      "script-src 'nonce-${$1}' https://cdnjs.cloudflare.com"
    );
    if (next !== content) {
      content = next;
      console.log('[Patch] Updated script-src CSP');
    } else {
      console.warn('[Patch] script-src pattern not found');
    }
  } else {
    console.log('[Patch] script-src: already patched');
  }

  // ========== 修改 3: font-src 添加 CDN + data: ==========
  if (!/font-src[^`]*cdnjs\.cloudflare\.com/.test(content)) {
    const fontPattern = /(\w+)=`font-src \$\{(\w+)\.cspSource\}`/;
    const fontMatch = content.match(fontPattern);
    if (fontMatch) {
      const [full, varName, objName] = fontMatch;
      const replacement = `${varName}=\`font-src \${${objName}.cspSource} https://cdnjs.cloudflare.com data:\``;
      content = content.replace(full, replacement);
      console.log('[Patch] Updated font-src CSP');
    } else {
      console.warn('[Patch] font-src pattern not found');
    }
  } else {
    console.log('[Patch] font-src: already patched');
  }

  // ========== 修改 4: 注入 enhance.js ==========
  if (!content.includes('webview","enhance.js') && !content.includes("webview','enhance.js") && !content.includes('enhance.js')) {
    const scriptMatch = content.match(/<script nonce="\$\{(\w+)\}" src="\$\{(\w+)\}" type="module"><\/script>/);
    if (!scriptMatch) {
      console.warn('[Patch] Could not find module script tag to inject enhance.js');
    } else if (!webviewVar || !vscodeVar) {
      console.warn('[Patch] Could not detect webview/vscode variable names; skipping injection');
    } else {
      const [full, nonceVar, srcVar] = scriptMatch;
      const nonceExpr = '${' + nonceVar + '}';
      const srcExpr = '${' + srcVar + '}';
      const enhanceExpr =
        '${' +
        webviewVar +
        '.asWebviewUri(' +
        vscodeVar +
        '.Uri.joinPath(this.extensionUri,"webview","enhance.js"))}';
      const replacement =
        `<script nonce="${nonceExpr}" src="${srcExpr}" type="module"></script>` +
        `<script nonce="${nonceExpr}" src="${enhanceExpr}"></script>`;
      content = content.replace(full, replacement);
      console.log('[Patch] Injected enhance.js');
    }
  } else {
    console.log('[Patch] enhance.js: already injected');
  }

  // 修改 5: 修复 diff 视图铺满窗口问题 - 在侧边栏打开 (旧补丁逻辑，尽量保持兼容)
  content = content.replace(
    /let v=\{preview:!1\}/g,
    'let v={preview:!1,viewColumn:tr.ViewColumn.Beside}'
  );
  content = content.replace(
    /let N=\{preview:!1,preserveFocus:!0\}/g,
    'let N={preview:!1,preserveFocus:!0,viewColumn:Gt.ViewColumn.Beside}'
  );

  const extensionChanged = content !== original;
  if (extensionChanged && !opts.dryRun) {
    fs.writeFileSync(extensionJs, content, 'utf8');
  }

  const changed = extensionChanged || enhanceUpdated;
  if (changed) {
    console.log(`[Patch] Done${opts.dryRun ? ' (dry-run)' : ''}! Please reload VSCode window.`);
  } else {
    console.log('[Patch] No changes needed.');
  }

  return changed;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const home = getHomeDir();

  const enhanceJs = path.join(__dirname, 'webview', 'enhance.js');
  if (!fs.existsSync(enhanceJs)) {
    console.error('[Patch] Missing webview/enhance.js in this repo');
    process.exit(1);
  }

  let targets = [];

  if (opts.extensionDir) {
    targets = [path.resolve(opts.extensionDir)];
  } else {
    const bases = opts.bases.length > 0 ? opts.bases : getDefaultBases(home);
    const existingBases = bases.map((b) => path.resolve(b)).filter((b) => fs.existsSync(b));

    if (existingBases.length === 0) {
      console.error('[Patch] VSCode extensions directories not found under:', home);
      console.error('[Patch] Try specifying --base or --extension-dir');
      process.exit(1);
    }

    const allDirs = existingBases.flatMap((b) => listExtensionDirs(b));
    if (allDirs.length === 0) {
      console.error('[Patch] Claude Code extension not found in:');
      existingBases.forEach((b) => console.error('  -', b));
      process.exit(1);
    }

    if (opts.list) {
      console.log('[Patch] Found installs:');
      allDirs
        .slice()
        .sort()
        .forEach((d) => console.log('  -', d));
      process.exit(0);
    }

    if (opts.all) {
      targets = allDirs;
    } else {
      // 默认：每个 base 目录只补丁最新版本，避免补丁一堆旧版本残留
      const byBase = new Map();
      for (const dir of allDirs) {
        const base = path.dirname(dir);
        const arr = byBase.get(base) || [];
        arr.push(dir);
        byBase.set(base, arr);
      }
      targets = [...byBase.values()].map((dirs) => pickLatestByVersion(dirs)).filter(Boolean);
    }
  }

  // 去重 & 稳定排序
  targets = [...new Set(targets)].sort();

  if (opts.list) {
    console.log('[Patch] Targets:');
    targets.forEach((d) => console.log('  -', d));
    process.exit(0);
  }

  console.log('[Patch] Applying patch v7...');
  let patchedCount = 0;
  for (const dir of targets) {
    if (patchOneExtension(dir, opts)) patchedCount++;
  }

  if (patchedCount === 0) {
    console.log('[Patch] No changes made.');
  }
}

main();
