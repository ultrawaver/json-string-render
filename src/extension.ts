import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined;
let enabled = true;

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('json-string-viewer.toggle', () => {
            if (panel) {
                panel.dispose();
                panel = undefined;
                enabled = false;
            } else {
                enabled = true;
                createPanel();
                renderFullPreview(vscode.window.activeTextEditor);
            }
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (!enabled) { return; }
            if (editor && editor.document.languageId === 'json') {
                if (!panel) { createPanel(); }
                renderFullPreview(editor);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (!enabled || !panel) { return; }
            const editor = vscode.window.activeTextEditor;
            if (editor && e.document === editor.document && e.document.languageId === 'json') {
                renderFullPreview(editor);
            }
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection((e) => {
            if (!enabled || !panel) { return; }
            if (e.textEditor.document.languageId === 'json') {
                scrollToPath(e.textEditor);
            }
        })
    );

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'json') {
        createPanel();
        renderFullPreview(activeEditor);
    }
}

function createPanel() {
    if (panel) { return; }
    panel = vscode.window.createWebviewPanel(
        'jsonStringViewer',
        'JSON String Viewer',
        { viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
        { enableScripts: true }
    );
    panel.onDidDispose(() => { panel = undefined; });
}

function renderFullPreview(editor: vscode.TextEditor | undefined) {
    if (!editor || !panel) { return; }

    const text = editor.document.getText();
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        panel.webview.html = wrapPage('Invalid JSON', '<p class="error">Cannot parse JSON file</p>');
        return;
    }

    const basename = editor.document.fileName.split('/').pop() || 'JSON';
    const bodyHtml = renderValue(parsed, '', 0);
    panel.webview.html = wrapPage(basename, bodyHtml);
}

/** Recursively render any JSON value to HTML */
function renderValue(val: unknown, path: string, depth: number): string {
    if (val === null) {
        return `<span class="v-null">null</span>`;
    }
    if (typeof val === 'boolean') {
        return `<span class="v-bool">${val}</span>`;
    }
    if (typeof val === 'number') {
        return `<span class="v-num">${val}</span>`;
    }
    if (typeof val === 'string') {
        return renderString(val);
    }
    if (Array.isArray(val)) {
        return renderArray(val, path, depth);
    }
    if (typeof val === 'object') {
        return renderObject(val as Record<string, unknown>, path, depth);
    }
    return esc(String(val));
}

function renderString(s: string): string {
    // Multi-line or long strings get a block display
    if (s.includes('\n') || s.includes('\r') || s.length > 120) {
        return `<div class="v-str-block">${esc(s)}</div>`;
    }
    return `<span class="v-str">${esc(s)}</span>`;
}

function renderObject(obj: Record<string, unknown>, parentPath: string, depth: number): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) {
        return `<span class="v-empty">{}</span>`;
    }

    const rows = entries.map(([key, val]) => {
        const childPath = parentPath ? `${parentPath}.${key}` : key;
        const valHtml = renderValue(val, childPath, depth + 1);
        return `<div class="row" data-path="${esc(childPath)}">
  <span class="key">${esc(key)}</span><span class="colon">:</span> ${valHtml}
</div>`;
    });

    // Top-level or shallow: always expanded. Deeper arrays of objects: collapsible.
    if (depth >= 2) {
        const summary = `{${entries.length} fields}`;
        return `<details open><summary class="obj-summary">${esc(summary)}</summary>
<div class="obj-body">${rows.join('\n')}</div></details>`;
    }

    return `<div class="obj-body">${rows.join('\n')}</div>`;
}

function renderArray(arr: unknown[], parentPath: string, depth: number): string {
    if (arr.length === 0) {
        return `<span class="v-empty">[]</span>`;
    }

    // Array of primitives: compact
    if (arr.every(v => typeof v !== 'object' || v === null) && arr.length <= 20) {
        const items = arr.map((v, i) => renderValue(v, `${parentPath}[${i}]`, depth + 1));
        return `<span class="v-arr-inline">[${items.join(', ')}]</span>`;
    }

    // Array of objects/mixed: render each element as a section
    const items = arr.map((v, i) => {
        const childPath = `${parentPath}[${i}]`;
        const valHtml = renderValue(v, childPath, depth + 1);
        return `<div class="arr-item" data-path="${esc(childPath)}">
  <span class="arr-idx">[${i}]</span>${valHtml}
</div>`;
    });

    return `<div class="arr-body">${items.join('\n')}</div>`;
}

