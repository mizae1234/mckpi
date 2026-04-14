const dot = require('dotenv');
dot.config();
const key = process.env.GEMINI_API_KEY;
if (!key) { console.log("NO KEY"); process.exit(1); }

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello" }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}
test();
