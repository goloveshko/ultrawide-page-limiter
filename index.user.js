// ==UserScript==
// @name         Wide Screen Content Limiter Pro
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Ограничивает ширину страниц с адаптацией под YouTube, Яндекс, GitHub и другие сайты
// @author       You
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    if (window.top !== window.self) return;

    const DEFAULT_MAX_WIDTH = 1400;
    const currentDomain = window.location.hostname;
    
    const keyEnabled = `width_limit_${currentDomain}`;
    const keyWidth = `width_val_${currentDomain}`;
    const keyShowButton = `show_floating_button_global`;

    let isEnabled = GM_getValue(keyEnabled, false);
    let siteMaxWidth = GM_getValue(keyWidth, DEFAULT_MAX_WIDTH);
    let showFloatingBtn = GM_getValue(keyShowButton, true);

    let injectedStyle = null;
    let menuIdToggle = null;
    let menuIdWidth = null;
    let menuIdBtnVis = null;
    let btn = null;

    // Умный генератор CSS под конкретные домены
    function getCss(width) {
        // 1. YouTube
        if (currentDomain.includes('youtube.com')) {
            return `
                #page-manager {
                    max-width: ${width}px !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
            `;
        }

        // 2. Яндекс (Поиск и сервисы)
        if (currentDomain.includes('ya.ru') || currentDomain.includes('yandex.')) {
            return `
                .HeaderDesktop-Content,
                .HeaderContainer,
                .main,
                .content_type_search,
                .Root-Header {
                    max-width: ${width}px !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
            `;
        }

        // 3. GitHub
        if (currentDomain.includes('github.com')) {
            return `
                .application-main,
                header[role="banner"],
                .js-header-wrapper,
                footer {
                    max-width: ${width}px !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
            `;
        }

        // 4. Все остальные обычные сайты
        return `
            body {
                max-width: ${width}px !important;
                margin-left: auto !important;
                margin-right: auto !important;
                box-shadow: 0 0 40px rgba(0, 0, 0, 0.15) !important;
                min-height: 100vh !important;
            }
        `;
    }

    function applyStyles(enable) {
        if (injectedStyle) {
            if (typeof injectedStyle.remove === 'function') {
                injectedStyle.remove();
            } else if (injectedStyle.parentNode) {
                injectedStyle.parentNode.removeChild(injectedStyle);
            }
            injectedStyle = null;
        }

        if (enable) {
            injectedStyle = GM_addStyle(getCss(siteMaxWidth));
        }
    }

    function updateMenuCommands() {
        if (menuIdToggle !== null && typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(menuIdToggle);
        if (menuIdWidth !== null && typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(menuIdWidth);
        if (menuIdBtnVis !== null && typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(menuIdBtnVis);

        if (typeof GM_registerMenuCommand === 'function') {
            menuIdToggle = GM_registerMenuCommand(
                isEnabled ? '❌ Выключить ограничение ширины' : '📏 Включить ограничение ширины',
                toggleState
            );
            menuIdWidth = GM_registerMenuCommand(
                `⚙️ Изменить ширину (${siteMaxWidth}px)`,
                promptForWidth
            );
            menuIdBtnVis = GM_registerMenuCommand(
                showFloatingBtn ? '👁️ Плавающая кнопка: ВКЛ (нажмите чтобы скрыть)' : '🙈 Плавающая кнопка: ВЫКЛ (нажмите чтобы показать)',
                toggleButtonVisibility
            );
        }
    }

    function toggleButtonVisibility() {
        showFloatingBtn = !showFloatingBtn;
        GM_setValue(keyShowButton, showFloatingBtn);
        
        if (btn) {
            btn.style.display = showFloatingBtn ? 'flex' : 'none';
        } else if (showFloatingBtn) {
            createToggleButton();
        }
        updateMenuCommands();
    }

    function promptForWidth() {
        const input = prompt(
            `Ширина страницы для сайта ${currentDomain} (в пикселях):\n` +
            `Например: 1200, 1400, 1600`,
            siteMaxWidth
        );

        if (input !== null) {
            const val = parseInt(input.trim(), 10);
            if (!isNaN(val) && val >= 500 && val <= 4000) {
                siteMaxWidth = val;
                GM_setValue(keyWidth, val);
                if (isEnabled) {
                    applyStyles(true);
                }
                updateMenuCommands();
                updateButtonAppearance();
            } else {
                alert('Пожалуйста, введите корректное число от 500 до 4000.');
            }
        }
    }

    function toggleState() {
        isEnabled = !isEnabled;
        GM_setValue(keyEnabled, isEnabled);
        applyStyles(isEnabled);
        updateMenuCommands();
        updateButtonAppearance();
    }

    function updateButtonAppearance() {
        if (!btn) return;
        btn.style.display = showFloatingBtn ? 'flex' : 'none';
        btn.innerHTML = isEnabled ? '📐' : '📏';
        btn.style.background = isEnabled ? '#2e7d32' : '#333333';
        btn.style.color = '#ffffff';
        btn.style.border = isEnabled ? '2px solid #4caf50' : '2px solid #555555';
        btn.title = `Ширина: ${siteMaxWidth}px\n• ЛКМ: Включить / Выключить\n• ПКМ: Изменить ширину`;
    }

    function createToggleButton() {
        if (!showFloatingBtn) return;

        const parent = document.body || document.documentElement;
        if (!parent) return;

        if (!btn) {
            btn = document.createElement('div');
            btn.id = 'tampermonkey-width-limiter-btn';
            btn.style.cssText = `
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                width: 44px !important;
                height: 44px !important;
                border-radius: 50% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                z-index: 2147483647 !important;
                font-size: 22px !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
                transition: transform 0.2s ease !important;
                user-select: none !important;
                pointer-events: auto !important;
            `;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleState();
            });

            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                promptForWidth();
            });

            btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
            btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        }

        updateButtonAppearance();

        if (!document.getElementById('tampermonkey-width-limiter-btn')) {
            parent.appendChild(btn);
        }
    }

    // Запуск
    if (isEnabled) {
        applyStyles(true);
    }
    updateMenuCommands();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleButton);
    } else {
        createToggleButton();
    }

    // Восстановление кнопки для SPA-сайтов
    setInterval(() => {
        if (showFloatingBtn && !document.getElementById('tampermonkey-width-limiter-btn')) {
            createToggleButton();
        }
    }, 1000);
})();