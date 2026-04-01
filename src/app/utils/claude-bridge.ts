// Bridge between DeckForge and Claude via Wrapper MCP
// This file will store the MCP connection and make it available to the React app

import { buildClaudePrompt } from './claude-generator';

// Global storage for MCP call handler
let claudeHandler: ((prompt: string) => Promise<string>) | null = null;

/**
 * Register the MCP handler (called by the assistant when setting up the connection)
 */
export function registerClaudeHandler(handler: (prompt: string) => Promise<string>) {
  claudeHandler = handler;
  console.log('[Claude Bridge] Handler registered successfully');
}

/**
 * Call Claude via the Wrapper MCP
 * This will be used by the React components
 */
export async function callClaudeForSlide(userPrompt: string): Promise<string> {
  if (!claudeHandler) {
    throw new Error('Claude MCP handler not registered. The assistant needs to set up the connection first.');
  }
  
  const fullPrompt = buildClaudePrompt(userPrompt);
  return await claudeHandler(fullPrompt);
}

/**
 * Check if Claude MCP is available
 */
export function isClaudeAvailable(): boolean {
  return claudeHandler !== null;
}
