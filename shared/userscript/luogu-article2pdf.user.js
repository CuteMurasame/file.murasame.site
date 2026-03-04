// ==UserScript==
// @name         Luogu Article2PDF
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  将洛谷专栏快速打印为 PDF。
// @author       Murasame & Gemini
// @match        *://www.luogu.com.cn/article/*
// @match        *://www.luogu.com/article/*
// @require      https://fastly.jsdelivr.net/npm/sweetalert2@11
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const DEFAULT_CONFIG = {
        mainFont: 'Lato, "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
        codeFont: '"Fira Code", Consolas, Monaco, monospace',
        showCodeBlockBorder: true,
        showLineNumbers: true
    };

    function getConfig() {
        try {
            const saved = localStorage.getItem('gemini_pdf_config');
            return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
        } catch (e) {
            return DEFAULT_CONFIG;
        }
    }

    function saveConfig(cfg) {
        localStorage.setItem('gemini_pdf_config', JSON.stringify(cfg));
    }

    function createSettingsModal() {
        if (document.getElementById('gemini-pdf-modal')) return;

        const overlay = document.createElement('div');
        overlay.id = 'gemini-pdf-modal';
        overlay.style.position = 'fixed';
        overlay.style.top = '0'; overlay.style.left = '0';
        overlay.style.width = '100vw'; overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '999999';
        overlay.style.display = 'none';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        const modal = document.createElement('div');
        modal.style.backgroundColor = '#fff';
        modal.style.padding = '24px 32px';
        modal.style.borderRadius = '8px';
        modal.style.width = '400px';
        modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        modal.style.fontFamily = 'sans-serif';

        modal.innerHTML = `
            <h3 style="margin-top:0; margin-bottom: 20px; font-size: 18px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">PDF 打印高级设置</h3>

            <div style="margin-bottom: 15px;">
                <label style="display:block; font-size: 14px; margin-bottom: 5px; color: #555;">正文字体：</label>
                <input id="cfg-mainFont" type="text" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" />
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display:block; font-size: 14px; margin-bottom: 5px; color: #555;">代码块字体：</label>
                <input id="cfg-codeFont" type="text" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;" />
            </div>

            <div style="margin-bottom: 15px; display: flex; align-items: center;">
                <input id="cfg-border" type="checkbox" style="margin-right: 8px; width: 16px; height: 16px;" />
                <label for="cfg-border" style="font-size: 14px; color: #333; cursor: pointer;">为代码块添加边框</label>
            </div>

            <div style="margin-bottom: 25px; display: flex; align-items: center;">
                <input id="cfg-linenum" type="checkbox" style="margin-right: 8px; width: 16px; height: 16px;" />
                <label for="cfg-linenum" style="font-size: 14px; color: #333; cursor: pointer;">显示代码块行号</label>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button id="cfg-cancel" style="padding: 8px 16px; border: none; background: #e0e0e0; color: #333; border-radius: 4px; cursor: pointer;">取消</button>
                <button id="cfg-save" style="padding: 8px 16px; border: none; background: #3498db; color: #fff; border-radius: 4px; cursor: pointer;">保存</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        document.getElementById('cfg-cancel').onclick = () => overlay.style.display = 'none';

        document.getElementById('cfg-save').onclick = () => {
            const newCfg = {
                mainFont: document.getElementById('cfg-mainFont').value,
                codeFont: document.getElementById('cfg-codeFont').value,
                showCodeBlockBorder: document.getElementById('cfg-border').checked,
                showLineNumbers: document.getElementById('cfg-linenum').checked
            };
            saveConfig(newCfg);
            overlay.style.display = 'none';
            Swal.fire({
                icon: 'success',
                title: '保存成功',
                text: '设置已保存！下次点击“打印为 PDF”时生效。',
                confirmButtonColor: '#3498db',
                timer: 2000
            });
        };
    }

    function openSettingsModal() {
        createSettingsModal();
        const cfg = getConfig();
        document.getElementById('cfg-mainFont').value = cfg.mainFont;
        document.getElementById('cfg-codeFont').value = cfg.codeFont;
        document.getElementById('cfg-border').checked = cfg.showCodeBlockBorder;
        document.getElementById('cfg-linenum').checked = cfg.showLineNumbers;
        document.getElementById('gemini-pdf-modal').style.display = 'flex';
    }


    function injectPrintButton() {
        if (document.getElementById('gemini-print-wrapper')) return;

        const metaDiv = document.querySelector('.metas');
        const content = document.querySelector('.lfe-marked');

        if (!metaDiv || !content) return;

        const printWrapper = document.createElement('div');
        printWrapper.id = 'gemini-print-wrapper';
        printWrapper.style.marginLeft = '1em';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'label';
        labelDiv.innerText = '操作';
        labelDiv.setAttribute('data-v-71eca628', '');

        const actionDiv = document.createElement('div');
        actionDiv.style.display = 'flex';

        const printBtn = document.createElement('span');
        printBtn.innerText = '打印为 PDF';
        printBtn.style.cursor = 'pointer';
        printBtn.style.color = '#3498db';
        printBtn.style.transition = 'color 0.2s';
        printBtn.onmouseover = () => printBtn.style.color = '#2980b9';
        printBtn.onmouseout = () => printBtn.style.color = '#3498db';

        const settingsBtn = document.createElement('span');
        settingsBtn.innerText = '（设置）';
        settingsBtn.style.cursor = 'pointer';
        settingsBtn.style.color = '#7f8c8d';
        settingsBtn.style.transition = 'color 0.2s';
        settingsBtn.onmouseover = () => settingsBtn.style.color = '#34495e';
        settingsBtn.onmouseout = () => settingsBtn.style.color = '#7f8c8d';

        actionDiv.appendChild(printBtn);
        actionDiv.appendChild(settingsBtn);
        printWrapper.appendChild(labelDiv);
        printWrapper.appendChild(actionDiv);
        metaDiv.appendChild(printWrapper);

        settingsBtn.addEventListener('click', openSettingsModal);

        printBtn.addEventListener('click', () => {
            const CONFIG = getConfig();
            const hiddenElements = [];
            const detailsStates = [];
            const pageBreakStates = [];
            const modifiedTables = [];
            const preStates = [];

            content.querySelectorAll('details').forEach(details => {
                detailsStates.push({ el: details, isOpen: details.hasAttribute('open') });
                details.setAttribute('open', '');
            });

            let firstPageBreak = null;
            content.querySelectorAll('p').forEach(p => {
                if (p.textContent.trim() === '===pagebreak===') {
                    if (!firstPageBreak) firstPageBreak = p;
                    pageBreakStates.push({ el: p, cssText: p.style.cssText });
                    p.style.pageBreakAfter = 'always';
                    p.style.breakAfter = 'always';
                    p.style.color = 'transparent';
                    p.style.height = '0';
                    p.style.margin = '0';
                    p.style.overflow = 'hidden';
                }
            });

            content.querySelectorAll('table').forEach(table => {
                let isBeforeFirstPageBreak = true;
                if (firstPageBreak) {
                    const position = table.compareDocumentPosition(firstPageBreak);
                    isBeforeFirstPageBreak = !!(position & Node.DOCUMENT_POSITION_FOLLOWING);
                }
                if (isBeforeFirstPageBreak) {
                    modifiedTables.push(table);
                    table.classList.add('gemini-print-table-full');
                    if (table.parentElement && table.parentElement.tagName === 'DIV') {
                        table.parentElement.classList.add('gemini-print-wrapper-full');
                    }
                }
            });

            content.querySelectorAll('pre').forEach(pre => {
                const code = pre.querySelector('code');
                if (!code) return;

                preStates.push({
                    el: pre,
                    cssText: pre.style.cssText,
                    injectedEl: null,
                    classList: Array.from(pre.classList)
                });

                if (CONFIG.showCodeBlockBorder) {
                    pre.classList.add('gemini-print-pre-border');
                }

                if (CONFIG.showLineNumbers) {
                    const codeStyle = window.getComputedStyle(code);
                    const preStyle = window.getComputedStyle(pre);

                    const linesCount = code.textContent.replace(/\n$/, '').split('\n').length;

                    const lineNumContainer = document.createElement('div');
                    lineNumContainer.className = 'gemini-print-linenumbers';

                    lineNumContainer.style.paddingTop = preStyle.paddingTop;
                    lineNumContainer.style.paddingBottom = preStyle.paddingBottom;

                    let numsHTML = '';
                    for (let i = 1; i <= linesCount; i++) {
                        numsHTML += `<div style="line-height: ${codeStyle.lineHeight}; font-size: ${codeStyle.fontSize}; font-family: ${CONFIG.codeFont || codeStyle.fontFamily};">${i}</div>`;
                    }
                    lineNumContainer.innerHTML = numsHTML;

                    pre.style.position = 'relative';
                    pre.style.paddingLeft = '3.5em';
                    pre.appendChild(lineNumContainer);

                    preStates[preStates.length - 1].injectedEl = lineNumContainer;
                }
            });

            let curr = content;
            while (curr && curr !== document.body) {
                const siblings = curr.parentNode ? curr.parentNode.children : [];
                for (let i = 0; i < siblings.length; i++) {
                    const sibling = siblings[i];
                    if (sibling !== curr && sibling.tagName !== 'SCRIPT' && sibling.tagName !== 'STYLE' && sibling.id !== 'gemini-pdf-modal') {
                        hiddenElements.push({ el: sibling, display: sibling.style.display });
                        sibling.style.display = 'none';
                    }
                }
                hiddenElements.push({
                    el: curr, margin: curr.style.margin, padding: curr.style.padding,
                    width: curr.style.width, maxWidth: curr.style.maxWidth, isAncestor: true
                });
                curr.style.margin = '0';
                curr.style.padding = '0';
                curr.style.width = '100%';
                curr.style.maxWidth = '100%';

                curr = curr.parentNode;
            }

            const printStyle = document.createElement('style');
            printStyle.innerHTML = `
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page { margin: 1.5cm; }
                    body { background: white !important; }
                    pre, blockquote, tr, img { page-break-inside: avoid; }
                    .lfe-marked { width: 100% !important; max-width: none !important; }
                    details[open] { display: block !important; }

                    .gemini-print-wrapper-full { overflow: visible !important; display: block !important; width: 99% !important; }
                    .gemini-print-table-full { width: 99% !important; max-width: 99% !important; display: table !important; table-layout: auto !important; }

                    ${CONFIG.mainFont ? `.lfe-marked { font-family: ${CONFIG.mainFont} !important; }` : ''}
                    ${CONFIG.codeFont ? `.lfe-marked pre, .lfe-marked code { font-family: ${CONFIG.codeFont} !important; }` : ''}

                    .gemini-print-pre-border {
                        border: 1px solid #d1d5db !important;
                        border-radius: 6px !important;
                        box-shadow: none !important;
                    }

                    .gemini-print-linenumbers {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        bottom: 0 !important;
                        width: 2.5em !important;
                        background-color: #f8f9fa !important;
                        border-right: 1px solid #e5e7eb !important;
                        text-align: right !important;
                        padding-right: 0.6em !important;
                        color: #9ca3af !important;
                        user-select: none !important;
                        box-sizing: border-box !important;
                    }
                }
            `;
            document.head.appendChild(printStyle);

            setTimeout(() => {
                window.print();

                hiddenElements.forEach(item => {
                    if (item.isAncestor) {
                        item.el.style.margin = item.margin; item.el.style.padding = item.padding;
                        item.el.style.width = item.width; item.el.style.maxWidth = item.maxWidth;
                    } else {
                        item.el.style.display = item.display;
                    }
                });
                detailsStates.forEach(item => {
                    if (item.isOpen) item.el.setAttribute('open', '');
                    else item.el.removeAttribute('open');
                });
                pageBreakStates.forEach(item => {
                    item.el.style.cssText = item.cssText;
                });
                modifiedTables.forEach(table => {
                    table.classList.remove('gemini-print-table-full');
                    if (table.parentElement) {
                        table.parentElement.classList.remove('gemini-print-wrapper-full');
                    }
                });
                preStates.forEach(item => {
                    item.el.style.cssText = item.cssText;
                    item.el.className = item.classList.join(' ');
                    if (item.injectedEl && item.injectedEl.parentNode) {
                        item.injectedEl.parentNode.removeChild(item.injectedEl);
                    }
                });

                document.head.removeChild(printStyle);
            }, 500);
        });
    }

    const observer = new MutationObserver(() => injectPrintButton());
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(injectPrintButton, 1000);
})();
