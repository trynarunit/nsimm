export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: text.slice(0, 8000) })
});

const data = await response.json();
if (data.error) throw new Error(data.error);
const rawText = data.raw;
const parsed = JSON.parse(rawText);

    return res.status(200).json({ raw: rawText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
