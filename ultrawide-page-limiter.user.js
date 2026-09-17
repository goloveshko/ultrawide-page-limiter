// ==UserScript==
// @name         Wide Screen Content Limiter Pro
// @namespace    https://github.com/goloveshko/ultrawide-page-limiter
// @version      1.9
// @description  Limits page width with adaptations for YouTube, Yandex, GitHub and other sites
// @author       goloveshko
// @homepageURL  https://github.com/goloveshko/ultrawide-page-limiter
// @supportURL   https://github.com/goloveshko/ultrawide-page-limiter/issues
// @downloadURL  https://raw.githubusercontent.com/goloveshko/ultrawide-page-limiter/main/ultrawide-page-limiter.user.js
// @updateURL    https://raw.githubusercontent.com/goloveshko/ultrawide-page-limiter/main/ultrawide-page-limiter.user.js
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// @license      MIT
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

    let styleObj = null;
    let menuIdToggle = null;
    let menuIdWidth = null;
    let menuIdBtnVis = null;
    let btn = null;

    // Smart CSS generator for specific domains
    function getCss(width) {
        // 1. YouTube
        if (currentDomain.includes('youtube.com')) {
            return `
                #page-manager,
                #masthead-container,
                ytd-mini-guide-renderer {
                    max-width: ${width}px !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                /* Shift the mini-sidebar to keep it in place */
                ytd-mini-guide-renderer {
                    left: calc(50% - ${width / 2}px) !important;
                    margin-left: 0 !important;
                }
            `;
        }

        // 2. Yandex (Search and services)
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

        // 3. GitHub (considering the container layout)
        if (currentDomain.includes('github.com')) {
            return `
                .application-main,
                header[role="banner"],
                .js-header-wrapper,
                footer,
                .container-lg {
                    max-width: ${width}px !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                    padding-left: 16px !important;
                    padding-right: 16px !important;
                }
            `;
        }

        // 4. All other regular sites
        return `
            html {
                overflow-x: hidden !important;
            }
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
        if (styleObj && typeof styleObj.remove === 'function') {
            styleObj.remove();
            styleObj = null;
        }

        if (enable) {
            styleObj = GM_addStyle(getCss(siteMaxWidth));
        }
    }

    function updateMenuCommands() {
        if (menuIdToggle !== null && typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(menuIdToggle);
        if (menuIdWidth !== null && typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(menuIdWidth);
        if (menuIdBtnVis !== null && typeof GM_unregisterMenuCommand === 'function') GM_unregisterMenuCommand(menuIdBtnVis);

        if (typeof GM_registerMenuCommand === 'function') {
            menuIdToggle = GM_registerMenuCommand(
                isEnabled ? '❌ Disable width limit' : '📏 Enable width limit',
                toggleState
            );
            menuIdWidth = GM_registerMenuCommand(
                `⚙️ Change width (${siteMaxWidth}px)`,
                promptForWidth
            );
            menuIdBtnVis = GM_registerMenuCommand(
                showFloatingBtn ? '👁️ Floating button: ON (click to hide)' : '🙈 Floating button: OFF (click to show)',
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
            `Page width for ${currentDomain} (in pixels):\n` +
            `Example: 1200, 1400, 1600`,
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
                alert('Please enter a valid number between 500 and 4000.');
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
        btn.style.background = isEnabled ? 'rgba(46, 125, 50, 0.9)' : 'rgba(40, 40, 40, 0.9)';
        btn.title = `Width: ${siteMaxWidth}px\n• Left Click: Enable / Disable\n• Right Click: Change width`;
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
                box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
                transition: transform 0.2s ease, background 0.2s ease !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                backdrop-filter: blur(4px) !important;
                border: 2px solid rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
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

    // Start
    if (isEnabled) {
        applyStyles(true);
    }
    updateMenuCommands();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggleButton);
    } else {
        createToggleButton();
    }

    // Lightweight DOM observer for SPA navigation without CPU overhead
    const observer = new MutationObserver(() => {
        if (showFloatingBtn && (!btn || !document.contains(btn))) {
            createToggleButton();
        }
    });

    const startObserving = () => {
        const target = document.body || document.documentElement;
        if (target) {
            // Only observe direct children additions/removals
            observer.observe(target, { childList: true });
        } else {
            setTimeout(startObserving, 100);
        }
    };
    startObserving();
})();