import { useState } from "react";

function App() {
  const [pageText, setPageText] = useState("");
  const [risk, setRisk] = useState("--");
  const [explanation, setExplanation] = useState("");
  const [riskColor, setRiskColor] = useState("gray");
  const [flags, setFlags] = useState({
  manipulation: false,
  pii: false,
  bias: false
});
  const [displayScore, setDisplayScore] = useState(0);
  const [previousScore, setPreviousScore] = useState(null);

  const analyzePage = async () => {
    console.log("Button clicked");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: () => {
    const riskyPatterns = [
      /limited time/gi,
      /only \d+ left/gi,
      /act fast/gi,
      /urgent/gi,
      /exclusive deal/gi
    ];

    function highlight(node) {
      if (node.nodeType === 3) {
        let text = node.nodeValue;
        riskyPatterns.forEach(pattern => {
          if (pattern.test(text)) {
            const span = document.createElement("span");
            span.innerHTML = text.replace(
              pattern,
              match => `<mark style="background:red;color:white;padding:2px;border-radius:3px;">${match}</mark>`
            );
            node.replaceWith(span);
          }
        });
      } else {
        node.childNodes.forEach(child => highlight(child));
      }
    }

    highlight(document.body);

    return document.body.innerText;
  }
});

    const text = results[0].result;
    setPageText(text.substring(0, 500));
    

     try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_GROQ_KEY}`
  },
  body: JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are an AI safety auditor. Always return pure JSON."
      },
      {
        role: "user",
        content: `
You are a digital ethics auditor evaluating webpage safety.

STEP 1: First classify the page type:
- "ecommerce"
- "news"
- "social"
- "financial"
- "unknown"

STEP 2: Use this scoring baseline:

BASE SCORES:
- Trusted ecommerce platform → start at 80
- Informational/news site → start at 85
- Unknown commercial site → start at 70
- Financial/investment promotions → start at 60

STEP 3: Subtract points ONLY for serious ethical risks:
- False urgency / fake scarcity → -20
- Misleading claims → -25
- Requests unnecessary personal data → -30
- Discriminatory or harmful bias → -30

IMPORTANT:
- Normal discounts, brand placement, recommendations, and sponsored labels are NOT manipulation.
- Standard marketing language is acceptable.
- Assume large known platforms (like Amazon, Flipkart, etc.) are legitimate unless clearly deceptive.

Return ONLY JSON:

{
  "page_type": "type",
  "risk_score": number (0-100),
  "manipulation_detected": true/false,
  "pii_request_detected": true/false,
  "bias_detected": true/false,
  "explanation": "brief explanation"
}