// --- scroll-to-cursor support (reuse from v0.0.2) ---

function scrollToPath(editor: vscode.TextEditor) {
    if (!panel) { return; }
    const text = editor.document.getText();
    const offset = editor.document.offsetAt(editor.selection.active);
    const path = findPathAtOffset(text, offset);
    if (path) {
        panel.webview.postMessage({ command: 'scrollTo', path });
    }
}

function findPathAtOffset(text: string, offset: number): string | null {
    let start = -1;
    for (let i = offset - 1; i >= 0; i--) {
        if (text[i] === '"' && !isEscaped(text, i)) { start = i; break; }
    }
    if (start < 0) { return null; }

    let end = -1;
    for (let i = Math.max(start + 1, offset); i < text.length; i++) {
        if (text[i] === '"' && !isEscaped(text, i)) { end = i; break; }
    }
    if (end < 0) { return null; }

    // Skip keys (followed by ':')
    let a = end + 1;
    while (a < text.length && /\s/.test(text[a])) { a++; }
    if (a < text.length && text[a] === ':') { return null; }

    return findKeyPath(text, start);
}

function isEscaped(text: string, pos: number): boolean {
    let n = 0;
    for (let i = pos - 1; i >= 0 && text[i] === '\\'; i--) { n++; }
    return n % 2 === 1;
}

function findKeyPath(text: string, stringStart: number): string {
    let i = stringStart - 1;
    while (i >= 0 && /\s/.test(text[i])) { i--; }
    if (i < 0 || text[i] !== ':') { return ''; }
    i--;
    while (i >= 0 && /\s/.test(text[i])) { i--; }
    if (i < 0 || text[i] !== '"') { return ''; }

    const keyEnd = i;
    let keyStart = -1;
    for (let j = keyEnd - 1; j >= 0; j--) {
        if (text[j] === '"' && !isEscaped(text, j)) { keyStart = j; break; }
    }
    if (keyStart < 0) { return ''; }

    const immediateKey = text.substring(keyStart + 1, keyEnd);
    const pathParts: string[] = [immediateKey];
    let depth = 0;
    let pos = keyStart - 1;

    while (pos >= 0) {
        const ch = text[pos];
        if (ch === '"' && !isEscaped(text, pos)) {
            pos--;
            while (pos >= 0) { if (text[pos] === '"' && !isEscaped(text, pos)) { break; } pos--; }
            pos--;
            continue;
        }
        if (ch === '}' || ch === ']') { depth++; pos--; continue; }
        if (ch === '{') {
            if (depth > 0) { depth--; pos--; continue; }
            let k = pos - 1;
            while (k >= 0 && /\s/.test(text[k])) { k--; }
            if (k >= 0 && text[k] === ':') {
                k--;
                while (k >= 0 && /\s/.test(text[k])) { k--; }
                if (k >= 0 && text[k] === '"') {
                    const pe = k;
                    let ps = -1;
                    for (let j = pe - 1; j >= 0; j--) { if (text[j] === '"' && !isEscaped(text, j)) { ps = j; break; } }
                    if (ps >= 0) { pathParts.unshift(text.substring(ps + 1, pe)); pos = ps - 1; continue; }
                }
            }
            pos--;
            continue;
        }
        if (ch === '[') {
            if (depth > 0) { depth--; pos--; continue; }
            const as = pos;
            const idx = countArrayIndex(text, as, keyStart);
            pathParts.unshift(`[${idx}]`);
            let k = as - 1;
            while (k >= 0 && /\s/.test(text[k])) { k--; }
            if (k >= 0 && text[k] === ':') {
                k--;
                while (k >= 0 && /\s/.test(text[k])) { k--; }
                if (k >= 0 && text[k] === '"') {
                    const pe = k;
                    let ps = -1;
                    for (let j = pe - 1; j >= 0; j--) { if (text[j] === '"' && !isEscaped(text, j)) { ps = j; break; } }
                    if (ps >= 0) { pathParts.unshift(text.substring(ps + 1, pe)); pos = ps - 1; continue; }
                }
            }
            pos--;
            continue;
        }
        pos--;
    }

    return pathParts.reduce((acc, part) => {
        if (part.startsWith('[')) { return acc + part; }
        return acc ? acc + '.' + part : part;
    }, '');
}

