export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  
  // ใส่ API Key ของคุณที่นี่ (ลบคำภาษาไทยออก แล้ววางรหัสเลย)
  const API_KEY = "AQ.Ab8RN6KbwAvJDEgx1FZ-XYklc2WXUsEZytm7fK710xci2v18eQ"; 

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "แปลงข้อมูลตารางนี้เป็น JSON array ของ object ที่มี keys คือ date (YYYY-MM-DD) และ values (array ตัวเลข) เท่านั้น ห้ามมี markdown: " + text }] }]
      })
    });

    const data = await response.json();
    if (!data.candidates) return res.status(500).json({ error: "ไม่พบคำตอบจาก AI" });
    
    const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    return res.status(200).json({ raw: rawText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
