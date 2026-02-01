# Claude Code 扩展增强 - 新电脑部署指南

## 快速部署

### 方法 1: 复制整个文件夹

1. 将当前整个文件夹复制到新电脑
2. 在新电脑上运行:

```bash
# Linux/WSL
cd /path/to/anthropic.claude-code-*/
node install.js

# Windows (PowerShell)
cd "E:\path\to\anthropic.claude-code-*"
node install.js
```

3. 重载 VSCode

### 方法 2: 仅复制必要文件

如果只想复制核心文件, 最少需要:

```
anthropic.claude-code-*/
├── install.js           # 一键安装脚本
└── webview/
    └── enhance.js       # 增强脚本
```

## 验证安装

打开 VSCode 控制台 (`Ctrl+Shift+I`), 应该看到:

```
[Claude Enhance] Loading...
[Claude Enhance] Initializing...
[Claude Enhance] Highlight.js loaded
[Claude Enhance] KaTeX + auto-render loaded
```

## 功能列表

| 功能 | 说明 |
|------|------|
| 代码高亮 | 自动识别语法并高亮 |
| 语言标签 | 代码块右上角显示语言 |
| LaTeX | 支持 `$...$` 和 `$$...$$` |
| 滚轮缩放 | `Ctrl + 滚轮` 缩放 |
| 表格样式 | 暗色主题表格 |

## 问题排查

**安装后没效果?**
- 确认已重载 VSCode 窗口
- 检查控制台是否有错误

**找不到扩展目录?**
- 确保先安装 Claude Code VSCode 扩展
- 至少打开一次扩展让目录生成
