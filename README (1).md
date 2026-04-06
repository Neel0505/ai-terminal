# 🤖 AI Terminal

Type commands in plain English — AI translates and runs them for you.

## Examples

| You type | AI runs |
|---|---|
| `install python` | `winget install Python.Python.3` |
| `download nodejs` | `winget install OpenJS.NodeJS` |
| `install pandas` | `pip install pandas` |
| `create folder called myapp` | `mkdir myapp` |
| `show all running processes` | `tasklist` |
| `whats my ip address` | `ipconfig` |
| `install git` | `winget install Git.Git` |

Works on **Windows**, **macOS**, and **Linux** — auto-detects your OS and uses the right package manager.

---

## Option 1: VS Code Extension

### Install (Development Mode)
1. Clone / download this folder
2. Open it in VS Code
3. Run `npm install` in the terminal
4. Press **F5** to launch the Extension Development Host
5. In the new window, press `Ctrl+Shift+;` (or `Cmd+Shift+;` on Mac)

### Publish to Marketplace
```bash
npm install -g vsce
npm run package      # creates a .vsix file
# Then: Extensions → Install from VSIX
```

### Configuration
Go to **Settings → Extensions → AI Terminal**:
- `aiTerminal.anthropicApiKey` — Your Anthropic API key
- `aiTerminal.autoRun` — Skip confirmation and run immediately (careful!)
- `aiTerminal.shell` — Force a specific shell

---

## Option 2: Standalone CLI Script

### Setup
```bash
npm install @anthropic-ai/sdk
```

### Run (Interactive Mode)
```bash
node ai-terminal-cli.js
```

### Run (One-shot Mode)
```bash
node ai-terminal-cli.js "install python"
node ai-terminal-cli.js "create a folder called projects"
```

### Make it a global command (optional)
```bash
# Add to your PATH or create an alias:
# Windows PowerShell profile:
function ai { node C:\path\to\ai-terminal-cli.js $args }

# Mac/Linux .bashrc or .zshrc:
alias ai='node /path/to/ai-terminal-cli.js'
```

Then just type: `ai install python` from anywhere!

---

## Getting an API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Create an API key under **API Keys**
4. Paste it when the tool asks (it's saved locally)

---

## How It Works
1. You type natural language
2. Claude AI reads your OS/shell and translates to the exact command
3. It shows you the command and asks for confirmation (unless autoRun is on)
4. The command runs in your terminal
