🛡 AgentAudit — Real-Time AI Safety Shield

AgentAudit is a Chrome/Opera extension that performs real-time ethical analysis of web content using AI.

It detects:

Manipulation tactics

Hidden bias

Privacy risks

Dark patterns

And assigns a calibrated Trust Score directly on the webpage.

Why AgentAudit?

Modern AI-driven platforms influence user decisions at massive scale.
Users currently have no real-time protection against:

Psychological manipulation

False urgency

Biased recommendations

Hidden persuasion tactics

AgentAudit acts as an AI watchdog, auditing content before it influences the user.

 Key Features
 AI-Powered Ethical Audit

Uses Groq (Llama 3.1) to analyze webpage content in real time.

🎯 Calibrated Trust Score

80–100 → Safe

40–79 → Caution

0–39 → High Risk

🛡 Floating Trust Badge

Displays live trust score directly on the webpage.

🌑 AI Shield Overlay Mode

Cinematic full-page risk overlay after analysis.

🖍 Risk Phrase Highlighting

Highlights urgency-based and manipulative phrases.

📊 Animated Trust Meter

Smooth animated score transition.

📈 Risk Trend Tracking

Compares previous and current page scores.

🚩 Structured Risk Flags

Manipulation Detected

Bias Detected

PII Request Detected

🏗 Tech Stack

React (Vite)

Chrome Extension Manifest v3

Groq API (Llama 3.1)

chrome.scripting API

Prompt-engineered scoring logic

⚙️ How It Works

User clicks "Analyze Current Page"

Extension extracts webpage content

Content is sent to Groq AI

AI classifies page type and evaluates ethical risks

Trust Score is calculated and calibrated

Results are displayed:

Popup dashboard

Floating badge

Full-page overlay

Highlighted risky phrases

🛠 Installation (Local Development)
npm install
npm run build

Then:

Open browser

Go to chrome://extensions

Enable Developer Mode

Click “Load Unpacked”

Select the dist folder

🔐 Environment Variables

Create a .env file:

VITE_GROQ_KEY=your_api_key_here
