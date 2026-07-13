export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const systemPrompt = `แปลงข้อมูลตารางเป็น JSON array เท่านั้น ไม่มี markdown ไม่มี backtick
[{"date":"2025-06-02","values":[0,1,17,10]}]
วันที่เป็น YYYY-MM-DD (ค.ศ. ถ้าเป็น พ.ศ. ลบ 543)
values เป็น array ของตัวเลขตามลำดับคอลัมน์ที่พบ`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [{ role: 'user', content: text.slice(0, 8000) }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Anthropic API error' });
    }

    const rawText = (data.content || [])
      .map(b => b.text || '')
      .join('')
      .replace(/```json|```/g, '')
      .trim();

    return res.status(200).json({ raw: rawText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
