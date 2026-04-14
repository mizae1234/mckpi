const dot = require('dotenv');
dot.config();
const key = process.env.GEMINI_API_KEY;
if (!key) { console.log("NO KEY"); process.exit(1); }

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.models) {
    console.log("AVAILABLE MODELS:");
    for (const m of data.models) {
      if (m.name.includes("gemini")) {
        console.log("-", m.name, "(generateContent:", m.supportedGenerationMethods?.includes("generateContent") ? "YES" : "NO", ")");
      }
    }
  } else {
    console.log(data);
  }
}
test();
