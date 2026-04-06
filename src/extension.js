const vscode = require("vscode");
const os = require("os");
const crypto = require("crypto");

function getSystemContext() {
  const platform = os.platform();
  if (platform === "win32") return { os: "Windows", shell: "PowerShell", packageManagers: "winget (preferred), pip, npm", notes: "Use winget for apps, pip for Python packages, npm for Node. CRITICAL: PowerShell does NOT support &&. Use semicolons (;) to chain commands. Example: npm create react-app myapp ; cd myapp ; npm install", separator: ";" };
  if (platform === "darwin") return { os: "macOS", shell: "zsh", packageManagers: "brew, pip3, npm", notes: "Use brew for apps, pip3 for Python, npm for Node." };
  return { os: "Linux", shell: "bash", packageManagers: "apt, pip3, npm", notes: "Use apt for system packages, pip3 for Python, npm for Node." };
}

async function callGroq(systemPrompt, userMessage, apiKey) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile", max_tokens: 200, temperature: 0.1,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) { const e = await response.json(); throw new Error(e.error?.message || "Groq API error"); }
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "ERROR: No response";
}

async function translateToCommand(input, apiKey) {
  const sys = getSystemContext();
  return callGroq(
    `Convert natural language to exact shell commands for ${sys.os}.
Package managers: ${sys.packageManagers}. ${sys.notes}
Rules: Reply with ONLY the command. No explanation, no markdown, no backticks. On Windows/PowerShell use semicolons (;) to chain commands NOT &&. On Mac/Linux use &&. If unsafe reply ERROR: <reason>.
Examples: install python → winget install Python.Python.3 | install react → npm install react | create folder myapp → mkdir myapp | install git → winget install Git.Git`,
    input, apiKey
  );
}

async function translateToUndo(command, apiKey) {
  const sys = getSystemContext();
  return callGroq(
    `Given a shell command run on ${sys.os}, return the exact UNDO command.
Reply with ONLY the undo command. No explanation. If cannot be undone reply: ERROR: Cannot undo this command.
Examples: winget install Git.Git → winget uninstall Git.Git | pip install pandas → pip uninstall -y pandas | mkdir myapp → rmdir myapp | npm install react → npm uninstall react`,
    command, apiKey
  );
}

