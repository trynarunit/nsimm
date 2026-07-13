export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { base64, mediaType } = req.body;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { inline_data: { mime_type: mediaType, data: base64 } },
          { text: "อ่านตารางจากรูปนี้ ส่งกลับเป็นข้อความ" }
        ]}]
      })
    });
    const data = await response.json();
    return res.status(200).json({ content: data.candidates[0].content.parts[0].text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
