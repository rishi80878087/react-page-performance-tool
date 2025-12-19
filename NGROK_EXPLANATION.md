# Ngrok Explanation - How It Works

## What is Ngrok?

Ngrok creates a secure tunnel from the internet to your localhost. It gives you a public URL that forwards to your local application.

## Example Scenario

### Your Setup:
- Your React app is running on: `http://localhost:3000`
- You want to test it with the performance tool
- But the tool's backend is deployed on a server (can't access your localhost)

### Solution: Use Ngrok

**Step 1: Install Ngrok**
```bash
# Download from ngrok.com or use:
brew install ngrok  # macOS
# or
npm install -g ngrok
```

**Step 2: Start Your App**
```bash
# Terminal 1: Your React app
cd my-react-app
npm start
# App runs on http://localhost:3000
```

**Step 3: Create Tunnel**
```bash
# Terminal 2: Run ngrok
ngrok http 3000
```

**What happens:**
```
ngrok                                                                      
                                                                          
Session Status                online                                      
Account                       Your Account (Plan: Free)                    
Version                       3.x.x                                       
Region                        United States (us)                           
Latency                       45ms                                         
Web Interface                 http://127.0.0.1:4040                       
Forwarding                    https://abc123xyz.ngrok-free.app -> http://localhost:3000
                                                                          
Connections                   ttl     opn     rt1     rt5     p50     p90  
                              0       0       0.00    0.00    0.00    0.00
```

**Step 4: Use the Ngrok URL**
- Ngrok gives you: `https://abc123xyz.ngrok-free.app`
- This URL forwards to your `localhost:3000`
- Now you can use this URL in the performance tool!

### Visual Flow:

```
Your Local Machine:
┌─────────────────┐
│ localhost:3000  │ ← Your React app running here
└────────┬────────┘
         │
         │ ngrok tunnel
         │
         ▼
┌─────────────────┐
│  Ngrok Server   │ ← Creates public URL
└────────┬────────┘
         │
         │ Public URL: https://abc123xyz.ngrok-free.app
         │
         ▼
┌─────────────────┐
│  Internet       │ ← Anyone can access
└────────┬────────┘
         │
         │ Your performance tool backend
         │ can now access this URL!
         ▼
┌─────────────────┐
│  Performance    │ ← Scans the ngrok URL
│  Tool Backend   │   (which forwards to localhost:3000)
└─────────────────┘
```

## How It Works

1. **Ngrok runs on your machine** (Terminal 2)
2. **Creates a tunnel** from internet → your localhost:3000
3. **Gives you a public URL** (e.g., `https://abc123xyz.ngrok-free.app`)
4. **When someone visits that URL**, ngrok forwards the request to your localhost:3000
5. **Your performance tool** can now scan that public URL
6. **The scan actually tests** your localhost:3000 app!

## Example Usage

**Before Ngrok:**
```
Performance Tool Backend (deployed) → ❌ Cannot reach → localhost:3000 (your machine)
```

**After Ngrok:**
```
Performance Tool Backend (deployed) → ✅ Can reach → https://abc123xyz.ngrok-free.app → ✅ Forwards to → localhost:3000
```

## Important Notes

- **Ngrok URL changes** every time you restart ngrok (free plan)
- **Ngrok URL is public** - anyone with the URL can access your app
- **Ngrok is temporary** - when you close ngrok, the URL stops working
- **Perfect for testing** - safe for development, not for production

## Alternative: Localtunnel

Similar tool, simpler:
```bash
npm install -g localtunnel
lt --port 3000
# Gives you: https://random-name.loca.lt
```

## For Your Tool

**User Workflow:**
1. User starts their app on localhost:3000
2. User runs `ngrok http 3000` in another terminal
3. User copies the ngrok URL (e.g., `https://abc123xyz.ngrok-free.app`)
4. User pastes that URL into your performance tool
5. Your tool scans the ngrok URL
6. The scan actually tests their localhost:3000 app!

**This solves the localhost problem!**

