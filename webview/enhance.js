/**
 * Claude Code UI 增强脚本 v8
 * 功能: 代码高亮、LaTeX渲染
 */

(function() {
  'use strict';

  console.log('[Claude Enhance] Loading...');

  // 等待 React 完成渲染
  function waitForElement(selector, callback, timeout = 10000) {
    const startTime = Date.now();
    const check = () => {
      const el = document.querySelector(selector);
      if (el) {
        callback(el);
      } else if (Date.now() - startTime < timeout) {
        setTimeout(check, 100);
      }
    };
    check();
  }

  // 注入样式
  function injectStyles() {
    const styleId = 'claude-enhance-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 代码块样式 */
      pre code {
        font-family: 'JetBrains Mono NL', 'LXGW WenKai GB Screen R', 'Consolas', 'Monaco', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace !important;
      }
      .hljs {
        font-family: 'JetBrains Mono NL', 'LXGW WenKai GB Screen R', 'Consolas', 'Monaco', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace !important;
      }

      /* KaTeX 样式 */
      .katex {
        font-size: 1.1em;
      }
      .katex-display {
        margin: 1em 0;
        overflow-x: auto;
      }

      /* 表格样式 - 暗色主题 */
      table {
        border-collapse: separate;
        border-spacing: 0;
        width: 100%;
        margin: 1em 0;
        font-size: 0.95em;
        color: #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
        border: 3px solid #707070;
      }
      table thead {
        background: linear-gradient(to bottom, #2d2d2d, #252525);
      }
      table th {
        padding: 10px 14px;
        text-align: left;
        font-weight: 600;
        border: 3px solid #707070;
        color: #ffffff;
      }
      table th:first-child {
        border-top-left-radius: 4px;
      }
      table th:last-child {
        border-top-right-radius: 4px;
      }
      table td {
        padding: 10px 14px;
        border: 3px solid #707070;
        border-top: none;
        border-left: none;
      }
      table td:last-child {
        border-right: none;
      }
      table tbody tr:last-child td:first-child {
        border-bottom-left-radius: 4px;
      }
      table tbody tr:last-child td:last-child {
        border-bottom-right-radius: 4px;
      }
      table tbody tr:nth-child(even) {
        background-color: rgba(255, 255, 255, 0.03);
      }
      table tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.08);
      }

      /* Bash命令行样式 - 修复长内容不换行 */
      pre {
        white-space: pre-wrap !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        max-width: 100% !important;
      }
      pre code {
        white-space: pre-wrap !important;
        word-break: break-word !important;
      }

      /* 列表样式 - 修复数字被截断 */
      ol, ul {
        margin: 0.5em 0;
        margin-left: 0 !important;
        padding-left: 3em !important;
        overflow: visible !important;
      }
      ol li, ul li {
        margin: 0.25em 0;
        margin-left: 0 !important;
        color: #e0e0e0;
        line-height: 1.6;
        overflow: visible !important;
        padding-left: 0 !important;
      }
      ol li::marker, ul li::marker {
        color: #b0b0b0;
        font-weight: 500;
      }
      /* 修复父容器可能裁切数字 */
      .markdown, .prose, [class*="message"], [class*="content"], [class*="container"] {
        overflow: visible !important;
      }
      /* 确保嵌套列表正确显示 */
      ol ol, ul ul, ol ul, ul ol {
        margin: 0.25em 0;
        margin-left: 0 !important;
      }

      /* 命令确认框样式 - 修复长命令溢出 + 字体 */
      .bi, .t {
        max-height: none !important;
        overflow: visible !important;
        font-family: 'JetBrains Mono NL', 'LXGW WenKai GB Screen R', 'Consolas', 'Monaco', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace !important;
      }
      /* 命令预览区域 - 可滚动 + 字体 */
      .Ai, .Ai.Q {
        white-space: pre-wrap !important;
        word-break: break-all !important;
        overflow-wrap: break-word !important;
        max-height: 400px !important;
        overflow-y: auto !important;
        overflow-x: auto !important;
        font-family: 'JetBrains Mono NL', 'LXGW WenKai GB Screen R', 'Consolas', 'Monaco', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace !important;
      }
      /* 确保对话框内容不溢出 + 字体 */
      .Ti {
        max-height: 500px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        font-family: 'JetBrains Mono NL', 'LXGW WenKai GB Screen R', 'Consolas', 'Monaco', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace !important;
      }
    `;
    document.head.appendChild(style);
  }

  // 注入 Highlight.js
  function injectHighlightJS() {
    if (window.hljsLoaded) return;

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
    script.onload = () => {
      console.log('[Claude Enhance] Highlight.js loaded');
      window.hljsLoaded = true;
      highlightAllCode();
    };
    document.head.appendChild(script);
  }

  // 注入 KaTeX + auto-render 扩展
  function injectKaTeX() {
    if (window.katexLoaded) return;

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    script.onload = () => {
      // 加载 auto-render 扩展
      const autoRenderScript = document.createElement('script');
      autoRenderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js';
      autoRenderScript.onload = () => {
        window.katexLoaded = true;
        console.log('[Claude Enhance] KaTeX + auto-render loaded');
      };
      document.head.appendChild(autoRenderScript);
    };
    document.head.appendChild(script);
  }

  // 高亮代码块
  function highlightAllCode() {
    if (typeof hljs === 'undefined') return;

    document.querySelectorAll('pre code').forEach((block) => {
      // 跳过 LaTeX 代码块 (LaTeX 由 KaTeX 处理)
      if (block.classList.contains('language-latex')) return;

      // 如果还没高亮，先高亮
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block);
      }
    });
  }

  // 转换 LaTeX 环境语法为 KaTeX 支持的语法
  function convertLatexEnvironments(latex) {
    // KaTeX 原生支持 pmatrix/bmatrix, 但需要确保环境名称正确
    // 不需要转换, KaTeX 直接支持 \begin{pmatrix}...\end{pmatrix}
    // 如果有问题, 保留原始语法
    return latex;
  }

  // 渲染 LaTeX - 简单可靠的文本节点处理
  function renderLaTeX() {
    if (typeof katex === 'undefined') return;

    // 防止重复处理：检查是否正在渲染
    if (window._claudeRenderingLaTeX) return;
    window._claudeRenderingLaTeX = true;

    try {
      // 查找所有文本节点
      const walker = document.createTreeWalker(
        document.getElementById('root') || document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentNode;
            if (!parent || parent.nodeType !== 1) return NodeFilter.FILTER_REJECT;
            // 跳过已渲染和特殊标签
            if (parent.classList?.contains('katex') ||
                parent.classList?.contains('katex-html') ||
                parent.closest('.katex') ||
                parent.tagName === 'SCRIPT' ||
                parent.tagName === 'STYLE' ||
                parent.tagName === 'CODE' ||
                parent.tagName === 'NOSCRIPT' ||
                parent.tagName === 'PRE' ||
                parent.tagName === 'BUTTON' ||
                parent.tagName === 'INPUT' ||
                parent.tagName === 'TEXTAREA') {
              return NodeFilter.FILTER_REJECT;
            }
            // 检查是否包含数学公式
            const text = node.textContent;
            if (text && (text.includes('$$') || text.includes('$') || text.includes('\\(') || text.includes('\\['))) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_REJECT;
          }
        }
      );

    const nodesToRender = [];
    let node;
    while (node = walker.nextNode()) {
      nodesToRender.push(node);
    }

    nodesToRender.forEach((textNode) => {
      const text = textNode.textContent;
      if (!text || !text.trim()) return;  // 跳过空白节点

      try {
        let resultHTML = text;
        let hasFormula = false;
        let formulaCount = 0;

        // 处理 $$...$$ 块级公式
        resultHTML = resultHTML.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
          formulaCount++;
          hasFormula = true;
          try {
            const converted = convertLatexEnvironments(formula.trim());
            return katex.renderToString(converted, {
              displayMode: true,
              throwOnError: false,
              strict: false,
              trust: true
            });
          } catch {
            return match;
          }
        });

        // 处理 \(...\) 行内公式 (LaTeX 标准语法)
        resultHTML = resultHTML.replace(/\\\(([\s\S]+?)\\\)/g, (match, formula) => {
          formulaCount++;
          hasFormula = true;
          try {
            return katex.renderToString(formula.trim(), {
              displayMode: false,
              throwOnError: false,
              strict: false,
              trust: true
            });
          } catch {
            return match;
          }
        });

        // 处理 \[...\] 块级公式 (LaTeX 标准语法)
        resultHTML = resultHTML.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
          formulaCount++;
          hasFormula = true;
          try {
            return katex.renderToString(formula.trim(), {
              displayMode: true,
              throwOnError: false,
              strict: false,
              trust: true
            });
          } catch {
            return match;
          }
        });

        // 处理 $...$ 行内公式 (智能匹配，避免误伤)
        // 只匹配包含 LaTeX 特征的内容: 反斜杠命令、下标上标、花括号等，或短公式
        resultHTML = resultHTML.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
          // 检查是否像 LaTeX 公式
          const content = formula.trim();
          const looksLikeLatex =
            content.length <= 2 ||         // 短公式 (单字符如 $m$ 或双字符如 $x^2$)
            content.includes('\\') ||      // 包含 LaTeX 命令
            content.includes('_') ||       // 包含下标
            content.includes('^') ||       // 包含上标
            content.includes('{') ||       // 包含花括号
            /\b(alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|phi|omega|sum|prod|int|lim|frac|sqrt|infty)\b/i.test(content); // 包含常见数学符号

          if (!looksLikeLatex) {
            return match;  // 不像 LaTeX，保持原样
          }

          formulaCount++;
          hasFormula = true;
          try {
            return katex.renderToString(content, {
              displayMode: false,
              throwOnError: false,
              strict: false,
              trust: true
            });
          } catch {
            return match;
          }
        });

        // 只有真正包含公式且内容发生变化时才替换
        if (hasFormula && formulaCount > 0 && resultHTML !== text && resultHTML.includes('katex')) {
          const span = document.createElement('span');
          span.innerHTML = resultHTML;
          textNode.parentNode.replaceChild(span, textNode);
        }
      } catch (e) {
        // 忽略错误
      }
    });
    } finally {
      window._claudeRenderingLaTeX = false;
    }
  }

  // 调试函数：查找空白元素
  window.debugWhitespace = function() {
    const root = document.getElementById('root') || document.body;
    const allElements = root.querySelectorAll('*');

    // 查找高度异常的元素
    const tallElements = Array.from(allElements).filter(el => el.offsetHeight > 2000);
    if (tallElements.length > 0) {
      console.log('[Debug] Found unusually tall elements:', tallElements.map(el => ({
        tag: el.tagName,
        class: el.className,
        height: el.offsetHeight
      })));
    }

    // 查找空元素
    const emptyElements = root.querySelectorAll('div:empty, span:empty');
    if (emptyElements.length > 100) {
      console.log('[Debug] Too many empty elements:', emptyElements.length);
    }

    // 查找总高度
    const bodyHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;
    console.log('[Debug] Body scroll height:', bodyHeight, 'Viewport:', viewportHeight);

    return {
      tallElements: tallElements.length,
      emptyElements: emptyElements.length,
      bodyHeight: bodyHeight,
      viewportHeight: viewportHeight
    };
  };

  // 主处理函数 - 带防抖
  let processTimer = null;
  let isProcessing = false;

  function process() {
    // 如果正在处理，跳过
    if (isProcessing) return;

    // 取消之前的定时器
    if (processTimer) {
      clearTimeout(processTimer);
    }

    // 延迟执行
    processTimer = setTimeout(() => {
      isProcessing = true;

      try {
        highlightAllCode();
        renderLaTeX();
      } finally {
        // 减少延迟，提高响应速度
        isProcessing = false;
      }
    }, 150);
  }

  // 监听 DOM 变化 - 优化版：避免频繁断开重连
  function setupObserver() {
    let lastProcessTime = 0;
    const PROCESS_THROTTLE = 200; // 最小处理间隔

    const observer = new MutationObserver((mutations) => {
      const now = Date.now();

      // 节流：避免过于频繁处理
      if (now - lastProcessTime < PROCESS_THROTTLE) {
        return;
      }

      // 如果正在处理，跳过
      if (isProcessing) return;

      // 检查是否有新的内容节点添加
      let hasNewContent = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const tag = node.tagName?.toLowerCase();
            // className 可能是 DOMTokenList, 需要转为字符串
            const cls = (node.className?.toString() || '');
            // 跳过我们的增强元素和已知安全节点
            if (!cls.includes('hljs') &&
                !cls.includes('katex') &&
                !cls.includes('katex-html') &&
                tag !== 'style' &&
                tag !== 'script' &&
                tag !== 'br' &&
                tag !== 'span') {
              hasNewContent = true;
              break;
            }
          }
        }
        if (hasNewContent) break;
      }

      if (hasNewContent) {
        lastProcessTime = now;
        process(); // 不再断开/重连观察器
      }
    });

    // 使用更精确的观察配置，减少触发频率
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // 滚轮缩放功能
  function setupZoom() {
    // 从 localStorage 读取缩放比例
    let zoom = parseFloat(localStorage.getItem('claude-zoom') || '1.0');
    applyZoom(zoom);

    // 监听滚轮事件
    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoom = Math.max(0.5, Math.min(2.0, zoom + delta));
        applyZoom(zoom);
        localStorage.setItem('claude-zoom', zoom.toString());
        showZoomIndicator(zoom);
      }
    }, { passive: false });
  }

  // 应用缩放
  function applyZoom(zoom) {
    // 使用 zoom 属性缩放整个页面 (更有效)
    document.body.style.zoom = zoom;
    // 备用: 也设置 transform (某些浏览器可能需要)
    document.body.style.transformOrigin = 'top left';
  }

  // 显示缩放提示
  function showZoomIndicator(zoom) {
    let indicator = document.getElementById('zoom-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'zoom-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(40, 40, 40, 0.95);
        color: #fff;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: opacity 0.3s;
      `;
      document.body.appendChild(indicator);
    }
    indicator.textContent = `缩放: ${Math.round(zoom * 100)}%`;
    indicator.style.opacity = '1';

    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 1000);
  }

  // 初始化
  function init() {
    console.log('[Claude Enhance] Initializing...');
    injectStyles();
    injectHighlightJS();
    injectKaTeX();
    setupZoom();

    waitForElement('#root', () => {
      console.log('[Claude Enhance] Root element found');
      setupObserver();
      process();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[Claude Enhance] Loaded. Run debugWhitespace() to check for issues.');

})();
