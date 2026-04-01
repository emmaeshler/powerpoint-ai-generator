#!/bin/bash

echo "🚀 Starting DeckForge Dev Environment..."

# Kill any existing processes on the ports
echo "📦 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

sleep 1

# Start MCP server in background
echo "🔧 Starting MCP server..."
cd /Users/emmaeshler/figma-mcp/figma-mcp
node server.js > /tmp/mcp-server.log 2>&1 &
MCP_PID=$!

# Start PowerPoint app dev server in background
echo "⚛️  Starting PowerPoint app..."
cd /Users/emmaeshler/Documents/Powerpoint-App-main
npm run dev > /tmp/vite-dev.log 2>&1 &
VITE_PID=$!

# Wait for servers to be ready
echo "⏳ Waiting for servers to start..."
sleep 3

# Check if both are running
if lsof -ti:3000 > /dev/null 2>&1 && lsof -ti:5173 > /dev/null 2>&1; then
    echo ""
    echo "✅ Both servers running!"
    echo ""
    echo "   MCP Server:      http://localhost:3000/mcp"
    echo "   PowerPoint App:  http://localhost:5173/"
    echo ""
    echo "📝 Logs:"
    echo "   MCP:  tail -f /tmp/mcp-server.log"
    echo "   Vite: tail -f /tmp/vite-dev.log"
    echo ""
    echo "🛑 To stop: kill $MCP_PID $VITE_PID"
    echo ""
else
    echo ""
    echo "❌ Error: One or more servers failed to start"
    echo "Check logs:"
    echo "   MCP:  cat /tmp/mcp-server.log"
    echo "   Vite: cat /tmp/vite-dev.log"
    exit 1
fi
