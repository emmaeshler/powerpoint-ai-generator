#!/usr/bin/env node

/**
 * Claude Bridge Server
 *
 * This server acts as a bridge between the browser app and Claude Code terminal.
 * It receives slide generation requests from the browser, displays them in the terminal,
 * waits for you to provide the slide JSON, then returns it to the browser.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createInterface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { DefaultAzureCredential } from '@azure/identity';

const execAsync = promisify(exec);

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let requestCounter = 0;

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║  Claude Bridge Server for PPT Generator     ║');
console.log('╚══════════════════════════════════════════════╝\n');
console.log(`🚀 Server starting on http://localhost:${PORT}`);
console.log('📡 Waiting for slide generation requests...\n');

// Load skill files from disk
async function loadSkillFiles(prompt) {
  // Parse skill file paths from prompt
  const skillPattern = /File: (.+\.(?:md|txt))/g;
  const matches = [...prompt.matchAll(skillPattern)];

  if (matches.length === 0) {
    console.log(`⚠️  No skill files found in prompt`);
    return prompt;  // No skills, return original
  }

  console.log(`📚 Loading ${matches.length} skill file(s):`);
  matches.forEach(([, filePath]) => console.log(`   - ${filePath}`));

  // Read each skill file
  const skillContents = await Promise.all(
    matches.map(async ([, filePath]) => {
      try {
        // Handle ~ paths and relative paths
        const expandedPath = filePath.startsWith('~')
          ? path.join(process.env.HOME, filePath.slice(1))
          : path.join('/Users/emmaeshler/Documents/Powerpoint-App-main/src/imports/pasted_text/', filePath);

        const content = await readFile(expandedPath, 'utf-8');
        console.log(`  ✅ Loaded: ${filePath} (${(content.length / 1024).toFixed(1)}KB)`);
        return `\n\n## Skill File: ${filePath}\n\n${content}`;
      } catch (err) {
        console.error(`  ⚠️  Failed to load skill: ${filePath}`, err.message);
        return `\n\n## Skill File: ${filePath}\n[Error: Could not load file]`;
      }
    })
  );

  // Insert skill contents after the main prompt
  return prompt + '\n\n---\n# SKILL FILES CONTENT\n' + skillContents.join('\n');
}

// Call Azure Foundry API
async function callClaudeFoundry(prompt, systemPrompt) {
  console.log("🤖 Calling Azure Foundry API...");

  const credential = new DefaultAzureCredential();
  const token = await credential.getToken(
    "https://cognitiveservices.azure.com/.default"
  );

  if (!token || !token.token) {
    throw new Error("Could not get Azure access token.");
  }

  // Use provided system prompt or fall back to default
  const defaultSystem = "You are a senior presentation designer at INSIGHT2PROFIT with 10 years of experience building consultant-grade slides. You think like a designer first, not a template-filler. Your job is to read the content, understand the argument, and build the slide that communicates it most powerfully.\n\nRETURN ONLY valid JSON. No markdown, no explanation, no code blocks.";
  const system = systemPrompt || defaultSystem;

  // Retry logic with exponential backoff for transient errors
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(process.env.FOUNDRY_TARGET_URI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token.token}`,
          "Accept": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: process.env.MODEL,
          max_tokens: 8000,
          system: system,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();

      // Retry on 429 (rate limit) or 529 (overloaded)
      if (response.status === 429 || response.status === 529) {
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s

        console.log(`  ⏳ Azure API ${response.status}, retry ${attempt}/${maxRetries} after ${waitTime}ms`);
        lastError = new Error(`Azure API overloaded (${response.status}). Retrying...`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(
          `Foundry request failed: ${response.status} ${JSON.stringify(data)}`
        );
      }

      const text =
        data?.content
          ?.filter((item) => item.type === "text")
          ?.map((item) => item.text)
          ?.join("\n") || "No text returned from Claude.";

      console.log(`  ✅ Azure Foundry response received (${(text.length / 1024).toFixed(1)}KB)`);

      // Debug: Log first 500 chars of response
      console.log(`  📄 Response preview: ${text.substring(0, 500)}...`);

      return text;

    } catch (error) {
      lastError = error;

      // Log detailed error information
      console.error(`  ❌ Error on attempt ${attempt}/${maxRetries}:`, {
        message: error.message,
        code: error.code,
        cause: error.cause?.message || error.cause,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });

      if (attempt < maxRetries && (error.message.includes('overloaded') || error.message.includes('ECONNRESET'))) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`  ⏳ Retrying after ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

// Main endpoint for AI generation
app.post('/mcp', async (req, res) => {
  const requestId = ++requestCounter;
  const { method, params, id } = req.body;

  console.log('\n' + '═'.repeat(80));
  console.log(`📥 REQUEST #${requestId} from browser`);
  console.log('═'.repeat(80));

  // Validate JSON-RPC format
  if (method !== 'tools/call' || params?.name !== 'ask_claude') {
    console.log(`❌ Invalid method: ${method} / ${params?.name}`);
    return res.status(400).json({ error: 'Invalid method - expected tools/call with ask_claude' });
  }

  const { prompt, system } = params.arguments;

  console.log(`📝 Prompt length: ${(prompt.length / 1024).toFixed(1)}KB`);
  if (system) {
    console.log(`📋 System prompt: ${(system.length / 1024).toFixed(1)}KB`);
    console.log(`📋 System prompt preview: ${system.substring(0, 150)}...`);
  }

  try {
    // Load skill files from disk
    console.log(`\n🔍 Parsing prompt for skill file references...`);
    const enhancedPrompt = await loadSkillFiles(prompt);

    // Call Azure Foundry with enhanced prompt
    const result = await callClaudeFoundry(enhancedPrompt, system);

    // Return JSON-RPC response
    res.json({
      jsonrpc: '2.0',
      id: id,
      result: {
        content: [{ type: 'text', text: result }]
      }
    });

    console.log(`✅ REQUEST #${requestId}: Slide generated successfully\n`);
  } catch (error) {
    console.error(`❌ REQUEST #${requestId}: Error:`, error.message);
    res.status(500).json({
      jsonrpc: '2.0',
      id: id,
      error: { code: -32603, message: error.message }
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});

// Git workflow endpoints
app.get('/git/current-branch', async (req, res) => {
  try {
    const { stdout } = await execAsync('git branch --show-current', {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });
    res.json({ branch: stdout.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/git/branches', async (req, res) => {
  try {
    const { stdout } = await execAsync('git branch -a', {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });
    const branches = stdout
      .split('\n')
      .map(b => b.trim().replace(/^\*\s*/, '').replace(/^remotes\/origin\//, ''))
      .filter(b => b && b !== 'HEAD' && !b.includes('->'))
      .filter((b, i, arr) => arr.indexOf(b) === i); // unique
    res.json({ branches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/git/create-branch', async (req, res) => {
  try {
    const { branchName } = req.body;
    await execAsync(`git checkout -b ${branchName}`, {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/git/switch-branch', async (req, res) => {
  try {
    const { branchName } = req.body;
    await execAsync(`git checkout ${branchName}`, {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/git/stage-all', async (req, res) => {
  try {
    await execAsync('git add -A', {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/git/commit', async (req, res) => {
  try {
    const { message } = req.body;
    await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/git/push', async (req, res) => {
  try {
    const { branch } = req.body;
    await execAsync(`git push -u origin ${branch}`, {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/git/save-override-note', async (req, res) => {
  try {
    const { branch, note, timestamp } = req.body;
    const notesDir = '/Users/emmaeshler/Documents/Powerpoint-App-main/.git-override-notes';

    if (!existsSync(notesDir)) {
      await mkdir(notesDir, { recursive: true });
    }

    const noteFile = path.join(notesDir, `${branch}.json`);
    await writeFile(noteFile, JSON.stringify({ branch, note, timestamp }, null, 2));

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/git/summary', async (req, res) => {
  try {
    const cwd = '/Users/emmaeshler/Documents/Powerpoint-App-main';

    // Get current branch
    const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd });
    const branch = branchOut.trim();

    // Get status to check for changes
    const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd });
    const hasChanges = statusOut.trim().length > 0;

    if (!hasChanges) {
      return res.json({
        branch,
        hasChanges: false,
        skills: { added: [], modified: [], removed: [] },
        components: [],
        generators: [],
        other: []
      });
    }

    // Get list of changed files
    const files = statusOut.trim().split('\n').map(line => {
      const status = line.substring(0, 2);
      const file = line.substring(3);
      return { status, file };
    });

    // Categorize changes
    const skills = { added: [], modified: [], removed: [] };
    const components = [];
    const generators = [];
    const other = [];

    for (const { status, file } of files) {
      // Skill files
      if (file.includes('imports/pasted_text/') && file.endsWith('.md')) {
        const skillName = path.basename(file, '.md')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        if (status.includes('A') || status.includes('?')) {
          skills.added.push(skillName);
        } else if (status.includes('D')) {
          skills.removed.push(skillName);
        } else {
          skills.modified.push(skillName);
        }
      }
      // Skill config
      else if (file.includes('skillsConfig.ts')) {
        if (!skills.modified.includes('Skill Configuration')) {
          skills.modified.push('Skill Configuration');
        }
      }
      // UI Components
      else if (file.includes('components/') && file.endsWith('.tsx')) {
        const compName = path.basename(file, '.tsx');
        components.push(compName);
      }
      // Generators/Utils
      else if (file.includes('utils/') || file.includes('generator')) {
        const utilName = path.basename(file, path.extname(file));
        generators.push(utilName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
      // Other files
      else {
        other.push(file);
      }
    }

    res.json({
      branch,
      hasChanges: true,
      skills: {
        added: [...new Set(skills.added)],
        modified: [...new Set(skills.modified)],
        removed: [...new Set(skills.removed)]
      },
      components: [...new Set(components)],
      generators: [...new Set(generators)],
      other: [...new Set(other)]
    });

  } catch (error) {
    console.error('Error getting git summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`\n📝 How it works:`);
  console.log(`   1. Browser app sends slide generation requests`);
  console.log(`   2. Server automatically loads selected skill files from disk`);
  console.log(`   3. Server calls Azure Foundry API with enhanced prompt`);
  console.log(`   4. Generated slide JSON returned to browser automatically`);
  console.log(`\n💡 Skills will be read from:`);
  console.log(`   - ~/.claude/skills/ (for GitHub-cloned skills)`);
  console.log(`   - src/imports/pasted_text/ (for local skills)`);
  console.log(`\n✨ Keep this server running while using the PPT app\n`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Claude Bridge Server...');
  process.exit(0);
});
