#!/usr/bin/env node
// AI Terminal - Standalone CLI
// Usage: node ai-terminal.js "install python"
//    or: node ai-terminal.js   (interactive mode)
//
// Setup: set ANTHROPIC_API_KEY environment variable, or it will prompt you.
// Install deps: npm install @anthropic-ai/sdk readline-sync

const Anthropic = require("@anthropic-ai/sdk").default;
const { execSync, spawn } = require("child_process");
const readline = require("readline");
const os = require("os");
const fs = require("fs");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────

const CONFIG_FILE = path.join(os.homedir(), ".ai-terminal-config.json");

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch {}
  return {};
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ─── System Detection ─────────────────────────────────────────────────────────

function getSystemContext() {
  const platform = os.platform();
  if (platform === "win32") {
    return {
      os: "Windows",
      shell: "PowerShell",
      packageManagers: "winget (preferred), choco, scoop, pip, npm",
      notes: "Use winget for apps, pip for Python packages, npm for Node packages.",
      runCommand: (cmd) => ["powershell", ["-Command", cmd]],
    };
  } else if (platform === "darwin") {
    return {
      os: "macOS",
      shell: "zsh",
      packageManagers: "brew, pip3, npm, gem",
      notes: "Use brew for apps, pip3 for Python, npm for Node.",
      runCommand: (cmd) => ["zsh", ["-c", cmd]],
    };
  } else {
    return {
      os: "Linux",
      shell: "bash",
      packageManagers: "apt, pip3, npm, snap",
      notes: "Use apt for system packages, pip3 for Python, npm for Node.",
      runCommand: (cmd) => ["bash", ["-c", cmd]],
    };
  }
}

// ─── AI Translation ───────────────────────────────────────────────────────────

async function translateToCommand(userInput, apiKey) {
  const client = new Anthropic({ apiKey });
  const sys = getSystemContext();

  const systemPrompt = `You are an expert terminal assistant. Your ONLY job is to convert natural language instructions into exact shell commands.

System info:
- OS: ${sys.os}
- Shell: ${sys.shell}
- Package managers available: ${sys.packageManagers}
- Notes: ${sys.notes}

Rules:
1. Reply with ONLY the command(s) — no explanation, no markdown, no backticks.
2. Multiple commands: separate with && or newlines.
3. Pick the most sensible defaults.
4. If the request is unsafe or not convertible, reply: ERROR: <reason>
5. Never run destructive commands like rm -rf / or format drives.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userInput }],
  });

  return response.content[0].text.trim();
}

// ─── Command Runner ───────────────────────────────────────────────────────────

function runCommand(command) {
  const sys = getSystemContext();
  const [prog, args] = sys.runCommand(command);
  return new Promise((resolve) => {
    const proc = spawn(prog, args, { stdio: "inherit", shell: true });
    proc.on("close", (code) => resolve(code));
  });
}

function prompt(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const config = loadConfig();
  let apiKey = process.env.ANTHROPIC_API_KEY || config.apiKey;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // First-time API key setup
  if (!apiKey) {
    console.log("\n🤖 AI Terminal Setup");
    console.log("Get your API key at: https://console.anthropic.com\n");
    apiKey = await prompt(rl, "Enter your Anthropic API key: ");
    apiKey = apiKey.trim();
    if (!apiKey) { rl.close(); process.exit(1); }
    config.apiKey = apiKey;
    saveConfig(config);
    console.log("✅ API key saved to ~/.ai-terminal-config.json\n");
  }

  // One-shot mode: node ai-terminal.js "install python"
  const oneShot = process.argv.slice(2).join(" ").trim();
  if (oneShot) {
    await handleInput(oneShot, apiKey, rl, true);
    rl.close();
    return;
  }

  // Interactive mode
  console.log("\n🤖 AI Terminal — type in plain English, press Enter");
  console.log('   Type "exit" or Ctrl+C to quit\n');

  const loop = async () => {
    const input = await prompt(rl, "▶ ");
    if (!input || input.toLowerCase() === "exit") {
      console.log("Bye!");
      rl.close();
      return;
    }
    await handleInput(input, apiKey, rl, false);
    loop();
  };

  loop();
}

async function handleInput(input, apiKey, rl, autoRun) {
  try {
    process.stdout.write("🔄 Translating... ");
    const command = await translateToCommand(input, apiKey);
    process.stdout.write("\r                          \r");

    if (command.startsWith("ERROR:")) {
      console.log(`❌ ${command}\n`);
      return;
    }

    console.log(`\n💡 Command: \x1b[33m${command}\x1b[0m`);

    if (autoRun) {
      console.log("▶ Running...\n");
      await runCommand(command);
      return;
    }

    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((res) =>
      rl2.question("\nRun it? [Y/n/c=copy]: ", res)
    );
    rl2.close();

    const choice = answer.trim().toLowerCase();
    if (!choice || choice === "y") {
      console.log();
      await runCommand(command);
    } else if (choice === "c") {
      // Simple clipboard copy via OS
      const platform = os.platform();
      const copyCmd =
        platform === "win32"
          ? `echo ${command} | clip`
          : platform === "darwin"
          ? `echo '${command}' | pbcopy`
          : `echo '${command}' | xclip -selection clipboard`;
      try { execSync(copyCmd); console.log("📋 Copied to clipboard!"); }
      catch { console.log(`📋 Command: ${command}`); }
    } else {
      console.log("⏭ Skipped.");
    }
    console.log();
  } catch (err) {
    console.error(`\n❌ Error: ${err.message || err}\n`);
  }
}

main().catch(console.error);
