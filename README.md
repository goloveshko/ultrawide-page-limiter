# Wide Screen Content Limiter

[![Version](https://img.shields.io/badge/version-2.3-blue.svg)](https://github.com/goloveshko/ultrawide-page-limiter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Supported Managers](https://img.shields.io/badge/userscript-Tampermonkey%20%7C%20Violentmonkey-green.svg)](#installation)

> Effortless page width constraint for ultrawide (21:9, 32:9) monitors with smart layout adaptations for YouTube, Gmail, GitHub, and other complex web apps.

[🇷🇺 Читать на русском языке](README.ru.md)

---

## 📖 Overview

Browsing the web on an ultrawide or super-ultrawide monitor often results in unreadable, wall-to-wall text lines, stretched feeds, and neck strain. 

**Wide Screen Content Limiter** brings web content back to the center of your screen at a comfortable reading width, while respecting complex multi-pane applications, sidebars, and full-screen video playback.

---

## ✨ Features

- **⚡ Zero Layout Flash (`@run-at document-start`):** Pre-applies constraints before the page finishes rendering to prevent visual flickering.
- **🎨 Dynamic CSS Variables (`--uw-max-width`):** Live width resizing without re-parsing stylesheets or reloading the page.
- **🛡️ Isolated Floating Control:** Floating toggle button lives inside an open **Shadow DOM** and uses CSP-safe DOM rendering (`textContent`, no `innerHTML`) for the floating UI — immune to aggressive page CSS resets and Trusted Types restrictions.
- **🌗 Auto-Docking:** After 2.5 seconds of inactivity the floating button glides into the right screen edge as a slim translucent tab, so it never covers site UI; it expands back instantly on hover.
- **🎬 Fullscreen Aware:** Automatically hides the floating control and unlocks 100% viewport width whenever video playback enters fullscreen mode.
- **📐 Hierarchy Configuration:** Per-domain custom widths fall back to a user-defined Global Default Width, and then to `1400px`.
- **🧩 Smart Site Adaptations:** Dedicated declarative layouts for complex SPAs:
  - **YouTube:** Centers the video feeds and the watch player, supports theater mode, and unlocks full 100% display in fullscreen.
  - **Gmail:** Keeps the navigation sidebar, compose button, and email card docked as a unified centered unit using modern `:has()` selectors.
  - **GitHub & Yandex:** Aligns headers, search bars, and repository views.
  - **Universal Fallback:** Modern `overflow-x: clip` container with positioning context for all regular websites.
- **🐛 Built-in Layout Diagnostics:** One-click automated DOM scanner that copies Markdown layout metrics to clipboard and directs you to pre-filled GitHub Issues.

---

## 🚀 Installation

1. Install a userscript manager extension:
   - [Tampermonkey](https://www.tampermonkey.net/) (Recommended for Chromium & Firefox)
   - [Violentmonkey](https://violentmonkey.github.io/)
2. Click the link below to install the script:
   - **[Install Wide Screen Content Limiter](https://raw.githubusercontent.com/goloveshko/ultrawide-page-limiter/main/ultrawide-page-limiter.user.js)**
3. Confirm installation in your userscript manager.

---

## 🎮 How to Use

### Floating Button (Bottom-Right Corner)

The floating widget provides immediate visual feedback and quick controls:

| Disabled (Full Width) | Enabled (Constrained) | Controls |
| :---: | :---: | :--- |
| <img src="assets/button-off.png" width="48" alt="Disabled" /> | <img src="assets/button-on.png" width="48" alt="Enabled" /> | • **Left Click:** Toggle ON / OFF<br>• **Right Click:** Change width (prompt) |

> **Auto-dock:** when idle for 2.5s the button slides into the right screen edge, leaving a small translucent tab. Hover over the tab to bring it back.

### Extension Menu Commands

Access quick actions directly from your userscript manager icon in the browser toolbar:

<p align="left">
  <img src="assets/menu.png" alt="Extension Menu" width="340" />
</p>

- 📏 **Enable / Disable width limit:** Toggles state for the current domain.
- ⚙️ **Site width (`...px`):** Set custom pixel width for the current site. Enter `0` or `reset` to fall back to the global default.
- 🌐 **Global default width (`...px`):** Set default width for all new sites.
- 👁️ **Floating button visibility:** Show or hide the bottom-right button globally.
- 🐛 **Report layout issue / Copy debug info:** Automatically inspects the page, copies clean layout diagnostics to clipboard, and prompts to open a GitHub Issue.

---

## 🐛 Reporting Broken Sites

Found a site that looks weird or misaligned when constrained?

1. Open the extension menu on the affected site.
2. Click **`🐛 Report layout issue / Copy debug info`**.
3. The script will automatically inspect unaltered DOM metrics and copy a formatted Markdown report to your clipboard.
4. Click **OK** on the prompt to open a new GitHub Issue, and simply paste (**Ctrl + V**)!

---

## 🛠️ Adding New Site Adaptations

Adding custom support for a website is straightforward thanks to the declarative `SITE_RULES` array:

```javascript
{
    name: 'ExampleSite',
    match: (domain) => matchesDomain(domain, 'example.com'),
    css: `
        .main-container,
        header {
            max-width: var(--uw-max-width) !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }
    `
}
```

Pull requests with new adaptations are always welcome!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👨‍💻 Author & Support

Developed with ❤️ by [Sergey Goloveshko](https://sergey.is-a.dev) — **AI & Systems Engineer**.

- **Portfolio**: [sergey.is-a.dev](https://sergey.is-a.dev)
- **Telegram Support**: [@itz2bot](https://t.me/itz2bot?start=ultrawide_page_readme)
- **Report an Issue**: [GitHub Issues](https://github.com/goloveshko/ultrawide-page-limiter/issues)