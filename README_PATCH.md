# Claude Code 扩展增强补丁

## 概述

此补丁为 Claude Code VSCode 扩展注入自定义功能, 实现代码高亮、LaTeX 公式渲染、UI 样式优化和滚轮缩放。

## 项目结构

```
anthropic.claude-code-2.1.29-linux-x64/
├── patch_extension.js      # 补丁脚本 (运行此文件应用补丁)
├── sync.js                 # 同步脚本 (同步到 Windows)
├── extension.js            # 扩展主文件 (被修改)
├── extension.js.bak*       # 原始备份
└── webview/
    └── enhance.js          # 注入的增强脚本 (核心功能)
```

## 功能特性

### 1. 代码语法高亮
- 使用 Highlight.js 11.9.0
- 主题: VS2015 (暗色)
- **代码块右上角显示语言标识符**

### 2. LaTeX 公式渲染
- 使用 KaTeX 0.16.9
- 支持 `$...$` 行内公式
- 支持 `$$...$$` 块级公式

### 3. UI 样式增强
- 表格暗色主题样式
- 列表样式优化 (修复数字被截断问题)
- 自定义字体 (JetBrains Mono + 霞鹜文楷)

### 4. 滚轮缩放
- `Ctrl + 滚轮` 缩放整个界面
- 缩放范围: 50% ~ 200%
- 自动保存缩放比例

## 安装步骤

### WSL (Linux)

```bash
cd ~/.vscode-server/extensions/anthropic.claude-code-2.1.29-linux-x64/
node patch_extension.js
```

### Windows

```powershell
cd "C:\Users\Sophomores\.vscode\extensions\anthropic.claude-code-2.1.29-win32-x64"
node patch_extension.js
```

然后重载 VSCode 窗口: `Ctrl+Shift+P` → "Reload Window"

## 同步到 Windows

修改 `enhance.js` 后, 运行同步脚本:

```bash
cd ~/.vscode-server/extensions/anthropic.claude-code-2.1.29-linux-x64/
node sync.js
```

会自动复制到 Windows 扩展目录, 然后在 Windows 下重新运行 `patch_extension.js`。

## 技术实现

### 依赖资源

| 库 | 版本 | 用途 |
|----|------|------|
| Highlight.js | 11.9.0 | 代码语法高亮 |
| KaTeX | 0.16.9 | LaTeX 公式渲染 |
| cdnjs.cloudflare.com | - | CDN 资源托管 |

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v9 | 2025-02-01 | 添加代码块语言标识符、滚轮缩放功能、同步脚本 |
| v8 | 2025-02-01 | 修复有序列表数字截断 |
| v3 | 2025-01-XX | 添加 font-src 支持 |

## 故障排查

### 补丁未生效

```bash
grep "enhance.js" ~/.vscode-server/extensions/anthropic.claude-code-2.1.29-linux-x64/extension.js
```

### 公式未渲染

打开控制台查看日志:
```
[Claude Enhance] Loading...
[Claude Enhance] Highlight.js loaded
[Claude Enhance] KaTeX + auto-render loaded
```

## 维护建议

1. **扩展更新后**: 重新运行 `patch_extension.js`
2. **修改 enhance.js 后**: 运行 `sync.js` 同步到 Windows
