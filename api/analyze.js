export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  const API_KEY = "AQ.Ab8RN6KbwAvJDEgx1FZ-XYklc2WXUsEZytm7fK710xci2v18eQ"; // ใส่รหัสที่นี่ให้ถูกต้อง
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "แปลงข้อมูลตารางนี้เป็น JSON array รูปแบบนี้เท่านั้น: [{\"date\":\"2025-06-02\",\"values\":[0,1,17,10]}] ข้อมูล: " + text }] }]
      })
    });
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ error: "AI ไม่ตอบกลับ: " + JSON.stringify(data) });
    }
    
    const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(rawText));
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}
