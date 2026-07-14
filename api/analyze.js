export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Body ไม่ใช่ JSON ที่ถูกต้อง: ' + e.message });
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'ไม่พบข้อมูล body ที่ส่งมา' });
  }

  const { text } = body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required (ไม่พบข้อความที่ส่งมา)' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ไม่พบ GOOGLE_API_KEY ใน Environment Variables ของ Vercel' });
  }

  const systemPrompt = `คุณคือระบบแปลงข้อมูลดิบให้เป็น JSON สำหรับตารางสรุปข้อมูล

หน้าที่: อ่านข้อความที่ผู้ใช้ส่งมา (อาจเป็นประโยคบรรยาย, ตาราง, รายการ, หรือ CSV) แล้วดึงข้อมูล "วันที่" และ "ค่าตัวเลขของแต่ละคอลัมน์" ออกมา

กรณีพิเศษ: ถ้าข้อความมีชื่อหมวดหมู่ (เช่น NON-B, NON-O, NON-ED, Non-b, Non-o, Non-ed, อื่นๆ, โรงแรม, หอพัก ฯลฯ) และแต่ละหมวดมีค่าย่อย เช่น "รับ" กับ "ออก" ให้ดึงค่าตัวเลขออกมาตามลำดับที่ปรากฏในข้อความ โดยไม่ต้องสนใจชื่อหมวดหมู่ เก็บแค่ตัวเลขเรียงตามลำดับที่เจอ

กฎการแปลงวันที่:
1. แปลงเป็นรูปแบบ YYYY-MM-DD (ค.ศ. เท่านั้น)
2. ถ้าปีที่พบเป็นเลข 2 หลัก (เช่น 68, 69) ให้ตีความว่าเป็นปี พ.ศ. เต็ม (เช่น 69 = พ.ศ. 2569) แล้วแปลงเป็น ค.ศ. โดยลบ 543 (พ.ศ. 2569 - 543 = ค.ศ. 2026)
3. ถ้าปีที่พบเป็นเลข 4 หลักและมากกว่า 2500 ให้ถือว่าเป็น พ.ศ. แล้วลบ 543 เช่นเดียวกัน
4. ถ้าไม่มีปีระบุมา ให้ใช้ปีปัจจุบัน (ค.ศ. 2025)
5. ถ้าไม่มีวันที่ชัดเจนเลยในข้อความ ให้ใส่ date เป็น ""

กฎการแปลงตัวเลข:
1. values คือ array ของตัวเลขทั้งหมดที่เจอ เรียงตามลำดับที่ปรากฏในข้อความ (ซ้ายไปขวา, บนลงล่าง)
2. ถ้าเจอคำอธิบายจำนวนเป็นคำ (เช่น "ห้า" "สิบ" "ศูนย์") ให้แปลงเป็นตัวเลข
3. ถ้าบรรทัด/ข้อความช่วงนั้นไม่มีตัวเลขเลย ให้ข้ามไป ไม่สร้าง entry ว่าง

รูปแบบผลลัพธ์ (ต้องเป็น JSON array เท่านั้น ห้ามมี markdown ห้ามมี backtick ห้ามมีคำอธิบายอื่นใดๆ):
[{"date":"2025-06-02","values":[0,1,17,10]}]

ตัวอย่างที่ 1 (ตาราง):
input: "2 มิ.ย. 68 | 5 | 3"
output: [{"date":"2025-06-02","values":[5,3]}]

ตัวอย่างที่ 2 (ประโยคบรรยายซับซ้อน):
input: "สำหรับข้อมูลของวันที่ 2 มิ.ย. 69 มีดังนี้ครับ: NON-B (รับ) เท่ากับ 0, NON-B (ออก) เท่ากับ 1, NON-O (รับ) เท่ากับ 17, NON-O (ออก) เท่ากับ 10, NON-ED (รับ) เท่ากับ 0, NON-ED (ออก) เท่ากับ 0, อื่นๆ (รับ) เท่ากับ 0, และอื่นๆ (ออก) เท่ากับ 0"
output: [{"date":"2026-06-02","values":[0,1,17,10,0,0,0,0]}]

ตัวอย่างที่ 3 (หลายวันในข้อความเดียว):
input: "วันที่ 1 มิ.ย. 69: รับ 5 ออก 2\\nวันที่ 2 มิ.ย. 69: รับ 3 ออก 1"
output: [{"date":"2026-06-01","values":[5,2]},{"date":"2026-06-02","values":[3,1]}]

ตอบเฉพาะ JSON array เท่านั้น ไม่มีข้อความอื่นใดนอกจากนี้`;

  try {
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: text.slice(0, 8000) }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 3000 }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'Google AI ตอบกลับมาไม่เป็น JSON: ' + responseText.slice(0, 300) });
    }

    if (data.error) {
      return res.status(500).json({ error: 'Google AI error: ' + (data.error.message || JSON.stringify(data.error)) });
    }

    const rawText = (data.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('')
      .replace(/```json|```/g, '')
      .trim();

    if (!rawText) {
      return res.status(500).json({ error: 'AI ไม่ได้ตอบข้อความใดๆ กลับมา: ' + JSON.stringify(data).slice(0, 300) });
    }

    return res.status(200).json({ raw: rawText });
  } catch (err) {
    return res.status(500).json({ error: 'Server exception: ' + err.message });
  }
}
