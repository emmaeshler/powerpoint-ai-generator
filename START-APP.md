# 🚀 Quick Start Guide

## First Time Setup (New Machine)

1. **Clone the repo** (if not already done)
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup Azure credentials:**
   - Copy `.env.example` to `.env`
   - Fill in `FOUNDRY_TARGET_URI` and `MODEL`
   - Run `az login` to authenticate

## Starting the App

**Option 1: Easy Way (One Command)**
```bash
./start-both.sh
```
Starts both servers automatically. Press `Ctrl+C` to stop both.

**Option 2: Manual (Two Terminals)**

### Terminal 1: Bridge Server
```bash
node claude-bridge-server.js
```
✅ Should show: "Server is running on http://localhost:4000"

### Terminal 2: Frontend
```bash
npm run dev
```
✅ Should show: "Local: http://localhost:5173"

## Open in Browser
Visit: **http://localhost:5173**

---

## Troubleshooting

**App shows yellow warning banner?**
→ Bridge server isn't running. Check Terminal 1.

**"AI generation failed"?**
→ Run `az login` and check your `.env` file.

**Port already in use?**
→ Kill existing process: `lsof -ti:4000 | xargs kill` or `lsof -ti:5173 | xargs kill`
