#!/bin/bash

# ============================================================
# Start Both Servers (Bridge + Frontend)
# ============================================================

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Starting Emma's PPT Generator (Both Servers) ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    echo "✅ Servers stopped"
    exit
}

trap cleanup EXIT INT TERM

# Start bridge server in background
echo "🔌 Starting bridge server (port 4000)..."
node claude-bridge-server.js &
BRIDGE_PID=$!

# Wait a moment for bridge to start
sleep 2

# Check if bridge is running
if lsof -ti:4000 > /dev/null 2>&1; then
    echo "   ✅ Bridge server running (PID: $BRIDGE_PID)"
else
    echo "   ❌ Bridge server failed to start"
    exit 1
fi

echo ""
echo "🌐 Starting frontend (port 5173)..."
echo ""
echo "────────────────────────────────────────────────"
echo "  Open in browser: http://localhost:5173"
echo "  Press Ctrl+C to stop both servers"
echo "────────────────────────────────────────────────"
echo ""

# Start frontend in foreground (so logs are visible)
npm run dev

# This will only run if npm run dev exits
cleanup
