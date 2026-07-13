export default async function handler(req, res) {
  const API_KEY = "";
  const { text } = req.body;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "แปลงข้อมูลตารางเป็น JSON array เท่านั้น: " + text }] }] })
  });
  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
  return res.status(200).json({ raw: rawText });
}
