export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  
  try {
    const { text } = req.body;
    const API_KEY = "AQ.Ab8RN6KbwAvJDEgx1FZ-XYklc2WXUsEZytm7fK710xci2v18eQ"; // <--- ใส่รหัสตรงนี้
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "แปลงข้อมูลตารางนี้เป็น JSON array ของ object ที่มี keys คือ date และ values (array ตัวเลข) เท่านั้น ห้ามมี markdown: " + text }] }]
      })
    });

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text.trim();
    
    return res.status(200).json({ raw: rawText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
