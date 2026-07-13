export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { text } = req.body;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "แปลงข้อมูลตารางเป็น JSON array เท่านั้น ไม่มี markdown ไม่มี backtick: " + text }] }] })
    });
    const data = await response.json();
    
    // ตรงนี้คือจุดสำคัญที่แก้ให้รองรับการตอบกลับจาก Gemini ค่ะ
    const rawText = data.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    return res.status(200).json({ raw: rawText });
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}
