// ==UserScript==
// @name         Wide Screen Content Limiter Pro
// @namespace    https://github.com/goloveshko/ultrawide-page-limiter
// @version      2.0
// @description  Limits page width with adaptations for YouTube, Yandex, GitHub and other sites
// @author       goloveshko
// @homepageURL  https://github.com/goloveshko/ultrawide-page-limiter
// @supportURL   https://github.com/goloveshko/ultrawide-page-limiter/issues
// @downloadURL  https://raw.githubusercontent.com/goloveshko/ultrawide-page-limiter/main/ultrawide-page-limiter.user.js
// @updateURL    https://raw.githubusercontent.com/goloveshko/ultrawide-page-limiter/main/ultrawide-page-limiter.user.js
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  if (window.top !== window.self) return;

  const STYLE_ELEMENT_ID = "uw-limiter-style";
  const FALLBACK_DEFAULT_WIDTH = 1400;
  const currentDomain = window.location.hostname;

  const keyEnabled = `width_limit_${currentDomain}`;
  const keyWidth = `width_val_${currentDomain}`;
  const keyGlobalWidth = "width_val_global_default";
  const keyShowButton = `show_floating_button_global`;

  let isEnabled = GM_getValue(keyEnabled, false);
  let globalDefaultWidth = GM_getValue(keyGlobalWidth, FALLBACK_DEFAULT_WIDTH);
  let hasCustomSiteWidth = GM_getValue(keyWidth, null) !== null;
  let siteMaxWidth = hasCustomSiteWidth
    ? GM_getValue(keyWidth)
    : globalDefaultWidth;
  let showFloatingBtn = GM_getValue(keyShowButton, true);

  let menuIdToggle = null;
  let menuIdWidth = null;
  let menuIdGlobalWidth = null;
  let menuIdBtnVis = null;
  let host = null;
  let btn = null;

  // Declarative site-specific adaptation rules
  const SITE_RULES = [
    {
      name: "YouTube",
      match: (domain) => domain.includes("youtube.com"),
      css: `
                #page-manager,
                #masthead-container,
                ytd-mini-guide-renderer {
                    max-width: var(--uw-max-width) !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
                /* Shift the mini-sidebar to keep it in place */
                ytd-mini-guide-renderer {
                    left: calc(50% - (var(--uw-max-width) / 2)) !important;
                    margin-left: 0 !important;
                }
            `,
    },
    {
      name: "Yandex",
      match: (domain) => domain.includes("ya.ru") || domain.includes("yandex."),
      css: `
                .HeaderDesktop-Content,
                .HeaderContainer,
                .main,
                .content_type_search,
                .Root-Header {
                    max-width: var(--uw-max-width) !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                }
            `,
    },
    {
      name: "GitHub",
      match: (domain) => domain.includes("github.com"),
      css: `
                .application-main,
                header[role="banner"],
                .js-header-wrapper,
                footer,
                .container-lg {
                    max-width: var(--uw-max-width) !important;
                    margin-left: auto !important;
                    margin-right: auto !important;
                    padding-left: 16px !important;
                    padding-right: 16px !important;
                }
            `,
    },
  ];

  const DEFAULT_FALLBACK_CSS = `
        html {
            overflow-x: hidden !important;
        }
        body {
            max-width: var(--uw-max-width) !important;
            margin-left: auto !important;
            margin-right: auto !important;
            position: relative !important;
            box-sizing: border-box !important;
            min-height: 100vh !important;
            box-shadow: 0 0 50px rgba(0, 0, 0, 0.2) !important;
        }
    `;

  function getCss() {
    const rule = SITE_RULES.find((item) => item.match(currentDomain));
    return rule ? rule.css : DEFAULT_FALLBACK_CSS;
  }

  function updateCssVariables() {
    if (document.documentElement) {
      document.documentElement.style.setProperty(
        "--uw-max-width",
        `${siteMaxWidth}px`,
      );
    }
  }

  function applyStyles(enable) {
    const existingStyle = document.getElementById(STYLE_ELEMENT_ID);

    if (!enable) {
      if (existingStyle) {
        existingStyle.remove();
      }
      return;
    }

    updateCssVariables();

    if (!existingStyle) {
      const style = document.createElement("style");
      style.id = STYLE_ELEMENT_ID;
      style.textContent = getCss();
      const target = document.head || document.documentElement;
      if (target) {
        target.appendChild(style);
      }
    }
  }

  function updateMenuCommands() {
    if (menuIdToggle !== null && typeof GM_unregisterMenuCommand === "function")
      GM_unregisterMenuCommand(menuIdToggle);
    if (menuIdWidth !== null && typeof GM_unregisterMenuCommand === "function")
      GM_unregisterMenuCommand(menuIdWidth);
    if (
      menuIdGlobalWidth !== null &&
      typeof GM_unregisterMenuCommand === "function"
    )
      GM_unregisterMenuCommand(menuIdGlobalWidth);
    if (menuIdBtnVis !== null && typeof GM_unregisterMenuCommand === "function")
      GM_unregisterMenuCommand(menuIdBtnVis);

    if (typeof GM_registerMenuCommand === "function") {
      menuIdToggle = GM_registerMenuCommand(
        isEnabled ? "❌ Disable width limit" : "📏 Enable width limit",
        toggleState,
      );
      menuIdWidth = GM_registerMenuCommand(
        `⚙️ Site width (${siteMaxWidth}px)${hasCustomSiteWidth ? "" : " [global default]"}`,
        promptForWidth,
      );
      menuIdGlobalWidth = GM_registerMenuCommand(
        `🌐 Global default width (${globalDefaultWidth}px)`,
        promptForGlobalWidth,
      );
      menuIdBtnVis = GM_registerMenuCommand(
        showFloatingBtn
          ? "👁️ Floating button: ON (click to hide)"
          : "🙈 Floating button: OFF (click to show)",
        toggleButtonVisibility,
      );
    }
  }

  function toggleButtonVisibility() {
    showFloatingBtn = !showFloatingBtn;
    GM_setValue(keyShowButton, showFloatingBtn);

    if (host) {
      host.style.display = showFloatingBtn ? "block" : "none";
    } else if (showFloatingBtn) {
      createToggleButton();
    }
    updateMenuCommands();
  }

  function promptForWidth() {
    const input = prompt(
      `Page width for ${currentDomain} (in pixels):\n` +
        `Example: 1200, 1400, 1600`,
      siteMaxWidth,
    );

    if (input !== null) {
      const val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 500 && val <= 4000) {
        siteMaxWidth = val;
        hasCustomSiteWidth = true;
        GM_setValue(keyWidth, val);
        if (isEnabled) {
          updateCssVariables();
        }
        updateMenuCommands();
        updateButtonAppearance();
      } else {
        alert("Please enter a valid number between 500 and 4000.");
      }
    }
  }

  function promptForGlobalWidth() {
    const input = prompt(
      `Default page width for all new sites (in pixels):\n` +
        `Current global default: ${globalDefaultWidth}px\n` +
        `Example: 1200, 1400, 1600`,
      globalDefaultWidth,
    );

    if (input !== null) {
      const val = parseInt(input.trim(), 10);
      if (!isNaN(val) && val >= 500 && val <= 4000) {
        globalDefaultWidth = val;
        GM_setValue(keyGlobalWidth, val);

        if (!hasCustomSiteWidth) {
          siteMaxWidth = val;
          if (isEnabled) {
            updateCssVariables();
          }
          updateButtonAppearance();
        }

        updateMenuCommands();
      } else {
        alert("Please enter a valid number between 500 and 4000.");
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
    if (!btn || !host) return;
    host.style.display = showFloatingBtn ? "block" : "none";
    btn.innerHTML = isEnabled ? "📐" : "📏";
    btn.style.background = isEnabled
      ? "rgba(46, 125, 50, 0.9)"
      : "rgba(40, 40, 40, 0.9)";
    btn.title = `Width: ${siteMaxWidth}px\n• Left Click: Enable / Disable\n• Right Click: Change width`;
  }

  function createToggleButton() {
    if (!showFloatingBtn) return;

    const parent = document.body || document.documentElement;
    if (!parent) return;

    if (!host) {
      host = document.createElement("div");
      host.id = "tampermonkey-width-limiter-host";
      host.style.cssText = `
                position: fixed !important;
                bottom: 20px !important;
                right: 20px !important;
                width: 44px !important;
                height: 44px !important;
                z-index: 2147483647 !important;
                pointer-events: auto !important;
            `;

      const shadow = host.attachShadow({ mode: "open" });

      const shadowStyle = document.createElement("style");
      shadowStyle.textContent = `
                .limiter-btn {
                    all: initial;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 22px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                    transition: transform 0.15s ease, background 0.2s ease;
                    user-select: none;
                    -webkit-user-select: none;
                    backdrop-filter: blur(4px);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    box-sizing: border-box;
                }
                .limiter-btn:hover {
                    transform: scale(1.1);
                }
                .limiter-btn:active {
                    transform: scale(0.9);
                }
            `;

      btn = document.createElement("div");
      btn.className = "limiter-btn";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleState();
      });

      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        promptForWidth();
      });

      shadow.appendChild(shadowStyle);
      shadow.appendChild(btn);
    }

    updateButtonAppearance();

    if (!document.getElementById("tampermonkey-width-limiter-host")) {
      parent.appendChild(host);
    }
  }

  // Start
  if (isEnabled) {
    applyStyles(true);
  }
  updateMenuCommands();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createToggleButton);
  } else {
    createToggleButton();
  }

  // DOM observer for SPA navigation
  const observer = new MutationObserver(() => {
    if (showFloatingBtn && (!host || !document.contains(host))) {
      createToggleButton();
    }
  });

  const startObserving = () => {
    const target = document.body || document.documentElement;
    if (target) {
      observer.observe(target, { childList: true });
    } else {
      setTimeout(startObserving, 100);
    }
  };
  startObserving();
})();