class AiTerminalPanel {
  constructor(context) {
    this.context = context;
    this._view = null;
    this.history = context.globalState.get("aiTerminal.history", []);
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.getHtml();

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case "ready":       this.pushHistory(); break;
        case "run":         await this.handleRun(msg.input); break;
        case "undo":        await this.handleUndo(msg.command); break;
        case "rerun":       await this.handleRun(msg.input); break;
        case "setKey":      await this.handleSetKey(msg.key); break;
        case "clearHistory": this.history = []; this.context.globalState.update("aiTerminal.history", []); this.pushHistory(); break;
      }
    });

    webviewView.onDidChangeVisibility(() => { if (webviewView.visible) this.pushHistory(); });
  }

  send(msg) { if (this._view) this._view.webview.postMessage(msg); }
  pushHistory() { this.send({ type: "history", items: this.history }); }

  async handleSetKey(key) {
    await vscode.workspace.getConfiguration("aiTerminal").update("groqApiKey", key.trim(), vscode.ConfigurationTarget.Global);
    this.send({ type: "keySet" });
  }

  getApiKey() { return vscode.workspace.getConfiguration("aiTerminal").get("groqApiKey", ""); }

  async handleRun(userInput) {
    const apiKey = this.getApiKey();
    if (!apiKey) { this.send({ type: "needKey" }); return; }

    this.send({ type: "status", cls: "loading", text: `⏳ Translating "${userInput}"...` });

    try {
      const command = await translateToCommand(userInput, apiKey);
      if (command.startsWith("ERROR:")) { this.send({ type: "status", cls: "error", text: "❌ " + command }); return; }

      const entry = { id: Date.now(), input: userInput, command, timestamp: new Date().toLocaleTimeString() };
      this.history.unshift(entry);
      if (this.history.length > 20) this.history.pop();
      this.context.globalState.update("aiTerminal.history", this.history);
      this.send({ type: "status", cls: "success", text: "💡 " + command });
      this.pushHistory();

      let terminal = vscode.window.activeTerminal || vscode.window.createTerminal("AI Terminal");
      terminal.show();

      if (vscode.workspace.getConfiguration("aiTerminal").get("autoRun", false)) {
        terminal.sendText(command);
      } else {
        const choice = await vscode.window.showInformationMessage(`🤖 Run this command?\n\n${command}`, { modal: true }, "▶ Run", "📋 Copy");
        if (choice === "▶ Run") terminal.sendText(command);
        else if (choice === "📋 Copy") await vscode.env.clipboard.writeText(command);
      }
    } catch (err) { this.send({ type: "status", cls: "error", text: "❌ " + err.message }); }
  }

  async handleUndo(command) {
    const apiKey = this.getApiKey();
    if (!apiKey) return;
    this.send({ type: "status", cls: "loading", text: `⏳ Finding undo for: ${command}` });
    try {
      const undoCmd = await translateToUndo(command, apiKey);
      if (undoCmd.startsWith("ERROR:")) { this.send({ type: "status", cls: "error", text: "❌ " + undoCmd }); return; }
      this.send({ type: "status", cls: "success", text: "💡 " + undoCmd });
      const choice = await vscode.window.showInformationMessage(`🔁 Undo with:\n\n${undoCmd}`, { modal: true }, "▶ Run Undo", "📋 Copy");
      if (choice === "▶ Run Undo") {
        let terminal = vscode.window.activeTerminal || vscode.window.createTerminal("AI Terminal");
        terminal.show(); terminal.sendText(undoCmd);
      } else if (choice === "📋 Copy") await vscode.env.clipboard.writeText(undoCmd);
    } catch (err) { this.send({ type: "status", cls: "error", text: "❌ " + err.message }); }
  }

  async runFromQuickInput() {
    let apiKey = this.getApiKey();
    if (!apiKey) {
      apiKey = await vscode.window.showInputBox({ prompt: "Enter your Groq API key (free at console.groq.com)", password: true, placeHolder: "gsk_...", ignoreFocusOut: true });
      if (!apiKey) return;
      await vscode.workspace.getConfiguration("aiTerminal").update("groqApiKey", apiKey, vscode.ConfigurationTarget.Global);
    }
    const userInput = await vscode.window.showInputBox({ prompt: "What do you want to do?", placeHolder: 'e.g. "install react", "create folder myapp"', ignoreFocusOut: true });
    if (!userInput?.trim()) return;
    await vscode.commands.executeCommand("aiTerminal.panel.focus");
    await this.handleRun(userInput);
  }

  getHtml() {
    // No inline onclick — use event delegation instead (fixes CSP issues in VS Code webview)
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--vscode-font-family); font-size: 13px; color: var(--vscode-foreground); padding: 10px; display: flex; flex-direction: column; gap: 10px; }
#keySection { display: none; flex-direction: column; gap: 6px; padding: 10px; background: var(--vscode-inputValidation-warningBackground, #332b00); border: 1px solid #B89500; border-radius: 6px; }
#keySection.show { display: flex; }
#keySection p { font-size: 11px; opacity: 0.8; }
input { width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border, #555); border-radius: 4px; padding: 6px 8px; font-size: 12px; font-family: inherit; outline: none; }
input:focus { border-color: var(--vscode-focusBorder); }
input::placeholder { opacity: 0.45; }
.label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; opacity: 0.5; margin-bottom: 4px; }
.row { display: flex; gap: 6px; }
button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px; font-family: inherit; white-space: nowrap; }
button:hover { opacity: 0.85; }
.btn-sm { font-size: 10px; padding: 3px 8px; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
#status { font-size: 11px; padding: 6px 8px; border-radius: 4px; display: none; word-break: break-all; }
#status.show { display: block; }
#status.loading { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }
#status.error { background: var(--vscode-inputValidation-errorBackground); color: var(--vscode-errorForeground); }
#status.success { font-family: monospace; background: #23d18b18; border: 1px solid #23d18b44; color: #23d18b; }
.section-header { display: flex; justify-content: space-between; align-items: center; }
#history { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
.history-item { background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border, #ffffff15); border-radius: 6px; padding: 8px 10px; display: flex; flex-direction: column; gap: 5px; }
.h-input { font-size: 12px; font-weight: 600; }
.h-cmd { font-family: monospace; font-size: 11px; opacity: 0.6; word-break: break-all; }
.h-footer { display: flex; justify-content: space-between; align-items: center; }
.h-time { font-size: 10px; opacity: 0.35; }
.h-actions { display: flex; gap: 4px; }
#empty { font-size: 12px; opacity: 0.4; text-align: center; padding: 20px 0; }
</style>
</head>
<body>

<div id="keySection">
  <p>⚠️ No Groq API key. Get one free at <strong>console.groq.com</strong></p>
  <input id="keyInput" type="password" placeholder="Paste gsk_... key here" />
  <button id="saveKeyBtn">Save Key</button>
</div>

<div>
  <div class="label">What do you want to do?</div>
  <div class="row">
    <input id="userInput" type="text" placeholder='e.g. "install react"' />
    <button id="runBtn">▶ Run</button>
  </div>
</div>

<div id="status"></div>

<div>
  <div class="section-header">
    <div class="label">History</div>
    <button class="btn-sm" id="clearBtn">Clear</button>
  </div>
  <div id="history"><div id="empty">No commands yet!</div></div>
</div>

<script>
  const vscode = acquireVsCodeApi();

  // ── Wire up buttons with addEventListener (no inline onclick) ──
  document.getElementById('runBtn').addEventListener('click', runCommand);
  document.getElementById('saveKeyBtn').addEventListener('click', saveKey);
  document.getElementById('clearBtn').addEventListener('click', () => vscode.postMessage({ type: 'clearHistory' }));
  document.getElementById('userInput').addEventListener('keydown', e => { if (e.key === 'Enter') runCommand(); });

  // Event delegation for dynamically created history buttons
  document.getElementById('history').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.rerun) { showStatus('⏳ Translating "' + btn.dataset.rerun + '"...', 'loading'); vscode.postMessage({ type: 'rerun', input: btn.dataset.rerun }); }
    if (btn.dataset.undo)  { showStatus('⏳ Finding undo...', 'loading'); vscode.postMessage({ type: 'undo', command: btn.dataset.undo }); }
  });

  function runCommand() {
    const input = document.getElementById('userInput').value.trim();
    if (!input) return;
    showStatus('⏳ Translating "' + input + '"...', 'loading');
    vscode.postMessage({ type: 'run', input });
    document.getElementById('userInput').value = '';
  }

  function saveKey() {
    const key = document.getElementById('keyInput').value.trim();
    if (!key) return;
    vscode.postMessage({ type: 'setKey', key });
  }

  function showStatus(text, cls) {
    const el = document.getElementById('status');
    el.textContent = text;
    el.className = 'show ' + cls;
    if (cls !== 'loading') setTimeout(() => el.classList.remove('show'), 6000);
  }

  window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type === 'needKey') document.getElementById('keySection').classList.add('show');
    if (msg.type === 'keySet') { document.getElementById('keySection').classList.remove('show'); showStatus('✅ API key saved!', 'success'); }
    if (msg.type === 'status') showStatus(msg.text, msg.cls);
    if (msg.type === 'history') renderHistory(msg.items);
  });

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function renderHistory(items) {
    const el = document.getElementById('history');
    if (!items || !items.length) { el.innerHTML = '<div id="empty">No commands yet!</div>'; return; }
    el.innerHTML = items.map(item => \`
      <div class="history-item">
        <div class="h-input">💬 \${esc(item.input)}</div>
        <div class="h-cmd">$ \${esc(item.command)}</div>
        <div class="h-footer">
          <span class="h-time">\${esc(item.timestamp)}</span>
          <div class="h-actions">
            <button class="btn-sm" data-rerun="\${esc(item.input)}">↺ Re-run</button>
            <button class="btn-sm" data-undo="\${esc(item.command)}">⟲ Undo</button>
          </div>
        </div>
      </div>
    \`).join('');
  }

  vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
  }
}

function activate(context) {
  const provider = new AiTerminalPanel(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("aiTerminal.panel", provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
  context.subscriptions.push(vscode.commands.registerCommand("ai-terminal.run", () => provider.runFromQuickInput()));
  context.subscriptions.push(vscode.commands.registerCommand("ai-terminal.openPanel", () => vscode.commands.executeCommand("aiTerminal.panel.focus")));
}

function deactivate() {}
module.exports = { activate, deactivate };
