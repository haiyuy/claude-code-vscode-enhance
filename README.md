# VSCode Claude Code 扩展增强

为 VSCode Claude Code 扩展添加代码高亮、LaTeX 公式渲染、UI 优化等功能。

## 功能

- **代码语法高亮** - 使用 Highlight.js, 支持 180+ 种语言
- **LaTeX 公式渲染** - 使用 KaTeX, 支持数学公式显示
- **表格暗色主题** - 优化表格样式
- **代码自动换行** - 修复长命令行显示问题
- **滚轮缩放** - Ctrl+滚轮缩放界面 (50%-200%)
- **列表样式修复** - 修复有序列表数字被截断

## 快速安装

### Windows

```powershell
cd "C:\Users\你的用户名\claude-code-enhance"
node install.js
```

### WSL/Linux

```bash
cd ~/claude-code-enhance
node install.js
```

然后重载 VSCode: `Ctrl+Shift+P` → "Reload Window"

## LaTeX 语法支持

| 语法 | 类型 | 示例 |
|------|------|------|
| `$$...$$` | 块级公式 | `$$\sum_{i=1}^n i$$` |
| `\(...\)` | 行内公式 | `\(x^2 + y^2 = z^2\)` |
| `\[...\]` | 块级公式 | `\[\int_0^1 x dx\]` |

## 文件说明

```
claude-code-enhance/
├── install.js          # 一键安装脚本
├── patch_extension.js  # 补丁脚本 (修改 extension.js)
├── sync.js             # 同步脚本 (WSL ↔ Windows)
├── INSTALL.md          # 详细安装说明
└── webview/
    └── enhance.js      # 增强脚本 (核心功能)
```

## 扩展更新后

扩展更新会重置补丁, 重新运行 `node install.js` 即可。

## 依赖

- [Highlight.js](https://highlightjs.org/) 11.9.0
- [KaTeX](https://katex.org/) 0.16.9

## License

MIT
