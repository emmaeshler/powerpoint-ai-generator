# Claude Queue Monitor for DeckForge

This document explains how the assistant monitors and processes Claude slide generation requests.

## Architecture

```
DeckForge (Browser) 
  ↓ Submits request
Supabase Edge Function (/claude-request)
  ↓ Stores in KV queue
Supabase KV Store (pending queue)
  ↓ Assistant polls
Assistant (this chat)
  ↓ Calls Wrapper MCP
Claude (via Wrapper)
  ↓ Returns slide JSON
Assistant updates request
  ↓ Stores response
Supabase Edge Function (/claude-complete)
  ↓ DeckForge polls
DeckForge (Browser) receives slide
```

## Endpoints

### 1. Submit Request (Frontend → Supabase)
**POST** `/make-server-863394b5/claude-request`
```json
{
  "prompt": "full DeckForge system prompt + user request"
}
```
Returns:
```json
{
  "requestId": "req-1234567890-abc123"
}
```

### 2. Check Status (Frontend → Supabase)
**GET** `/make-server-863394b5/claude-status/:requestId`

Returns:
```json
{
  "id": "req-1234567890-abc123",
  "prompt": "...",
  "status": "pending" | "completed" | "error",
  "response": "slide JSON" (if completed),
  "error": "error message" (if error),
  "createdAt": "ISO timestamp",
  "completedAt": "ISO timestamp" (if completed)
}
```

### 3. Get Pending Queue (Assistant → Supabase)
**GET** `/make-server-863394b5/claude-pending`

Returns:
```json
{
  "requests": [
    {
      "id": "req-...",
      "prompt": "...",
      "status": "pending",
      "createdAt": "..."
    }
  ],
  "count": 1
}
```

### 4. Complete Request (Assistant → Supabase)
**POST** `/make-server-863394b5/claude-complete`
```json
{
  "requestId": "req-1234567890-abc123",
  "response": "slide JSON string",
  "error": "error message" (optional)
}
```

## How to Process Requests (Manual for now)

When the user generates a slide:

1. User enters prompt in DeckForge with "Claude" mode enabled
2. User clicks "Generate"
3. DeckForge submits to `/claude-request`
4. DeckForge starts polling `/claude-status/:requestId`
5. You (the assistant) need to:
   - Check the queue
   - Get the prompt
   - Call Wrapper MCP with the prompt
   - Submit the response back

## Next Steps

To make this fully automated, we would need to:
- Create a polling mechanism (cron job or serverless worker)
- Have the assistant continuously monitor the queue
- Auto-process requests as they come in

For now, this is a **semi-automated system** where the user triggers generation and the assistant processes it in real-time during the conversation.
