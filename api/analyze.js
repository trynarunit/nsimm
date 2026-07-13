export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  const { text } = req.body;
  const API_KEY = "AQ.Ab8RN6KbwAvJDEgx1FZ-XYklc2WXUsEZytm7fK710xci2v18eQ";

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "แปลงข้อความนี้เป็น JSON array ของ object ที่มี keys คือ date (YYYY-MM-DD) และ values (array ของตัวเลข) เท่านั้น ห้ามมีคำอธิบาย: " + text }] }]
      })
    });

    const data = await response.json();
    
    // ตรวจสอบว่าได้ข้อมูลจริงไหม
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      return res.status(500).json({ error: "Gemini ไม่ตอบกลับข้อมูลที่ถูกต้อง" });
    }

    const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(rawText));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
