# JSON String Viewer for VS Code

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/ultrawaver.json-string-viewer)](https://marketplace.visualstudio.com/items?itemName=ultrawaver.json-string-viewer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ultrawaver.json-string-viewer)](https://marketplace.visualstudio.com/items?itemName=ultrawaver.json-string-viewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/ultrawaver/json-string-viewer?style=social)](https://github.com/ultrawaver/json-string-viewer)

**Render JSON string values with real newlines.** Preview `\n`, `\t`, `\r` escape sequences as formatted, human-readable text in a side panel. Auto-activates on `.json` files — zero configuration needed.

> Tired of reading `\n` as literal text in JSON files? This extension fixes that.

## The Problem: JSON Strings Are Unreadable in VS Code

JSON files from **API responses**, **CRM exports**, **support ticket systems**, **issue trackers**, **log files**, and **webhook payloads** contain string fields with embedded escape sequences. VS Code shows `\n` as literal text, making email bodies, descriptions, and multi-line content **impossible to read**.

This is a [long-requested feature](https://github.com/microsoft/vscode/issues/89120) with no built-in solution.

**Before** — raw JSON in VS Code editor:
```json
{
  "subject": "Re: Order #12345",
  "body": "Dear Customer,\n\nThank you for contacting support.\nWe have received your request and will respond within 24 hours.\n\nOrder Details:\n- Item: Widget Pro\n- Qty: 3\n- Status: Processing\n\nBest regards,\nSupport Team"
}
```

**After** — JSON String Viewer side panel:

> **subject:** Re: Order #12345
>
> **body:**
>
> Dear Customer,
>
> Thank you for contacting support.
> We have received your request and will respond within 24 hours.
>
> Order Details:
> - Item: Widget Pro
> - Qty: 3
> - Status: Processing
>
> Best regards,
> Support Team

## Features

- **Full JSON document preview** — renders ALL fields (keys, strings, numbers, booleans, arrays, objects), not just selected strings
- **Escape sequence rendering** — `\n` `\t` `\r` `\\` `\"` displayed as real whitespace and characters
- **Auto-activates** on any `.json` file — no commands to run, no buttons to click
- **Side panel** — opens in a second column, doesn't obscure your JSON
- **Syntax coloring** — keys in blue, strings in orange, numbers in green, booleans in blue, null in italic
- **Nested structure** — objects/arrays indented with visual guides, deep nesting collapsible
- **Click-to-navigate** — click a string value in the editor, panel scrolls to it with highlight
- **Live updates** — edit the JSON, panel re-renders immediately
- **Lightweight** — zero dependencies, fast activation, minimal memory

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+Shift+X` (Extensions)
3. Search **"JSON String Viewer"**
4. Click **Install**

### From Command Line
```bash
code --install-extension ultrawaver.json-string-viewer
```

### From VSIX
Download the `.vsix` from [GitHub Releases](https://github.com/ultrawaver/json-string-viewer/releases), then:
```bash
code --install-extension json-string-viewer-*.vsix
```

## Usage

1. Open any `.json` file in VS Code
2. A viewer panel appears automatically on the right
3. Scroll through the formatted view — all strings show real line breaks
4. Click any string value in the editor to jump to it in the panel
5. Use **`JSON String Viewer: Toggle Panel`** command to show/hide

## Use Cases

| Scenario | Pain Point Solved |
|----------|-------------------|
| **API response debugging** | Long `description` / `message` fields |
| **CRM / helpdesk exports** | Email `body` fields with `\n` everywhere |
| **Support ticket systems** | Customer conversation threads as JSON |
| **Issue tracker exports** | Comment bodies, descriptions |
| **Log file JSON** | Stack traces, multi-line log messages |
| **CRM data exports** | Notes, email content, activity logs |
| **i18n / localization files** | Translation strings with `\n` formatting |
| **OpenAI / LLM API responses** | `content` fields with formatted text |
| **Webhook payloads** | Event data with embedded messages |
| **Test fixtures** | Large JSON test data with readable strings |

## Commands

| Command | Description |
|---------|-------------|
| `JSON String Viewer: Toggle Panel` | Show or hide the viewer panel |

## FAQ

### Does it modify my JSON file?
No. The extension is **read-only** — it only renders a preview. Your JSON file is never modified.

### Does it work with large JSON files?
Yes. It parses the full file and renders all fields. For very large files (10MB+), the initial render may take a moment.

### Can I use it with JSONL / JSON Lines?
Currently it supports standard `.json` files. JSONL support is planned.

### Does it support JSON with comments (JSONC)?
It activates on VS Code's `json` language mode. JSONC files should work if VS Code recognizes them as JSON.

### Why not just use a JSON formatter?
Formatters (like Prettier) re-indent the JSON but **don't render escape sequences**. `\n` remains as literal `\n` text. This extension actually shows newlines as line breaks.

## How It Compares

| Feature | JSON String Viewer | Built-in JSON | Prettier | JSON Crack |
|---------|-------------------|---------------|----------|------------|
| Render `\n` as newlines | Yes | No | No | No |
| Show all fields | Yes | Yes | Yes | Yes |
| Auto-activate | Yes | N/A | No | No |
| Zero config | Yes | N/A | No | No |
| Side panel preview | Yes | No | No | Yes |
| Click-to-navigate | Yes | No | No | No |
| Lightweight (no deps) | Yes | N/A | No | No |

## Requirements

- VS Code 1.85.0 or later

## Contributing

Issues and PRs welcome at [GitHub](https://github.com/ultrawaver/json-string-viewer).

If this extension saved you time, please consider:
- [Star the repo](https://github.com/ultrawaver/json-string-viewer) on GitHub
- [Rate it](https://marketplace.visualstudio.com/items?itemName=ultrawaver.json-string-viewer&ssr=false#review-details) on VS Code Marketplace
- Share it with colleagues who work with JSON exports

## License

[MIT](LICENSE) - by [ultrawaver](https://github.com/ultrawaver)
