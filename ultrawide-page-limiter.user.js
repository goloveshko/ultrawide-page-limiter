// ==UserScript==
// @name         Wide Screen Content Limiter
// @namespace    https://github.com/goloveshko/ultrawide-page-limiter
// @version      2.1
// @description  Limits page width with adaptations for YouTube, Yandex, GitHub and other sites
// @author       goloveshko
// @homepageURL  https://github.com/goloveshko/ultrawide-page-limiter
// @supportURL   https://github.com/goloveshko/ultrawide-page-limiter/issues
// @downloadURL  https://raw.githubusercontent.com/goloveshko/ultrawide-page-limiter/main/ultrawide-page-limiter.user.js
// @updateURL    https://raw.githubusercontent.com/goloveshko/ultrawide-page-limiter/main/ultrawide-page-limiter.user.js
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_openInTab
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
  let menuIdReport = null;
  let host = null;
  let btn = null;

  // Declarative site-specific adaptation rules
  const SITE_RULES = [
    {
      name: "Gmail",
      match: (domain) => domain.includes("mail.google.com"),
      css: `
            /* Center Gmail top bar */
            #gb {
                max-width: var(--uw-max-width) !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            /* Center the true workspace container holding sidebar (.bkL) and emails (.aeF) */
            div:has(> .bkL),
            div:has(> .aeF) {
                max-width: var(--uw-max-width) !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            /* Ensure opened email reading view fits cleanly */
            .a3s.aiL,
            .adn.ads {
                max-width: 100% !important;
            }
        `,
    },
    {
      name: "YouTube",
      match: (domain) => domain.includes("youtube.com"),
      css: `
            /* 1. Constrain video feeds (Home, Subscriptions, Channels) */
            ytd-two-column-browse-results-renderer,
            ytd-two-column-search-results-renderer {
                max-width: var(--uw-max-width) !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            /* 2. Watch page: center player + comments */
            ytd-watch-flexy:not([fullscreen]) #columns {
                max-width: var(--uw-max-width) !important;
                margin-left: auto !important;
                margin-right: auto !important;
            }

            /* 3. Theater mode: player spans full width, comments stay centered */
            ytd-watch-flexy[theater]:not([fullscreen]) #columns {
                max-width: var(--uw-max-width) !important;
                margin-left: auto !important;
                margin-right: auto !important;
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
            overflow-x: clip;
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
    if (menuIdReport !== null && typeof GM_unregisterMenuCommand === "function")
      GM_unregisterMenuCommand(menuIdReport);

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
      menuIdReport = GM_registerMenuCommand(
        "🐛 Report layout issue / Copy debug info",
        copySiteDiagnostics,
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
    if (document.fullscreenElement || document.webkitFullscreenElement) return;

    isEnabled = !isEnabled;
    GM_setValue(keyEnabled, isEnabled);
    applyStyles(isEnabled);
    updateMenuCommands();
    updateButtonAppearance();
  }

  function updateButtonAppearance() {
    if (!btn || !host) return;
    host.style.display = showFloatingBtn ? "block" : "none";
    btn.textContent = isEnabled ? "📐" : "📏";
    btn.style.background = isEnabled
      ? "rgba(46, 125, 50, 0.9)"
      : "rgba(40, 40, 40, 0.9)";
    btn.title = `Width: ${siteMaxWidth}px\n• Left Click: Enable / Disable\n• Right Click: Change width`;
  }

  function createToggleButton() {
    if (!showFloatingBtn) return;

    const parent = document.documentElement || document.body;
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

  function getElementMetrics(el, label) {
    if (!el) return null;
    const s = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const classes =
      el.className && typeof el.className === "string"
        ? el.className.trim().split(/\s+/).slice(0, 4).join(".")
        : "";
    return {
      label,
      tag: el.tagName.toLowerCase(),
      selector:
        `${el.id ? "#" + el.id : ""}${classes ? "." + classes : ""}` ||
        "(none)",
      display: s.display,
      position: s.position,
      dimensions: `${Math.round(rect.width)}x${Math.round(rect.height)}px`,
      left: `${Math.round(rect.left)}px`,
      margin: `${s.marginTop} ${s.marginRight} ${s.marginBottom} ${s.marginLeft}`,
    };
  }

  function collectDiagnostics() {
    const metrics = [];

    // 1. Root elements
    metrics.push(getElementMetrics(document.documentElement, "html"));
    metrics.push(getElementMetrics(document.body, "body"));

    // 2. Landmarks
    const landmarks = [
      { sel: 'header, [role="banner"]', label: "header" },
      { sel: 'nav, [role="navigation"]', label: "nav" },
      { sel: 'main, [role="main"]', label: "main" },
      { sel: 'aside, [role="complementary"]', label: "aside" },
    ];

    landmarks.forEach(({ sel, label }) => {
      const el = document.querySelector(sel);
      if (el) metrics.push(getElementMetrics(el, label));
    });

    // 3. Top-level body containers
    if (document.body) {
      Array.from(document.body.children)
        .slice(0, 6)
        .forEach((child, i) => {
          if (
            child.id !== "tampermonkey-width-limiter-host" &&
            child.tagName !== "SCRIPT" &&
            child.tagName !== "STYLE"
          ) {
            metrics.push(getElementMetrics(child, `body > child[${i}]`));
          }
        });
    }

    // Build Markdown table
    let table =
      "| Block | Tag | Selector | Display | Position | Width x Height | Left | Margin |\n";
    table += "|---|---|---|---|---|---|---|---|\n";
    metrics.filter(Boolean).forEach((m) => {
      table += `| **${m.label}** | \`${m.tag}\` | \`${m.selector}\` | ${m.display} | ${m.position} | ${m.dimensions} | ${m.left} | ${m.margin} |\n`;
    });

    return [
      `### 🐛 Layout Diagnostic Report: \`${currentDomain}\``,
      `- **URL:** ${window.location.href}`,
      `- **Viewport:** ${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`,
      `- **Settings:** Enabled: \`${isEnabled}\`, Site Width: \`${siteMaxWidth}px\`, Global Default: \`${globalDefaultWidth}px\``,
      "",
      "#### DOM Metrics & Landmarks",
      table,
      "---",
      "*Generated automatically by Wide Screen Content Limiter*",
    ].join("\n");
  }

  function copySiteDiagnostics() {
    const wasEnabled = isEnabled;

    if (wasEnabled) {
      applyStyles(false);
      void document.documentElement.offsetHeight;
    }

    const report = collectDiagnostics();

    if (wasEnabled) {
      applyStyles(true);
    }

    if (typeof GM_setClipboard === "function") {
      GM_setClipboard(report);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(report);
    }

    const openIssue = confirm(
      `📋 Diagnostic report for "${currentDomain}" has been copied to your clipboard!\n\n` +
        `Would you like to open GitHub Issues now to paste it and submit a report?`,
    );

    if (openIssue) {
      const issueUrl =
        `https://github.com/goloveshko/ultrawide-page-limiter/issues/new?title=` +
        encodeURIComponent(
          `[Site Layout] Broken or misaligned layout on ${currentDomain}`,
        );

      if (typeof GM_openInTab === "function") {
        GM_openInTab(issueUrl, { active: true, insert: true });
      } else {
        window.open(issueUrl, "_blank");
      }
    }
  }

  function handleFullscreenChange() {
    if (!host) return;

    const isFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement,
    );

    if (isFullscreen) {
      host.style.setProperty("display", "none", "important");
    } else {
      host.style.removeProperty("display");
      host.style.display = showFloatingBtn ? "block" : "none";
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

  const onFsChange = () => {
    handleFullscreenChange();
    setTimeout(handleFullscreenChange, 100);
  };
  document.addEventListener("fullscreenchange", onFsChange);
  document.addEventListener("webkitfullscreenchange", onFsChange);
})();
