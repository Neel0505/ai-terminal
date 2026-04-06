# 🤖 AI Terminal

> Type plain English. AI runs the terminal command for you.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/NeelParikh.ai-terminal?label=VS%20Code%20Marketplace&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=NeelParikh.ai-terminal)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## What is AI Terminal?

AI Terminal is a VS Code extension that lets you control your terminal using plain English — no need to memorize commands.

Instead of googling "how to install python on windows", just type **"install python"** and it runs the right command for your operating system automatically.

---

## ✨ Features

- 🧠 **Natural language to terminal commands** — describe what you want, AI figures out the exact command
- 🖥️ **OS aware** — automatically uses the right package manager for Windows (`winget`), macOS (`brew`), or Linux (`apt`)
- 📋 **Command history** — see all your past AI commands in the sidebar
- ↺ **Re-run** — instantly re-run any previous command
- ⟲ **Undo** — AI figures out how to reverse any command you've run
- ⚡ **Right-click menu** — trigger AI Terminal from anywhere in VS Code
- ⌨️ **Keyboard shortcut** — `Ctrl+Shift+;` (or `Cmd+Shift+;` on Mac)

---

## 🚀 Getting Started

### 1. Install the extension
Search **"AI Terminal"** in the VS Code Extensions panel (`Ctrl+Shift+X`) or install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=NeelParikh.ai-terminal).

### 2. Get a free Groq API key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up free (Google login works)
3. Click **API Keys** → **Create API Key**
4. Copy the key

### 3. Start using it
- Click the **AI Terminal icon** in the left sidebar
- Paste your Groq API key when prompted (saved automatically)
- Type what you want to do and hit **▶ Run**

---

## 💡 Examples

| You type | AI runs |
|---|---|
| `install python` | `winget install Python.Python.3` |
| `install nodejs` | `winget install OpenJS.NodeJS` |
| `install pandas` | `pip install pandas` |
| `install react` | `npm install react` |
| `create folder called myapp` | `mkdir myapp` |
| `show all running processes` | `tasklist` |
| `whats my ip address` | `ipconfig` |
| `install git` | `winget install Git.Git` |

---

## 🖥️ OS Support

| OS | Package Manager |
|---|---|
| Windows | `winget`, `pip`, `npm` |
| macOS | `brew`, `pip3`, `npm` |
| Linux | `apt`, `pip3`, `npm` |

---

## ⚙️ Settings

Go to **Settings → Extensions → AI Terminal**:

| Setting | Description | Default |
|---|---|---|
| `aiTerminal.groqApiKey` | Your Groq API key | `""` |
| `aiTerminal.autoRun` | Skip confirmation dialog and run immediately | `false` |

---

## 🔑 Why Groq?

AI Terminal uses [Groq](https://groq.com) as its AI backend because:
- ✅ **Free tier** — 14,400 requests/day at no cost
- ✅ **Fast** — runs on custom hardware, responses in under a second
- ✅ **Works globally** — no regional restrictions

---

## 🛠️ Contributing

Contributions are welcome! Here's how to run it locally:

```bash
git clone https://github.com/Neel0505/ai-terminal.git
cd ai-terminal
npm install
```

Then open in VS Code and press **F5** to launch the extension in development mode.

---

## 📄 License

MIT — feel free to use, modify, and share.

---

Made by [Neel Parikh](https://github.com/Neel0505)
