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
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import vm from 'vm';
import pptxgen from 'pptxgenjs';
import { DefaultAzureCredential } from '@azure/identity';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let requestCounter = 0;

// ── Credential state (updated at startup and on demand) ──────────────────────
let credentialStatus = {
  state: 'unchecked', // 'unchecked' | 'ok' | 'missing_env' | 'auth_failed'
  missingVars: [],
  azureError: null,
};

/**
 * Try to get an Azure token and update credentialStatus.
 * Called once at startup and again after /setup-credentials saves new values.
 */
async function checkAzureAuth() {
  const required = ['FOUNDRY_TARGET_URI', 'MODEL'];
  const missing = required.filter(v => !process.env[v]);

  if (missing.length > 0) {
    credentialStatus = { state: 'missing_env', missingVars: missing, azureError: null };
    return;
  }

  try {
    const credential = new DefaultAzureCredential();
    await credential.getToken('https://cognitiveservices.azure.com/.default');
    credentialStatus = { state: 'ok', missingVars: [], azureError: null };
    console.log('✅ Azure authentication confirmed\n');
  } catch (err) {
    credentialStatus = { state: 'auth_failed', missingVars: [], azureError: err.message };
    console.warn('⚠️  Azure authentication failed:', err.message);
  }
}

/**
 * Interactive terminal prompt for any missing .env variables.
 * Saves answers to .env so the next run skips this step.
 */
async function promptForMissingCredentials() {
  const required = {
    FOUNDRY_TARGET_URI: 'Azure Foundry endpoint URL  (e.g. https://your-resource.openai.azure.com/...)',
    MODEL:              'Model name                  (e.g. claude-3-5-sonnet)',
  };

  const missing = Object.entries(required).filter(([k]) => !process.env[k]);
  if (missing.length === 0) return;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  First-time setup — credentials needed                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log('  These values will be saved to .env so you only need to');
  console.log('  enter them once.\n');

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, resolve));

  const newLines = [];
  for (const [varName, hint] of missing) {
    const answer = await ask(`  ${varName}\n  ${hint}\n  > `);
    const val = answer.trim();
    if (val) {
      process.env[varName] = val;
      newLines.push(`${varName}=${val}`);
    }
    console.log('');
  }
  rl.close();

  if (newLines.length > 0) {
    const envPath = path.join(__dirname, '.env');
    const existing = existsSync(envPath) ? await readFile(envPath, 'utf-8') : '';
    // Strip any previous values for these keys before appending
    const existingKeys = newLines.map(l => l.split('=')[0]);
    const filtered = existing
      .split('\n')
      .filter(line => !existingKeys.some(k => line.startsWith(k + '=')))
      .join('\n')
      .trimEnd();
    await writeFile(envPath, (filtered ? filtered + '\n' : '') + newLines.join('\n') + '\n');
    console.log('  ✅ Credentials saved to .env\n');
  }
}

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

// Health check endpoint — includes credential status so the UI can guide setup
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    credentials: credentialStatus,
  });
});

