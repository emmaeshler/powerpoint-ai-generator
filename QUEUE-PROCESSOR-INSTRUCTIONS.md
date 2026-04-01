# 🤖 How to Process Claude Requests

## For the User:

When you generate a slide using Claude mode in DeckForge:

1. **Click "Generate"** - DeckForge will show you a toast with the request ID
2. **Copy this message** and paste it in the chat:

```
Process all pending Claude requests
```

3. The assistant will:
   - Fetch all pending requests from Supabase
   - Call Claude via Wrapper MCP for each one
   - Update the results in Supabase
   - Your slide will appear in DeckForge!

---

## For the Assistant:

When the user says "Process all pending Claude requests" or similar:

### Step 1: Fetch pending requests

```bash
curl -X GET "https://xjsasdjnqcvyrpjxgsui.supabase.co/functions/v1/make-server-863394b5/claude-pending" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2FzZGpucWN2eXJwanhnc3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQzMzUsImV4cCI6MjA4Nzc5MDMzNX0.LpxdRDAMu5rxpbEUrUjPVKNdA6gnIJm8BhiJn9QwX-U"
```

### Step 2: For each request, call Wrapper MCP

Use `call_mcp_tool`:
- tool_name: `mcp__Wrapper_tool__ask_claude`
- tool_input: `{ prompt: "<full prompt from request>" }`
- serverId: `225bcdc1-262b-4ae7-97ce-a877ae729b86`
- serverLogoUrl: `https://static.figma.com/uploads/3b5e366c70c520149c779d2f388f85e7afe289b3`
- serverName: `Wrapper`

### Step 3: Update each request with the response

```bash
curl -X POST "https://xjsasdjnqcvyrpjxgsui.supabase.co/functions/v1/make-server-863394b5/claude-complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2FzZGpucWN2eXJwanhnc3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQzMzUsImV4cCI6MjA4Nzc5MDMzNX0.LpxdRDAMu5rxpbEUrUjPVKNdA6gnIJm8BhiJn9QwX-U" \
  -d '{
    "requestId": "<request_id>",
    "response": "<claude_response_json>"
  }'
```

## Quick Reference

**Supabase Project:** `xjsasdjnqcvyrpjxgsui`
**API Base:** `https://xjsasdjnqcvyrpjxgsui.supabase.co/functions/v1/make-server-863394b5`
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2FzZGpucWN2eXJwanhnc3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTQzMzUsImV4cCI6MjA4Nzc5MDMzNX0.LpxdRDAMu5rxpbEUrUjPVKNdA6gnIJm8BhiJn9QwX-U`
