export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  const API_KEY = "AQ.Ab8RN6KbwAvJDEgx1FZ-XYklc2WXUsEZytm7fK710xci2v18eQ"; 
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "แปลงข้อมูลตารางเป็น JSON array เท่านั้น: " + text }] }] })
    });
    const data = await response.json();

    // เช็คว่ามีข้อมูลตอบกลับมาไหม
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "AI ไม่ตอบกลับ: " + JSON.stringify(data) });
    }

    const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    return res.status(200).json({ raw: rawText });
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}
