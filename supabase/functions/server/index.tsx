import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { SYSTEM_PROMPT } from "./ai-system-prompt.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-863394b5/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// AI SLIDE GENERATION ENDPOINT (Component-Based)
// ============================================

const VALID_COMPONENT_TYPES = [
  "bullet_list", "stat_hero", "kpi_cards", "icon_columns",
  "process_flow", "data_table", "chart", "callout_bar",
  "timeline_track", "icon_grid", "screenshot", "text_block",
];

app.post("/make-server-863394b5/generate-slide", async (c) => {
  try {
    const body = await c.req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return c.json({ error: "Prompt is required and must be a non-empty string" }, 400);
    }

    console.log(`[generate-slide] Received prompt: "${prompt.substring(0, 100)}..."`);

    // Build the full prompt with system instructions
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUSER REQUEST:\n${prompt}\n\nRemember: Return ONLY the JSON object for the slide. No explanation, no markdown code blocks.`;

    // Call MCP wrapper with 120-second timeout for deck generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const mcpResponse = await fetch("https://seth-belowground-cleveland.ngrok-free.dev/mcp", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "ask_claude",
          arguments: {
            prompt: fullPrompt
          }
        }
      })
    }).finally(() => clearTimeout(timeoutId));

    if (!mcpResponse.ok) {
      const errorBody = await mcpResponse.text();
      console.log(`[generate-slide] MCP API error (${mcpResponse.status}): ${errorBody}`);
      return c.json({
        error: `MCP API returned ${mcpResponse.status}: ${errorBody}`,
      }, 502);
    }

    const mcpData = await mcpResponse.json();
    
    if (!mcpData.result || !mcpData.result.content || !mcpData.result.content[0]) {
      console.log("[generate-slide] Invalid MCP response structure");
      return c.json({ error: "Invalid response from MCP wrapper" }, 502);
    }
    
    const content = mcpData.result.content[0].text;

    if (!content) {
      console.log("[generate-slide] No content in MCP response");
      return c.json({ error: "No content returned from Claude via MCP" }, 502);
    }

    console.log(`[generate-slide] Raw AI response: ${content.substring(0, 200)}...`);

    // Parse the JSON from the response
    let slideData;
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      slideData = JSON.parse(cleaned);
    } catch (parseError) {
      console.log(`[generate-slide] Failed to parse AI response as JSON: ${parseError}`);
      return c.json({
        error: "AI returned invalid JSON. Please try rephrasing your prompt.",
        rawContent: content,
      }, 422);
    }

    // Validate component-based structure
    const components = slideData.components || [];
    if (!Array.isArray(components) || components.length === 0) {
      // Check if it's a multi-slide response
      if (slideData.slides && Array.isArray(slideData.slides)) {
        // Validate each slide's components
        for (const slide of slideData.slides) {
          if (slide.components) {
            for (const comp of slide.components) {
              if (!VALID_COMPONENT_TYPES.includes(comp.type)) {
                console.log(`[generate-slide] Invalid component type in multi-slide: ${comp.type}`);
                return c.json({
                  error: `Invalid component type "${comp.type}". Valid: ${VALID_COMPONENT_TYPES.join(", ")}`,
                }, 422);
              }
            }
          }
        }
        console.log(`[generate-slide] Successfully generated multi-slide deck with ${slideData.slides.length} slides`);
        return c.json({ slide: slideData });
      }
      
      console.log("[generate-slide] No components array found in response");
      return c.json({
        error: "Response must have a 'components' array. This is a component-based slide system.",
      }, 422);
    }

    // Validate each component type
    for (const comp of components) {
      if (!comp.type || !VALID_COMPONENT_TYPES.includes(comp.type)) {
        console.log(`[generate-slide] Invalid component type: ${comp.type}`);
        return c.json({
          error: `Invalid component type "${comp.type}". Valid types: ${VALID_COMPONENT_TYPES.join(", ")}`,
        }, 422);
      }
    }

    console.log(`[generate-slide] Successfully generated slide with ${components.length} components: ${components.map((c: any) => c.type).join(', ')}`);
    return c.json({ slide: slideData });

  } catch (error) {
    console.log(`[generate-slide] Unexpected error: ${error}`);
    return c.json({
      error: `Server error during slide generation: ${error}`,
    }, 500);
  }
});

Deno.serve(app.fetch);