// Let the UI save credentials and re-check auth without restarting the server
app.post('/setup-credentials', async (req, res) => {
  const allowed = ['FOUNDRY_TARGET_URI', 'MODEL'];
  const toSave = [];

  for (const key of allowed) {
    const val = req.body[key];
    if (typeof val === 'string' && val.trim()) {
      process.env[key] = val.trim();
      toSave.push(`${key}=${val.trim()}`);
    }
  }

  if (toSave.length > 0) {
    try {
      const envPath = path.join(__dirname, '.env');
      const existing = existsSync(envPath) ? await readFile(envPath, 'utf-8') : '';
      const keys = toSave.map(l => l.split('=')[0]);
      const filtered = existing
        .split('\n')
        .filter(line => !keys.some(k => line.startsWith(k + '=')))
        .join('\n')
        .trimEnd();
      await writeFile(envPath, (filtered ? filtered + '\n' : '') + toSave.join('\n') + '\n');
    } catch (e) {
      console.error('Failed to write .env:', e.message);
    }
  }

  // Re-run the auth check with the newly set values
  await checkAzureAuth();
  res.json({ success: true, credentials: credentialStatus });
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
    const cwd = '/Users/emmaeshler/Documents/Powerpoint-App-main';

    // Fetch latest from remote (don't fail if it errors)
    try {
      await execAsync('git fetch --all --prune', { cwd });
    } catch (fetchError) {
      console.warn('Failed to fetch from remote:', fetchError.message);
      // Continue anyway with local branches
    }

    const { stdout } = await execAsync('git branch -a', { cwd });
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
    console.log(`🔀 Switching to branch: ${branchName}`);

    const { stdout, stderr } = await execAsync(`git checkout ${branchName}`, {
      cwd: '/Users/emmaeshler/Documents/Powerpoint-App-main'
    });

    console.log(`  ✅ Branch switched successfully`);
    if (stdout) console.log(`  stdout: ${stdout.trim()}`);
    if (stderr) console.log(`  stderr: ${stderr.trim()}`);

    res.json({ success: true });
  } catch (error) {
    console.error(`  ❌ Branch switch failed:`, error.message);
    if (error.stdout) console.error(`  stdout: ${error.stdout}`);
    if (error.stderr) console.error(`  stderr: ${error.stderr}`);
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

// PptxGenJS Preview Endpoint
import { executeWillsCode } from './utils/pptxgen-executor.js';

app.post('/preview-pptxgen', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    console.log('📊 Executing PptxGenJS code for preview...');
    console.log('📄 Code preview (first 200 chars):', code.substring(0, 200));

    const result = await executeWillsCode(code);

    if (!result.success) {
      console.error('❌ PptxGenJS execution failed:', result.error);
      return res.status(500).json({
        error: result.error,
        stack: result.stack
      });
    }

    console.log(`✅ Preview generated: ${result.metadata.slideCount} slide(s), ${result.metadata.elementCount} element(s)`);

    res.json(result);

  } catch (error) {
    console.error('❌ Preview endpoint error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// PptxGenJS Export Endpoint (generates actual PPTX file)
app.post('/export-pptxgen', async (req, res) => {
  try {
    const { code, fileName = 'INSIGHT2PROFIT_Presentation.pptx' } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    console.log('📦 Generating PPTX from PptxGenJS code...');

    // Load slide-lib.js
    const slideLibPath = path.join(
      process.env.HOME || os.homedir(),
      '.claude/skills/poc-branded-pptx-slide/slide-lib.js'
    );

    if (!fs.existsSync(slideLibPath)) {
      throw new Error(`slide-lib.js not found at: ${slideLibPath}`);
    }

    const slideLibCode = fs.readFileSync(slideLibPath, 'utf8');

    // INSIGHT color palette
    const INSIGHT_COLORS = {
      primary: '00446A',
      accent: 'E56910',
      primaryLight: 'D9E6EC',
      accentLight: 'FCEEE4',
      textDark: '25282A',
      textMid: '4A6070',
      textLight: '7A95A5',
      border: 'C8D9E2',
      green: '339966',
      red: 'CB333B',
      gray: '75787B',
      white: 'FFFFFF',
      offWhite: 'F3F4F4',
      darkNavy: '051C2C',
      font: 'Arial Narrow'
    };

    // PowerPoint dimensions
    const W = 13.3;
    const H = 7.5;
    const MARGIN = 0.35;
    const GUTTER = 0.23;
    const CONTENT_AREA = {
      x: MARGIN,
      y: 1.35,
      w: W - MARGIN * 2,
      h: H - 1.35 - MARGIN
    };
    const FRAME = {
      title: { x: MARGIN, y: 0.35, w: W - MARGIN * 2, h: 0.5 },
      subtitle: { x: MARGIN, y: 0.9, w: W - MARGIN * 2, h: 0.3 },
      footer: { x: MARGIN, y: H - 0.35, w: W - MARGIN * 2, h: 0.25 }
    };

    // Create sandbox context with safe require (allows mocked modules)
    const createSafeRequire = () => {
      return function safeRequire(moduleName) {
        if (moduleName === 'pptxgenjs') return pptxgen;
        if (moduleName === 'fs') return fs;
        if (moduleName === 'path') return path;

        // Mocked modules for slide-lib compatibility
        if (moduleName === 'react') {
          return { createElement: () => ({}) };
        }
        if (moduleName === 'react-dom/server') {
          return { renderToStaticMarkup: () => '<svg></svg>' };
        }
        if (moduleName === 'sharp') {
          return () => ({ png: () => ({ toBuffer: () => Promise.resolve(Buffer.from('')) }) });
        }

        throw new Error(`Module '${moduleName}' is not allowed in sandbox`);
      };
    };

    const skillDir = path.dirname(slideLibPath);
    const sandbox = {
      module: { exports: {} },
      exports: {},
      require: createSafeRequire(),
      console: console,
      Buffer: Buffer,
      process: {
        env: process.env,
        cwd: () => process.cwd()
      },
      __dirname: skillDir,
      __filename: slideLibPath,
      W, H, MARGIN, GUTTER,
      CONTENT_AREA,
      FRAME
    };

    // Execute slide-lib.js first
    const slideLibModule = { exports: {} };
    sandbox.module = slideLibModule;
    sandbox.exports = slideLibModule.exports;

    vm.runInNewContext(slideLibCode, sandbox, {
      filename: 'slide-lib.js',
      timeout: 5000,
      displayErrors: true
    });

    // Store slide-lib exports
    const slideLibExports = slideLibModule.exports;

    // Execute Will's code
    const willsModule = { exports: {} };
    sandbox.module = willsModule;
    sandbox.exports = willsModule.exports;

    // Make slide-lib functions available
    Object.assign(sandbox, slideLibExports);

    vm.runInNewContext(code, sandbox, {
      filename: 'wills-slide.js',
      timeout: 5000,
      displayErrors: true
    });

    // Get the exported addSlide function
    const addSlide = willsModule.exports;

    if (typeof addSlide !== 'function') {
      throw new Error('Will\'s code did not export a function');
    }

    // Create real presentation
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    pres.author = 'INSIGHT2PROFIT';
    pres.title = 'Generated Presentation';
    pres.defineLayout({ name: 'INSIGHT_CONTENT', width: W, height: H });
    pres.layout = 'INSIGHT_CONTENT';

    // Execute the addSlide function
    await addSlide(pres, INSIGHT_COLORS);

    // Generate PPTX file with unique temp name to avoid race conditions
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${fileName}`;
    const tempPath = path.join(os.tmpdir(), uniqueFileName);
    await pres.writeFile({ fileName: tempPath });

    console.log(`✅ PPTX generated: ${tempPath}`);

    // Send file
    res.download(tempPath, fileName, (err) => {
      if (err) {
        console.error('❌ Error sending file:', err);
      }
      // Clean up temp file (ignore if already deleted)
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (cleanupErr) {
        // Ignore cleanup errors - file might already be deleted
      }
    });

  } catch (error) {
    console.error('❌ Export endpoint error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Upload PPTX for Preview (accepts pre-generated PPTX blob)
app.post('/api/upload-pptx-preview', async (req, res) => {
  try {
    const { pptxBase64 } = req.body;

    if (!pptxBase64) {
      return res.status(400).json({ error: 'No PPTX data provided' });
    }

    console.log('📊 Processing uploaded PPTX for preview...');

    // Generate unique request ID
    const requestId = crypto.randomBytes(16).toString('hex');
    const tempDir = path.join(__dirname, '.preview-cache');

    // Create cache directory if needed
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const pptxPath = path.join(tempDir, `${requestId}.pptx`);
    const pdfPath = path.join(tempDir, `${requestId}.pdf`);

    // Save PPTX from base64
    const pptxBuffer = Buffer.from(pptxBase64, 'base64');
    fs.writeFileSync(pptxPath, pptxBuffer);

    console.log(`  ✅ PPTX saved: ${pptxPath}`);

    // Try to convert to PDF using LibreOffice
    let pdfGenerated = false;

    try {
      let sofficeCmd = 'soffice';

      // Check common macOS location
      if (fs.existsSync('/Applications/LibreOffice.app/Contents/MacOS/soffice')) {
        sofficeCmd = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
      }

      console.log(`  → Converting PPTX to PDF...`);
      execSync(
        `"${sofficeCmd}" --headless --convert-to pdf --outdir "${tempDir}" "${pptxPath}"`,
        { timeout: 10000 }
      );

      pdfGenerated = fs.existsSync(pdfPath);

      if (pdfGenerated) {
        console.log(`  ✅ PDF generated: ${pdfPath}`);
      }
    } catch (err) {
      console.log('  ⚠️  LibreOffice conversion failed (falling back to PPTX download):', err.message);
      pdfGenerated = false;
    }

    res.json({
      success: true,
      pdfUrl: pdfGenerated ? `/api/preview-pdf/${requestId}` : null,
      pptxUrl: `/api/preview-pptx/${requestId}`,
      requestId,
      message: pdfGenerated ? 'Preview ready' : 'PDF conversion not available, download PPTX instead'
    });

  } catch (error) {
    console.error('❌ Upload preview error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Universal PPTX Preview Endpoint (generates PPTX + optional PDF conversion)
app.post('/api/universal-pptx-preview', async (req, res) => {
  try {
    const { slides, format } = req.body;

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ error: 'No slides provided' });
    }

    console.log(`📊 Generating universal preview for ${slides.length} slide(s), format: ${format || 'auto'}`);

    // Generate unique request ID for caching
    const requestId = crypto.randomBytes(16).toString('hex');
    const tempDir = path.join(__dirname, '.preview-cache');

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const pptxPath = path.join(tempDir, `${requestId}.pptx`);
    const pdfPath = path.join(tempDir, `${requestId}.pdf`);

    // Step 1: Generate PPTX based on format
    let generatedPptx = false;

    if (format === 'will-sections') {
      // Will's sections format - use server-side generation
      console.log('  → Using Will\'s sections renderer');
      const pres = new pptxgen();

      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'INSIGHT2PROFIT';
      pres.title = 'Generated Presentation';
      pres.defineLayout({ name: 'INSIGHT_CONTENT', width: 13.3, height: 7.5 });
      pres.layout = 'INSIGHT_CONTENT';

      // Import renderWillsSlide logic (would need to extract from pptx-generator.ts)
      // For now, just create a basic slide
      for (const slide of slides) {
        const s = pres.addSlide();
        s.background = { color: 'FFFFFF' };

        // Add title
        if (slide.title) {
          s.addText(slide.title, {
            x: 0.75, y: 0.4, w: 11.833, h: 0.45,
            fontSize: 24, bold: true, color: '00446A',
            fontFace: 'Arial Narrow', align: 'left', valign: 'middle'
          });
        }

        // Add divider
        s.addShape('rect', {
          x: 0.75, y: 1.0, w: 11.833, h: 0.02,
          fill: { color: '00446A' }, line: { type: 'none' }
        });

        // Add footer
        s.addShape('rect', {
          x: 0.75, y: 6.85, w: 11.833, h: 0.015,
          fill: { color: 'E56910' }, line: { type: 'none' }
        });
        s.addText('INSIGHT2PROFIT', {
          x: 0.75, y: 6.95, w: 2.0, h: 0.3,
          fontSize: 10, color: '00446A', fontFace: 'Calibri',
          align: 'left', valign: 'middle', bold: true
        });
        s.addText('1', {
          x: 11.0, y: 6.95, w: 1.583, h: 0.3,
          fontSize: 10, color: 'E56910', fontFace: 'Calibri',
          align: 'right', valign: 'middle'
        });
      }

      await pres.writeFile({ fileName: pptxPath });
      generatedPptx = true;

    } else if (format === 'will-code') {
      // Will's PptxGenJS code - reuse export-pptxgen logic
      console.log('  → Using Will\'s PptxGenJS code executor');
      const slide = slides[0];
      const code = slide.content?.pptxCode || slide.content?.rawOutput;

      if (!code) {
        throw new Error('No PptxGenJS code found in slide');
      }

      // Load slide-lib.js
      const slideLibPath = path.join(
        process.env.HOME || os.homedir(),
        '.claude/skills/poc-branded-pptx-slide/slide-lib.js'
      );

      if (!fs.existsSync(slideLibPath)) {
        throw new Error(`slide-lib.js not found at: ${slideLibPath}`);
      }

      const slideLibCode = fs.readFileSync(slideLibPath, 'utf8');

      // INSIGHT color palette
      const INSIGHT_COLORS = {
        primary: '00446A',
        accent: 'E56910',
        green: '339966',
        red: 'CB333B',
        gray: '75787B',
        white: 'FFFFFF',
        offWhite: 'F3F4F4'
      };

      // PowerPoint dimensions
      const W = 13.3;
      const H = 7.5;
      const MARGIN = 0.35;
      const GUTTER = 0.23;
      const CONTENT_AREA = {
        x: MARGIN,
        y: 1.35,
        w: W - MARGIN * 2,
        h: H - 1.35 - MARGIN
      };
      const FRAME = {
        title: { x: MARGIN, y: 0.35, w: W - MARGIN * 2, h: 0.5 },
        subtitle: { x: MARGIN, y: 0.9, w: W - MARGIN * 2, h: 0.3 },
        footer: { x: MARGIN, y: H - 0.35, w: W - MARGIN * 2, h: 0.25 }
      };

      // Create sandbox context
      const sandbox = {
        module: { exports: {} },
        exports: {},
        require: (name) => {
          if (name === 'pptxgenjs') return pptxgen;
          if (name === 'fs') return fs;
          if (name === 'path') return path;
          throw new Error(`Module '${name}' is not allowed`);
        },
        console: console,
        Buffer: Buffer,
        process: {
          env: process.env,
          cwd: () => process.cwd()
        },
        W, H, MARGIN, GUTTER,
        CONTENT_AREA,
        FRAME
      };

      // Execute slide-lib.js first
      const slideLibModule = { exports: {} };
      sandbox.module = slideLibModule;
      sandbox.exports = slideLibModule.exports;

      vm.runInNewContext(slideLibCode, sandbox, {
        filename: 'slide-lib.js',
        timeout: 5000,
        displayErrors: true
      });

      // Store slide-lib exports
      const slideLibExports = slideLibModule.exports;

      // Execute Will's code
      const willsModule = { exports: {} };
      sandbox.module = willsModule;
      sandbox.exports = willsModule.exports;

      // Make slide-lib functions available
      Object.assign(sandbox, slideLibExports);

      vm.runInNewContext(code, sandbox, {
        filename: 'wills-slide.js',
        timeout: 5000,
        displayErrors: true
      });

      // Get the exported addSlide function
      const addSlide = willsModule.exports;

      if (typeof addSlide !== 'function') {
        throw new Error('Will\'s code did not export a function');
      }

      // Create real presentation
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'INSIGHT2PROFIT';
      pres.title = 'Generated Presentation';
      pres.defineLayout({ name: 'INSIGHT_CONTENT', width: W, height: H });
      pres.layout = 'INSIGHT_CONTENT';

      // Execute the addSlide function
      await addSlide(pres, INSIGHT_COLORS);

      // Generate PPTX file
      await pres.writeFile({ fileName: pptxPath });
      generatedPptx = true;

    } else {
      // Emma's format or generic - return error for now (needs browser-side generation)
      return res.json({
        success: false,
        error: 'Emma\'s format must be generated in browser. Use format="will-sections" or "will-code".',
        pptxUrl: null
      });
    }

    if (!generatedPptx) {
      throw new Error('Failed to generate PPTX');
    }

    console.log(`  ✅ PPTX generated: ${pptxPath}`);

    // Step 2: Convert PPTX → PDF using LibreOffice (optional)
    let pdfGenerated = false;

    try {
      // Try to find soffice binary
      let sofficeCmd = 'soffice';

      // Check common macOS location
      if (fs.existsSync('/Applications/LibreOffice.app/Contents/MacOS/soffice')) {
        sofficeCmd = '/Applications/LibreOffice.app/Contents/MacOS/soffice';
      }

      console.log(`  → Converting PPTX to PDF...`);
      execSync(
        `"${sofficeCmd}" --headless --convert-to pdf --outdir "${tempDir}" "${pptxPath}"`,
        { timeout: 10000 }
      );

      pdfGenerated = fs.existsSync(pdfPath);

      if (pdfGenerated) {
        console.log(`  ✅ PDF generated: ${pdfPath}`);
      }
    } catch (err) {
      console.log('  ⚠️  LibreOffice conversion failed (falling back to PPTX download):', err.message);
      pdfGenerated = false;
    }

    // Step 3: Return URLs
    res.json({
      success: true,
      pdfUrl: pdfGenerated ? `/api/preview-pdf/${requestId}` : null,
      pptxUrl: `/api/preview-pptx/${requestId}`,
      requestId,
      message: pdfGenerated ? 'Preview ready' : 'PDF conversion not available, download PPTX instead'
    });

  } catch (error) {
    console.error('❌ Universal preview error:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Serve cached PDF
app.get('/api/preview-pdf/:requestId', (req, res) => {
  const pdfPath = path.resolve(__dirname, '.preview-cache', `${req.params.requestId}.pdf`);

  console.log(`📄 Serving PDF: ${pdfPath}`);

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF not found: ${pdfPath}`);
    return res.status(404).json({ error: 'PDF preview not found' });
  }

  // Use streaming instead of sendFile (more reliable)
  res.contentType('application/pdf');
  const stream = fs.createReadStream(pdfPath);

  stream.on('error', (err) => {
    console.error('❌ Error streaming PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream PDF file' });
    }
  });

  stream.on('end', () => {
    console.log('✅ PDF streamed successfully');
  });

  stream.pipe(res);
});

// Serve cached PPTX
app.get('/api/preview-pptx/:requestId', (req, res) => {
  const pptxPath = path.resolve(__dirname, '.preview-cache', `${req.params.requestId}.pptx`);

  if (!fs.existsSync(pptxPath)) {
    return res.status(404).json({ error: 'PPTX preview not found' });
  }

  // Use streaming instead of sendFile (more reliable)
  res.contentType('application/vnd.openxmlformats-officedocument.presentationml.presentation');
  const stream = fs.createReadStream(pptxPath);

  stream.on('error', (err) => {
    console.error('❌ Error streaming PPTX:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream PPTX file' });
    }
  });

  stream.pipe(res);
});