Webpage Content:
${text.substring(0, 3000)}
        `
      }
    ],
    temperature: 0.2
  })
});

   const data = await response.json();
   console.log("Groq FULL response:", data);
   console.log("Status:", response.status);

  const aiText = data.choices?.[0]?.message?.content;

  if (!aiText) {
    console.error("Unexpected API response:", data);
    setRisk("API Error");
    return;
  }

  const cleaned = aiText.replace(/```json|```/g, "").trim();

  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error:", cleaned);
    setRisk("Parse Error");
    return;
  }

   setFlags({
  manipulation: parsed.manipulation_detected,
  pii: parsed.pii_request_detected,
  bias: parsed.bias_detected
});

  const score = parsed.risk_score;

let adjustedScore = score;

if (parsed.manipulation_detected) adjustedScore -= 15;
if (parsed.bias_detected) adjustedScore -= 10;
if (parsed.pii_request_detected) adjustedScore -= 25;

if (adjustedScore < 10) adjustedScore = 10;

const oldScore = displayScore;

await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: (score) => {
    const existing = document.getElementById("agent-audit-badge");
    if (existing) existing.remove();

    const badge = document.createElement("div");
    badge.id = "agent-audit-badge";

    let color = "green";
    let label = "Safe";

    if (score < 40) {
      color = "red";
      label = "High Risk";
    } else if (score < 75) {
      color = "orange";
      label = "Caution";
    }

    badge.innerHTML = `🛡 Trust Score: ${score} (${label})`;

    badge.style.position = "fixed";
    badge.style.top = "20px";
    badge.style.right = "20px";
    badge.style.padding = "10px 15px";
    badge.style.background = color;
    badge.style.color = "white";
    badge.style.fontWeight = "bold";
    badge.style.borderRadius = "8px";
    badge.style.zIndex = "999999";
    badge.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";

    document.body.appendChild(badge);
  },
  args: [adjustedScore]
});

await chrome.scripting.executeScript({
  target: { tabId: tab.id },
  func: (score) => {

    const oldOverlay = document.getElementById("agent-audit-overlay");
    if (oldOverlay) oldOverlay.remove();

    const overlay = document.createElement("div");
    overlay.id = "agent-audit-overlay";

    let color = "green";
    let label = "Safe";

    if (score < 40) {
      color = "red";
      label = "High Risk";
    } else if (score < 75) {
      color = "orange";
      label = "Caution";
    }

    overlay.innerHTML = `
      <div style="
        background: ${color};
        padding: 25px 40px;
        border-radius: 12px;
        color: white;
        font-size: 22px;
        font-weight: bold;
        text-align: center;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
        animation: fadeIn 0.4s ease;
      ">
        🛡 AI Risk Analysis Complete<br/>
        Trust Score: ${score} (${label})
      </div>
    `;

    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.4)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "999998";

    document.body.appendChild(overlay);

    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
      overlay.style.transition = "opacity 0.5s ease";
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }, 2000);

  },
  args: [adjustedScore]
});

let start = 0;
const end = adjustedScore;

const interval = setInterval(() => {
  start += 2;
  if (start >= end) {
    start = end;
    clearInterval(interval);
    setPreviousScore(oldScore);
  }
  setDisplayScore(start);
}, 15);

setRisk(end + " / 100");

let label = "";

if (score >= 75) {
  setRiskColor("green");
  label = "Safe Interaction";
} else if (score >= 40) {
  setRiskColor("orange");
  label = "Use Caution";
} else {
  setRiskColor("red");
  label = "High Risk Detected";
}

setExplanation(label + " — " + (parsed.explanation || ""));

} catch (error) {
  console.error(error);
  setRisk("Error");
}
  };

  return (
    <><><div style={{
      width: "300px",
      padding: "20px",
      fontFamily: "Arial"
    }}>
      <h2>🛡 AgentAudit</h2>
      <p>AI Response Safety Checker</p>

      <button
        onClick={analyzePage}
        style={{
          padding: "10px",
          width: "100%",
          cursor: "pointer"
        }}
      >
        Analyze Current Page
      </button>

      <div style={{
        marginTop: "15px",
        fontSize: "12px",
        maxHeight: "120px",
        overflowY: "auto",
        background: "#000000",
        padding: "8px",
        borderRadius: "8px"
      }}>
        {pageText || "No data yet"}
      </div>

      <div style={{
  marginTop: "10px",
  padding: "16px",
  background: riskColor,
  color: "white",
  borderRadius: "12px",
  fontWeight: "bold",
  textAlign: "center",
  fontSize: "20px",
  transition: "all 0.3s ease"
}}>
  Trust Score: {displayScore} / 100
</div>

{previousScore !== null && (
  <div style={{
    marginTop: "8px",
    fontSize: "12px",
    color: "#aaa",
    textAlign: "center"
  }}>
    Previous: {previousScore} →
    {displayScore > previousScore ? " ↑ Improved" :
     displayScore < previousScore ? " ↓ Lower" :
     " → Same"}
  </div>
)}
    </div><div style={{
      marginTop: "12px",
      fontSize: "12px",
      background: "#111",
      padding: "10px",
      borderRadius: "8px",
      color: "#ddd"
    }}>
        {explanation}
      </div></><div style={{
        marginTop: "10px",
        background: "#1a1a1a",
        padding: "10px",
        borderRadius: "8px",
        fontSize: "12px"
      }}>
        <div>Manipulation: {flags.manipulation ? "⚠️ Detected" : "✅ Not Detected"}</div>
        <div>PII Request: {flags.pii ? "⚠️ Detected" : "✅ Not Detected"}</div>
        <div>Bias: {flags.bias ? "⚠️ Detected" : "✅ Not Detected"}</div>
      </div></>
  )
}

export default App;