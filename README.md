# AI Terminal for VS Code
Run terminal commands using natural language.

AI Terminal converts plain English instructions into executable terminal commands and runs them using the appropriate tools for your operating system. Whether you're installing software, managing files, working with development tools, or performing routine system tasks, simply describe what you want to do and let AI handle the command generation.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/NeelParikh.ai-terminal?label=VS%20Code%20Marketplace&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=NeelParikh.ai-terminal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

AI Terminal brings AI-powered command execution directly into VS Code.

Instead of searching for terminal commands, memorizing package manager syntax, or switching between documentation pages, simply describe the task in plain English. AI Terminal understands your request, generates the appropriate command for your environment, and executes it directly from VS Code.

Example:

```text
install python
```

AI Terminal automatically determines the correct command based on your operating system.

---

## Features

### Natural Language Commands

Describe tasks in plain English and let AI generate the correct terminal command.

### Operating System Aware

Automatically adapts commands to your platform:

- **Windows** → `winget`
- **macOS** → `brew`
- **Linux** → `apt`

### Command History

View and manage previously executed AI-generated commands from the sidebar.

### Re-run Commands

Quickly execute any command from your history with a single click.

### Undo Actions

Generate reverse commands to help revert previously executed operations.

### Seamless VS Code Integration

- Dedicated sidebar interface
- Context menu support
- Native terminal execution
- Keyboard shortcuts for quick access

### Developer Productivity

Reduce time spent searching for commands and focus on getting work done.

---

## Getting Started

### 1. Install the Extension

Install **AI Terminal** from the VS Code Marketplace.

Search for **"AI Terminal"** in the Extensions panel (`Ctrl+Shift+X`) or install directly from:

https://marketplace.visualstudio.com/items?itemName=NeelParikh.ai-terminal

---

### 2. Create a Groq API Key

AI Terminal uses Groq for command generation.

1. Visit https://console.groq.com
2. Sign in or create an account
3. Navigate to **API Keys**
4. Select **Create API Key**
5. Copy the generated key

---

### 3. Start Using AI Terminal

1. Open the **AI Terminal** panel from the VS Code sidebar
2. Enter your Groq API key
3. Describe the task you want to perform
4. Click **Run**

Example:

```text
install git
```

AI Terminal will generate and execute the appropriate command for your operating system.

---

## Example Commands

| You Type | AI Executes |
|-----------|-------------|
| `install python` | `winget install Python.Python.3` |
| `install nodejs` | `winget install OpenJS.NodeJS` |
| `install pandas` | `pip install pandas` |
| `install react` | `npm install react` |
| `create folder called myapp` | `mkdir myapp` |
| `show all running processes` | `tasklist` |
| `what's my ip address` | `ipconfig` |
| `install git` | `winget install Git.Git` |

> Commands may vary depending on your operating system and environment.

---

## Supported Platforms

| Platform | Supported Tools |
|-----------|----------------|
| Windows | `winget`, `pip`, `npm` |
| macOS | `brew`, `pip3`, `npm` |
| Linux | `apt`, `pip3`, `npm` |

---

## Keyboard Shortcut

| Platform | Shortcut |
|-----------|----------|
| Windows / Linux | `Ctrl + Shift + ;` |
| macOS | `Cmd + Shift + ;` |

---

## Configuration

Navigate to:

**Settings → Extensions → AI Terminal**

| Setting | Description | Default |
|----------|-------------|----------|
| `aiTerminal.groqApiKey` | Groq API key used for command generation | `""` |
| `aiTerminal.autoRun` | Automatically execute commands without confirmation | `false` |

---

## Powered by Groq

AI Terminal uses Groq to translate natural language into executable terminal commands.

Benefits include:

- Fast response times
- Reliable inference performance
- Global availability
- Generous free-tier access for developers

To use AI Terminal, you'll need a Groq API key, which can be created for free through the Groq Console.

> API limits, pricing, and availability are subject to change based on Groq policies.

---

## Development

Run the extension locally:

```bash
git clone https://github.com/Neel0505/ai-terminal.git
cd ai-terminal
npm install
```

Open the project in VS Code and press:

```text
F5
```

to launch an Extension Development Host.

---

## Contributing

Contributions, feature requests, and bug reports are welcome.

To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

This project is licensed under the MIT License.

---

## Author

Created and maintained by **Neel Parikh**.