function countArrayIndex(text: string, arrayOpenPos: number, targetPos: number): number {
    let depth = 0, index = 0, inStr = false;
    for (let i = arrayOpenPos + 1; i < targetPos; i++) {
        const ch = text[i];
        if (inStr) { if (ch === '"' && !isEscaped(text, i)) { inStr = false; } continue; }
        if (ch === '"' && !isEscaped(text, i)) { inStr = true; continue; }
        if (ch === '{' || ch === '[') { depth++; continue; }
        if (ch === '}' || ch === ']') { depth--; continue; }
        if (ch === ',' && depth === 0) { index++; }
    }
    return index;
}

// --- HTML generation ---

function esc(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function wrapPage(title: string, bodyContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
:root {
    --bg: var(--vscode-editor-background, #1e1e1e);
    --fg: var(--vscode-editor-foreground, #ccc);
    --dim: var(--vscode-descriptionForeground, #888);
    --border: var(--vscode-panel-border, #333);
    --block-bg: var(--vscode-textBlockQuote-background, #252526);
    --accent: var(--vscode-textBlockQuote-border, #007acc);
    --focus: var(--vscode-focusBorder, #007acc);
    --badge: var(--vscode-badge-background, #333);
    --mono: var(--vscode-editor-font-family, 'Consolas', 'Courier New', monospace);
}
* { box-sizing: border-box; }
body {
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
    font-size: 13px;
    padding: 0 16px 60px 16px;
    color: var(--fg);
    background: var(--bg);
    line-height: 1.6;
}
.page-header {
    position: sticky; top: 0; z-index: 10;
    background: var(--bg);
    padding: 10px 0 6px 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 12px;
}
.page-header h2 { margin: 0; font-size: 14px; font-weight: 600; }
.error { color: #f44; }

/* key-value rows */
.row {
    padding: 2px 0 2px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.2s;
}
.row.highlight {
    background: rgba(0,122,204,0.15);
    border-radius: 3px;
}
.key {
    color: #9cdcfe;
    font-family: var(--mono);
    font-weight: 600;
    font-size: 12px;
}
.colon { color: var(--dim); }

/* values */
.v-str { color: #ce9178; }
.v-str-block {
    display: block;
    white-space: pre-wrap;
    word-wrap: break-word;
    color: #ce9178;
    background: var(--block-bg);
    border-left: 3px solid var(--accent);
    padding: 8px 12px;
    margin: 4px 0 4px 0;
    border-radius: 3px;
    max-height: 500px;
    overflow-y: auto;
    font-size: 13px;
    line-height: 1.5;
}
.v-num { color: #b5cea8; }
.v-bool { color: #569cd6; }
.v-null { color: #569cd6; font-style: italic; }
.v-empty { color: var(--dim); }
.v-arr-inline { color: var(--fg); }

/* arrays */
.arr-body {
    margin-left: 16px;
    border-left: 2px solid var(--border);
    padding-left: 12px;
}
.arr-item { margin: 6px 0; }
.arr-idx {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--dim);
    margin-right: 6px;
    display: inline-block;
    min-width: 30px;
}

/* nested objects */
.obj-body {
    margin-left: 16px;
    border-left: 2px solid var(--border);
    padding-left: 12px;
}
details > summary.obj-summary {
    cursor: pointer;
    color: var(--dim);
    font-size: 12px;
    user-select: none;
}
</style>
</head>
<body>
<div class="page-header"><h2>${esc(title)}</h2></div>
${bodyContent}
<script>
    const vscode = acquireVsCodeApi();
    let lastHL = null;
    window.addEventListener('message', (ev) => {
        const m = ev.data;
        if (m.command === 'scrollTo' && m.path) {
            if (lastHL) { lastHL.classList.remove('highlight'); lastHL = null; }
            const el = document.querySelector('[data-path="' + CSS.escape(m.path) + '"]');
            if (el) {
                el.classList.add('highlight');
                lastHL = el;
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });
</script>
</body>
</html>`;
}

export function deactivate() {
    if (panel) { panel.dispose(); panel = undefined; }
}
