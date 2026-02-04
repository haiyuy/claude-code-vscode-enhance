/**
 * Claude Code UI 增强脚本 v9
 * 功能: 滚轮缩放, 字体, 表格, LaTeX, 换行, 代码高亮
 */

(function() {
  'use strict';

  console.log('[Claude Enhance] Loading...');

  // 注入样式
  function injectStyles() {
    const styleId = 'claude-enhance-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 代码块字体 */
      pre code, .hljs {
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

      /* 列表样式 - 修复数字被截断 */
      ol, ul {
        padding-left: 2em !important;
        list-style-position: outside !important;
      }
      ol {
        list-style-type: decimal !important;
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

      /* 代码块换行 */
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

  // 注入 KaTeX
  function injectKaTeX() {
    if (window.katexLoaded) return;

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    script.onload = () => {
      // 等待 katex 挂载到 window
      const checkKatex = () => {
        if (typeof katex !== 'undefined') {
          window.katexLoaded = true;
          console.log('[Claude Enhance] KaTeX ready:', typeof katex);
        } else {
          console.log('[Claude Enhance] KaTeX not on window, retrying...');
          setTimeout(checkKatex, 100);
        }
      };
      checkKatex();
    };
    script.onerror = (e) => {
      console.error('[Claude Enhance] KaTeX load error:', e);
    };
    document.head.appendChild(script);
  }

  // 高亮代码块
  function highlightAllCode() {
    if (typeof hljs === 'undefined') return;

    document.querySelectorAll('pre code').forEach((block) => {
      if (block.classList.contains('language-latex')) return;
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block);
      }
    });
  }

  // 渲染 LaTeX
  function renderLaTeX() {
    if (typeof katex === 'undefined') return;
    if (window._claudeRenderingLaTeX) return;
    window._claudeRenderingLaTeX = true;

    try {
      const walker = document.createTreeWalker(
        document.getElementById('root') || document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentNode;
            if (!parent || parent.nodeType !== 1) return NodeFilter.FILTER_REJECT;
            // 跳过已渲染的 KaTeX, 特殊标签, 和 session 列表
            if (parent.classList?.contains('katex') ||
                parent.closest('.katex') ||
                parent.closest('[class*="sessionsList"]') ||
                parent.closest('[class*="sessionItem"]') ||
                parent.closest('[class*="sessionName"]') ||
                ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'BUTTON', 'INPUT', 'TEXTAREA'].includes(parent.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
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
        if (!text || !text.trim()) return;

        try {
          let resultHTML = text;
          let hasFormula = false;

          // $$...$$ 块级公式 (保留换行, 矩阵需要)
          resultHTML = resultHTML.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
            hasFormula = true;
            try {
              // 修复矩阵换行: 单反斜杠+空格/换行 → 双反斜杠
              let fixed = formula.replace(/\\\s*\n/g, '\\\\\n');
              fixed = fixed.replace(/\\ (?=[a-zA-Z0-9_{}])/g, '\\\\ ');
              return katex.renderToString(fixed, { displayMode: true, throwOnError: false });
            } catch { return match; }
          });

          // \(...\) 行内公式
          resultHTML = resultHTML.replace(/\\\(([\s\S]+?)\\\)/g, (match, formula) => {
            hasFormula = true;
            try {
              return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
            } catch { return match; }
          });

          // \[...\] 块级公式 (保留换行)
          resultHTML = resultHTML.replace(/\\\[([\s\S]+?)\\\]/g, (match, formula) => {
            hasFormula = true;
            try {
              return katex.renderToString(formula, { displayMode: true, throwOnError: false });
            } catch { return match; }
          });

          // $...$ 行内公式 (智能匹配)
          resultHTML = resultHTML.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
            const content = formula.trim();
            const looksLikeLatex = content.length <= 2 || content.includes('\\') ||
              content.includes('_') || content.includes('^') || content.includes('{') ||
              /\b(alpha|beta|gamma|delta|theta|lambda|mu|sigma|pi|omega|sum|int|frac|sqrt)\b/i.test(content);
            if (!looksLikeLatex) return match;
            hasFormula = true;
            try {
              // 修复矩阵换行: \ 后跟字母/数字 → \\
              let fixed = content.replace(/\\ (?=[a-zA-Z0-9_{}])/g, '\\\\ ');
              return katex.renderToString(fixed, { displayMode: false, throwOnError: false });
            } catch { return match; }
          });

          if (hasFormula && resultHTML !== text && resultHTML.includes('katex')) {
            const span = document.createElement('span');
            span.innerHTML = resultHTML;
            textNode.parentNode.replaceChild(span, textNode);
          }
        } catch (e) {}
      });
    } finally {
      window._claudeRenderingLaTeX = false;
    }
  }

  // 滚轮缩放
  function setupZoom() {
    let zoom = parseFloat(localStorage.getItem('claude-zoom') || '1.0');
    document.body.style.zoom = zoom;

    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        zoom = Math.max(0.5, Math.min(2.0, zoom + delta));
        document.body.style.zoom = zoom;
        localStorage.setItem('claude-zoom', zoom.toString());
        showZoomIndicator(zoom);
      }
    }, { passive: false });
  }

  function showZoomIndicator(zoom) {
    let indicator = document.getElementById('zoom-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'zoom-indicator';
      indicator.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: rgba(40, 40, 40, 0.95); color: #fff;
        padding: 8px 16px; border-radius: 6px; font-size: 14px;
        z-index: 10000; transition: opacity 0.3s;
      `;
      document.body.appendChild(indicator);
    }
    indicator.textContent = `缩放: ${Math.round(zoom * 100)}%`;
    indicator.style.opacity = '1';
    setTimeout(() => { indicator.style.opacity = '0'; }, 1000);
  }

  // DOM 监听 - 防抖处理, 避免输出过程中抽搐
  function setupObserver() {
    let debounceTimer = null;
    const DEBOUNCE_DELAY = 500; // 等待 500ms 无变化后再渲染

    const observer = new MutationObserver((mutations) => {
      // 跳过我们自己添加的元素
      let hasRealChange = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            const cls = node.className?.toString() || '';
            if (!cls.includes('hljs') && !cls.includes('katex') && !cls.includes('zoom-indicator')) {
              hasRealChange = true;
              break;
            }
          }
        }
        if (hasRealChange) break;
      }

      if (!hasRealChange) return;

      // 清除之前的定时器, 重新计时
      if (debounceTimer) clearTimeout(debounceTimer);

      // 等待输出稳定后再渲染
      debounceTimer = setTimeout(() => {
        highlightAllCode();
        renderLaTeX();
      }, DEBOUNCE_DELAY);
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 初始化
  function init() {
    console.log('[Claude Enhance] Initializing...');
    injectStyles();
    injectHighlightJS();
    injectKaTeX();
    setupZoom();
    setupObserver();
    highlightAllCode();
    renderLaTeX();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
