export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const systemPrompt = `คุณคือระบบแปลงข้อมูลดิบให้เป็น JSON สำหรับตารางสรุปข้อมูล

หน้าที่: อ่านข้อความที่ผู้ใช้ส่งมา (อาจเป็นตาราง, ประโยค, รายการ, หรือ CSV) แล้วดึงข้อมูล "วันที่" และ "ค่าตัวเลข" ออกมา

กฎการแปลง:
1. วันที่ต้องแปลงเป็นรูปแบบ YYYY-MM-DD (ค.ศ.) — ถ้าพบปี พ.ศ. (เช่น 2568) ให้ลบ 543 ก่อน (2568 - 543 = 2025)
2. ถ้าข้อความไม่มีปี ให้ใช้ปีปัจจุบัน (ค.ศ. 2025)
3. ถ้าข้อความไม่มีวันที่ชัดเจนเลย ให้ใส่ date เป็น "" (ค่าว่าง) แต่ยังคงดึงค่าตัวเลขออกมา
4. values คือ array ของตัวเลขทั้งหมดที่เจอในบรรทัด/รายการนั้น เรียงตามลำดับที่พบในข้อความ
5. ถ้าเจอคำอธิบายจำนวน เช่น "ห้าคน" "สิบ" ให้แปลงเป็นตัวเลข
6. ถ้าบรรทัดไม่มีตัวเลขเลย ให้ข้ามบรรทัดนั้นไป ไม่ต้องสร้าง entry

รูปแบบผลลัพธ์ (ต้องเป็น JSON array เท่านั้น ห้ามมี markdown ห้ามมี backtick ห้ามมีคำอธิบายอื่น):
[{"date":"2025-06-02","values":[0,1,17,10]},{"date":"2025-06-03","values":[5,2]}]

ตัวอย่าง:
input: "2 มิ.ย. 68 | 5 | 3"
output: [{"date":"2025-06-02","values":[5,3]}]

input: "วันที่ 2 มิถุนายน 2568 มีคนเข้ามา 5 คน ออกไป 2 คน"
output: [{"date":"2025-06-02","values":[5,2]}]

ตอบเฉพาะ JSON array เท่านั้น ไม่มีข้อความอื่นใดนอกจากนี้`;

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          parts: [{ text: text.slice(0, 8000) }]
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 3000
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'Google AI API error' });
    }

    const rawText = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('')
      .replace(/```json|```/g, '')
      .trim();

    if (!rawText) {
      return res.status(500).json({ error: 'ไม่ได้รับผลลัพธ์จาก AI' });
    }

    return res.status(200).json({ raw: rawText });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
