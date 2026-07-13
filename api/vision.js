export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mediaType } = req.body;

  if (!base64) {
    return res.status(400).json({ error: 'base64 image is required' });
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mediaType, data: base64 } },
            { text: 'อ่านตารางจากรูปภาพนี้ให้ครบถ้วน ระบุจำนวนคอลัมน์และแถวที่แท้จริง อ่านข้อมูลตัวเลขให้ชัดถูกต้อง แล้วสรุปเป็นข้อความที่อ่านง่าย' }
          ]
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4000
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Google AI API error' });
    }

    const content = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('');

    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
