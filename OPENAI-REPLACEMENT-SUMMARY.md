# OpenAI → MCP Wrapper Replacement Summary

## ✅ Complete - All OpenAI References Removed

### Changes Made:

#### 1. **Supabase Edge Function** (`/supabase/functions/server/index.tsx`)
**Before:**
```typescript
// Called OpenAI API directly
const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  }),
});
```

**After:**
```typescript
// Calls your MCP wrapper
const mcpResponse = await fetch("https://seth-belowground-cleveland.ngrok-free.dev/mcp", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "ask_claude",
      arguments: {
        prompt: fullPrompt  // System prompt + user prompt combined
      }
    }
  })
});

// Extracts response from MCP result structure
const content = mcpData.result.content[0].text;
```

**Key Changes:**
- ❌ Removed OpenAI API key requirement
- ❌ Removed `openaiApiKey` parameter from request body
- ✅ Combined system prompt and user prompt into single message
- ✅ Uses JSON-RPC 2.0 protocol for MCP wrapper
- ✅ Extracts response from `data.result.content[0].text`

---

#### 2. **Frontend** (`/src/app/App.tsx`)
**What It Does:**
- Directly calls your MCP wrapper via ngrok endpoint
- Sends full DeckForge system prompt + user prompt
- Parses Claude's JSON response and creates slides

**Code:**
```typescript
async function handleRequestClaudeGeneration(prompt: string): Promise<string> {
  const MCP_ENDPOINT = 'https://seth-belowground-cleveland.ngrok-free.dev/mcp';
  
  const response = await fetch(MCP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'ask_claude',
        arguments: { prompt: prompt }
      }
    })
  });

  const data = await response.json();
  const claudeResponse = data.result.content[0].text;
  return claudeResponse;
}
```

---

#### 3. **Test MCP Button**
- Now calls real MCP endpoint with test prompt
- Validates Claude's response by parsing JSON
- Shows success with slide type confirmation
- Clear error messages for debugging

---

### Verification: No OpenAI References Remain

**Searched entire codebase for:**
- ✅ `api.openai.com` - **0 matches**
- ✅ `OPENAI_API_KEY` - **0 matches**
- ✅ `gpt-4` - **0 matches**
- ✅ `sk-` (API key prefix) - **0 matches**
- ✅ `from "openai"` - **0 matches**

**Only mention of OpenAI:**
- One comment: `// Call MCP wrapper instead of OpenAI` (line 48)
- This is intentional documentation

---

### How It Works Now

```
┌─────────────────────────────────────────┐
│  User enters prompt in DeckForge        │
│  "Show our 3 strategic priorities"      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Frontend: App.tsx                      │
│  • Adds DeckForge system prompt         │
│  • Calls your MCP wrapper               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  MCP Wrapper (ngrok endpoint)           │
│  https://seth-belowground-cleveland...  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Claude via MCP                         │
│  • Receives full prompt with rules      │
│  • Generates slide JSON                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Response flows back                    │
│  • Frontend parses JSON                 │
│  • Creates Slide object                 │
│  • Adds to deck                         │
│  • User can export to PPTX              │
└─────────────────────────────────────────┘
```

---

### Files Modified:
1. `/supabase/functions/server/index.tsx` - Replaced OpenAI with MCP wrapper
2. `/src/app/App.tsx` - Direct MCP integration for frontend
3. `/src/app/components/AISlideGenerator.tsx` - Already using new flow
4. `/src/app/utils/claude-generator.ts` - Kept for prompt building

### Files That Can Be Deleted (Optional):
- `/src/app/utils/smart-parser.ts` - Local fallback, no longer needed
- `/QUEUE-PROCESSOR-INSTRUCTIONS.md` - Old queue system docs
- `/monitor-claude-queue.md` - Old queue system docs

---

## 🎉 Result

**DeckForge now uses Claude exclusively via your MCP wrapper!**

- No OpenAI dependencies
- No API keys needed
- Direct connection to your ngrok endpoint
- Full DeckForge system prompt preserved
- All 8 slide archetypes working
- PPTX export unchanged (client-side)