// Cache cleanup job - runs every hour to delete old preview files
function cleanupPreviewCache() {
  const cacheDir = path.join(__dirname, '.preview-cache');

  if (!fs.existsSync(cacheDir)) {
    return;
  }

  try {
    const files = fs.readdirSync(cacheDir);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(cacheDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      // Delete files older than 24 hours
      if (age > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} old preview file(s)`);
    }
  } catch (err) {
    console.error('Cache cleanup error:', err.message);
  }
}

// ─── User Preferences ────────────────────────────────────────────────────────
const PREFS_FILE = path.join(__dirname, 'data', 'preferences.json');

async function loadPreferences() {
  try {
    if (existsSync(PREFS_FILE)) {
      const raw = await readFile(PREFS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load preferences:', e.message);
  }
  return {};
}

async function savePreferences(prefs) {
  try {
    await mkdir(path.dirname(PREFS_FILE), { recursive: true });
    await writeFile(PREFS_FILE, JSON.stringify(prefs, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save preferences:', e.message);
  }
}

app.get('/api/preferences', async (req, res) => {
  const prefs = await loadPreferences();
  res.json({ success: true, preferences: prefs });
});

app.post('/api/preferences', async (req, res) => {
  try {
    const existing = await loadPreferences();
    const updated = { ...existing, ...req.body };
    await savePreferences(updated);
    res.json({ success: true, preferences: updated });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Start server
async function startServer() {
  // ── Step 1: collect any missing credentials interactively ────────────────
  await promptForMissingCredentials();

  // ── Step 2: verify Azure auth and update credential status ───────────────
  await checkAzureAuth();

  if (credentialStatus.state === 'auth_failed') {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  Azure authentication failed                            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('  The server will still start, but AI generation will fail');
    console.log('  until you authenticate.\n');
    console.log('  To fix, run in a new terminal:');
    console.log('    az login\n');
    console.log('  Or set these environment variables in .env:');
    console.log('    AZURE_CLIENT_ID=<your-client-id>');
    console.log('    AZURE_CLIENT_SECRET=<your-client-secret>');
    console.log('    AZURE_TENANT_ID=<your-tenant-id>\n');
    console.log('  The app will guide you through this on the setup screen.\n');
  }

  // ── Step 3: start listening ───────────────────────────────────────────────
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

    // Run cleanup on startup
    cleanupPreviewCache();

    // Schedule cleanup every hour
    setInterval(cleanupPreviewCache, 60 * 60 * 1000);
    console.log('🧹 Preview cache cleanup scheduled (every 24 hours)\n');
  });
}

startServer();

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Claude Bridge Server...');
  process.exit(0);
});
