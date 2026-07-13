<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📊 ตารางสรุปข้อมูล</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Noto Sans Thai', 'Sarabun', Arial, sans-serif;
      background: #0A1120;
      color: #E2E8F0;
      line-height: 1.6;
    }
    input, button, textarea, select { font-family: inherit; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
const { useState, useMemo, useRef } = React;

const COLORS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#06B6D4","#84CC16"];
const THAI_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const MONTH_SHORT = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

let idCounter = 1000;
const genId = () => String(++idCounter);

const formatThai = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
};

const getMonthKey = (dateStr) => dateStr.slice(0, 7);
const getMonthLabel = (key) => {
  const [y, m] = key.split('-');
  return `${THAI_MONTHS[parseInt(m) - 1]} ${parseInt(y) + 543}`;
};

// ========== Settings Modal ==========
function SettingsModal({ tableId, config, onSave, onClose }) {
  const [title, setTitle] = useState(config.title);
  const [groups, setGroups] = useState([...config.groups]);
  const [cols, setCols] = useState([...config.cols]);

  const addGroup = () => {
    setGroups([...groups, { id: genId(), label: 'กลุ่มใหม่', color: COLORS[groups.length % COLORS.length] }]);
  };

  const addCol = () => {
    setCols([...cols, { id: genId(), label: 'คอลัมน์ใหม่' }]);
  };

  const updateGroup = (idx, field, value) => {
    const newGroups = [...groups];
    newGroups[idx] = { ...newGroups[idx], [field]: value };
    setGroups(newGroups);
  };

  const updateCol = (idx, field, value) => {
    const newCols = [...cols];
    newCols[idx] = { ...newCols[idx], [field]: value };
    setCols(newCols);
  };

  const removeGroup = (idx) => {
    if (groups.length > 1) setGroups(groups.filter((_, i) => i !== idx));
  };

  const removeCol = (idx) => {
    if (cols.length > 1) setCols(cols.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#1E293B', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', border: '1px solid #334155' }}>
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>⚙️ ตั้งค่าตาราง</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 24, cursor: 'pointer', padding: 0 }}>×</button>
        </div>
        
        <div style={{ padding: '20px 24px 24px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>ชื่อตาราง</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px 12px', background: '#0F172A', border: '1px solid #334155', borderRadius: 8, color: '#E2E8F0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>กลุ่ม</label>
              <button onClick={addGroup} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#3B82F6', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ เพิ่ม</button>
            </div>
            {groups.map((g, idx) => (
              <div key={g.id} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <input type="color" value={g.color} onChange={(e) => updateGroup(idx, 'color', e.target.value)} style={{ width: 40, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                <input value={g.label} onChange={(e) => updateGroup(idx, 'label', e.target.value)} style={{ flex: 1, padding: '8px 12px', background: '#0F172A', border: '1px solid #334155', borderRadius: 6, color: '#E2E8F0', fontSize: 13 }} />
                <button onClick={() => removeGroup(idx)} disabled={groups.length <= 1} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#EF4444', color: 'white', cursor: groups.length <= 1 ? 'not-allowed' : 'pointer', opacity: groups.length <= 1 ? 0.5 : 1 }}>ลบ</button>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>คอลัมน์</label>
              <button onClick={addCol} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#10B981', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ เพิ่ม</button>
            </div>
            {cols.map((c, idx) => (
              <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                <input value={c.label} onChange={(e) => updateCol(idx, 'label', e.target.value)} style={{ flex: 1, padding: '8px 12px', background: '#0F172A', border: '1px solid #334155', borderRadius: 6, color: '#E2E8F0', fontSize: 13 }} />
                <button onClick={() => removeCol(idx)} disabled={cols.length <= 1} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#EF4444', color: 'white', cursor: cols.length <= 1 ? 'not-allowed' : 'pointer', opacity: cols.length <= 1 ? 0.5 : 1 }}>ลบ</button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onSave({ title, groups, cols })} style={{ flex: 1, padding: 12, borderRadius: 9, border: 'none', background: '#3B82F6', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ บันทึก</button>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 9, border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== AI Import Modal ==========
function ImportModal({ onClose, onImport }) {
  const [tab, setTab] = useState('paste');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedTable, setSelectedTable] = useState('table1');
  const [extractedColumns, setExtractedColumns] = useState(null);
  const fileRef = useRef();

  const readFile = async (file) => {
    setError('');
    setLoading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let content = '';

      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        workbook.SheetNames.forEach((sheetName) => {
          content += XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]) + '\n';
        });
        setText(content);
        setTab('paste');
      } else if (['png', 'jpg', 'jpeg'].includes(ext)) {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
        const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg';
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 4000,
            messages: [{
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
                { type: 'text', text: 'อ่านตารางจากรูปภาพนี้ให้ครบถ้วน ระบุจำนวนคอลัมน์และแถวที่แท้จริง อ่านข้อมูลตัวเลขให้ชัดถูกต้อง' }
              ]
            }]
          })
        });
        
        const data = await response.json();
        content = (data.content || []).map(b => b.text || '').join('');
        setText(content);
        setTab('paste');
      } else if (ext === 'pdf') {
        setError('PDF: กรุณาแปลง PDF เป็นรูป JPEG/PNG แล้วอัปโหลดใหม่');
        setLoading(false);
        return;
      } else {
        content = await file.text();
        setText(content);
        setTab('paste');
      }

      setPreview(null);
      setExtractedColumns(null);
    } catch (err) {
      setError('อ่านไฟล์ไม่ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyze = async () => {
    if (!text.trim()) {
      setError('กรุณาใส่ข้อความก่อน');
      return;
    }

    setLoading(true);
    setError('');
    setPreview(null);

    try {
      const systemPrompt = `แปลงข้อมูลตารางเป็น JSON array เท่านั้น ไม่มี markdown ไม่มี backtick
[{"date":"2025-06-02","values":[0,1,17,10]}]
วันที่เป็น YYYY-MM-DD (ค.ศ. ถ้าเป็น พ.ศ. ลบ 543)
values เป็น array ของตัวเลขตามลำดับคอลัมน์ที่พบ`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          system: systemPrompt,
          messages: [{ role: 'user', content: text.slice(0, 8000) }]
        })
      });

      const data = await response.json();
      const rawText = (data.content || []).map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(rawText);

      if (!Array.isArray(parsed)) {
        throw new Error('ผลลัพธ์ไม่ใช่ array');
      }

      setPreview(parsed);
    } catch (err) {
      setError('วิเคราะห์ไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const doImport = (mode) => {
    const newRows = preview.map(p => ({
      id: genId(),
      date: p.date || '',
      values: p.values || []
    }));

    onImport(newRows, mode, selectedTable);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#1E293B', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'auto', border: '1px solid #334155' }}>
        <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', margin: 0 }}>🤖 นำเข้าข้อมูลด้วย AI</h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '8px 0 0 0' }}>รองรับ .xlsx · .csv · .txt · .jpg · .png</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 24, cursor: 'pointer', padding: 0 }}>×</button>
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: 16, gap: 0 }}>
            <button onClick={() => setTab('paste')} style={{ padding: '10px 16px', border: 'none', background: tab === 'paste' ? '#0F172A' : 'transparent', color: tab === 'paste' ? '#60A5FA' : '#64748B', borderBottom: tab === 'paste' ? '2px solid #3B82F6' : '2px solid transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📝 วางข้อความ</button>
            <button onClick={() => setTab('file')} style={{ padding: '10px 16px', border: 'none', background: tab === 'file' ? '#0F172A' : 'transparent', color: tab === 'file' ? '#60A5FA' : '#64748B', borderBottom: tab === 'file' ? '2px solid #3B82F6' : '2px solid transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>📁 ไฟล์ / รูป</button>
          </div>

          {tab === 'paste' ? (
            <textarea value={text} onChange={(e) => { setText(e.target.value); setPreview(null); setError(''); }} placeholder="วางข้อความ ตาราง หรือสรุปข้อมูลที่นี่..." style={{ width: '100%', height: 200, background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: 12, color: '#E2E8F0', fontSize: 13, resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }} />
          ) : (
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); readFile(e.dataTransfer.files[0]); }} onClick={() => fileRef.current?.click()} style={{ border: `2px dashed ${dragOver ? '#3B82F6' : '#334155'}`, borderRadius: 12, padding: '50px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#1a2d4d' : '#0F172A', transition: 'all 0.2s' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
              <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500, marginBottom: 6 }}>ลากไฟล์มาวาง หรือคลิก</div>
              <div style={{ fontSize: 12, color: '#475569' }}>.xlsx · .csv · .txt · .jpg · .png</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt,.jpg,.jpeg,.png,.pdf" style={{ display: 'none' }} onChange={(e) => readFile(e.target.files[0])} />
            </div>
          )}

          {error && <div style={{ marginTop: 12, background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: 13 }}>⚠️ {error}</div>}

          {text && !preview && (
            <button onClick={analyze} disabled={loading} style={{ marginTop: 16, width: '100%', padding: 13, borderRadius: 10, border: 'none', background: loading ? '#334155' : 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '🔄 AI กำลังวิเคราะห์...' : '✨ วิเคราะห์ด้วย AI'}
            </button>
          )}

          {preview && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#34D399', marginBottom: 12 }}>✅ พบ {preview.length} รายการ</div>
              <div style={{ background: '#0F172A', borderRadius: 8, padding: 10, maxHeight: 200, overflow: 'auto', fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
                {preview.slice(0, 10).map((p, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ color: '#60A5FA' }}>{p.date || 'ไม่มีวันที่'}</span> → {p.values?.join(', ')}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>เลือกตารางปลายทาง:</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSelectedTable('table1')} style={{ flex: 1, padding: 8, borderRadius: 6, border: selectedTable === 'table1' ? '2px solid #3B82F6' : '1px solid #334155', background: selectedTable === 'table1' ? '#1E293B' : '#0F172A', color: selectedTable === 'table1' ? '#3B82F6' : '#94A3B8', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>ตารางที่ 1</button>
                  <button onClick={() => setSelectedTable('table2')} style={{ flex: 1, padding: 8, borderRadius: 6, border: selectedTable === 'table2' ? '2px solid #8B5CF6' : '1px solid #334155', background: selectedTable === 'table2' ? '#1E293B' : '#0F172A', color: selectedTable === 'table2' ? '#8B5CF6' : '#94A3B8', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>ตารางที่ 2</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button onClick={() => doImport('replace')} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🔄 แทนที่</button>
                <button onClick={() => doImport('merge')} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: '#10B981', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>➕ เพิ่ม</button>
              </div>
              <button onClick={() => { setPreview(null); setExtractedColumns(null); }} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontSize: 13, cursor: 'pointer' }}>← แก้ไข</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Table Component ==========
function TableComponent({ tableId, config, rows, onUpdate, view }) {
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState(false);
  const [addingRow, setAddingRow] = useState(false);
  const [newRowDate, setNewRowDate] = useState('');

  const sorted = useMemo(() => [...rows].sort((a, b) => a.date.localeCompare(b.date)), [rows]);
  const grouped = useMemo(() => {
    const map = {};
    sorted.forEach(r => {
      const k = getMonthKey(r.date);
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });
    return map;
  }, [sorted]);

  const monthKeys = Object.keys(grouped).sort();

  const totals = useMemo(() => {
    const t = Array(config.groups.length * config.cols.length).fill(0);
    sorted.forEach(r => {
      r.values?.forEach((v, i) => {
        t[i] = (t[i] || 0) + (v || 0);
      });
    });
    return t;
  }, [sorted, config]);

  const updateCell = (rowId, idx, value) => {
    onUpdate(tableId, rows.map(r => {
      if (r.id === rowId) {
        const newVals = [...r.values];
        newVals[idx] = value === '' ? 0 : parseInt(value) || 0;
        return { ...r, values: newVals };
      }
      return r;
    }));
  };

  const deleteRow = (rowId) => {
    onUpdate(tableId, rows.filter(r => r.id !== rowId));
  };

  const addNewRow = () => {
    if (!newRowDate) return;
    const newValues = Array(config.groups.length * config.cols.length).fill(0);
    onUpdate(tableId, [...rows, { id: genId(), date: newRowDate, values: newValues }]);
    setNewRowDate('');
    setAddingRow(false);
  };

  const exportToExcel = () => {
    const headers = ['วันที่', ...config.groups.flatMap(g => config.cols.map(c => `${g.label} ${c.label}`))];
    const data = [
      headers,
      ...sorted.map(r => [formatThai(r.date), ...(r.values || [])]),
      ['รวมทั้งหมด', ...totals]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'สรุป');
    XLSX.writeFile(wb, `${config.title}.xlsx`);
  };

  const colCount = config.groups.length * config.cols.length;

  return (
    <div style={{ background: '#1E293B', borderRadius: 12, border: '1px solid #334155', padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {editTitle ? (
            <input autoFocus value={config.title} onChange={(e) => onUpdate(tableId, 'title', e.target.value)} onBlur={() => setEditTitle(false)} onKeyDown={(e) => e.key === 'Enter' && setEditTitle(false)} style={{ fontSize: 15, fontWeight: 700, background: '#0F172A', border: '1px solid #3B82F6', borderRadius: 6, padding: '3px 10px', color: '#F1F5F9', outline: 'none', minWidth: 200 }} />
          ) : (
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', cursor: 'pointer' }} onClick={() => setEditTitle(true)}>
              {config.title} <span style={{ fontSize: 11, color: '#475569' }}>✏️</span>
            </div>
          )}
          <span style={{ fontSize: 10, color: '#475569' }}>| {sorted.length} รายการ</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setAddingRow(true)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#3B82F6', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ แถว</button>
          <button onClick={exportToExcel} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#10B981', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⬇ Export</button>
        </div>
      </div>

      {addingRow && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 10, color: '#64748B', display: 'block', marginBottom: 3 }}>วันที่</label>
            <input type="date" value={newRowDate} onChange={(e) => setNewRowDate(e.target.value)} style={{ padding: '5px 8px', background: '#0F172A', border: '1px solid #334155', borderRadius: 5, color: '#E2E8F0', fontSize: 12 }} />
          </div>
          <button onClick={addNewRow} style={{ padding: '5px 12px', borderRadius: 5, border: 'none', background: '#3B82F6', color: 'white', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>บันทึก</button>
          <button onClick={() => setAddingRow(false)} style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>ยกเลิก</button>
        </div>
      )}

      {view === 'table' ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', padding: '8px', background: '#1a2640', borderBottom: '2px solid #334155', textAlign: 'left', minWidth: 100 }}>วันที่</th>
                {config.groups.map((g) => (
                  <th key={g.id} colSpan={config.cols.length} style={{ fontSize: 12, fontWeight: 700, color: g.color, padding: '8px', background: '#1a2640', borderBottom: '2px solid #334155', textAlign: 'center' }}>
                    {g.label}
                  </th>
                ))}
                <th style={{ padding: '8px' }} />
              </tr>
              <tr>
                <th style={{ padding: '6px', borderBottom: '1px solid #334155' }} />
                {config.groups.flatMap((g) =>
                  config.cols.map((c) => (
                    <th key={`${g.id}-${c.id}`} style={{ fontSize: 10, fontWeight: 600, color: '#64748B', padding: '6px', background: `${g.color}0a`, borderBottom: '1px solid #334155', textAlign: 'center', minWidth: 50 }}>
                      {c.label}
                    </th>
                  ))
                )}
                <th style={{ padding: '6px', borderBottom: '1px solid #334155' }} />
              </tr>
            </thead>
            <tbody>
              {monthKeys.map((monthKey) => {
                const monthRows = grouped[monthKey];
                const monthTotals = Array(config.groups.length * config.cols.length).fill(0);
                monthRows.forEach(r => {
                  r.values?.forEach((v, i) => {
                    monthTotals[i] = (monthTotals[i] || 0) + (v || 0);
                  });
                });

                return (
                  <React.Fragment key={monthKey}>
                    <tr>
                      <td colSpan={colCount + 2} style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', background: '#131f35', padding: '6px 10px', borderBottom: '1px solid #1a2640' }}>
                        📅 {getMonthLabel(monthKey)}
                      </td>
                    </tr>
                    {monthRows.map((row, ri) => (
                      <tr key={row.id} style={{ background: ri % 2 === 0 ? '#0e1a2e' : '#0A1120', borderBottom: '1px solid #1a2640' }}>
                        <td style={{ fontSize: 11, color: '#94A3B8', padding: '6px 10px', whiteSpace: 'nowrap', textAlign: 'left' }}>
                          {formatThai(row.date)}
                        </td>
                        {config.groups.flatMap((g) =>
                          config.cols.map((c) => {
                            const idx = config.groups.indexOf(g) * config.cols.length + config.cols.indexOf(c);
                            const val = row.values?.[idx] || 0;
                            const isEditing = editing === `${row.id}-${idx}`;

                            return (
                              <td key={`${row.id}-${idx}`} style={{ padding: '4px', textAlign: 'center', borderBottom: '1px solid #1a2640' }}>
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    type="number"
                                    min="0"
                                    defaultValue={val}
                                    onBlur={(e) => { updateCell(row.id, idx, e.target.value); setEditing(null); }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === 'Escape') {
                                        updateCell(row.id, idx, e.target.value);
                                        setEditing(null);
                                      }
                                    }}
                                    style={{ width: '100%', padding: '3px', background: '#1E293B', border: `1px solid ${g.color}`, borderRadius: 3, color: '#F1F5F9', fontSize: 11, textAlign: 'center', outline: 'none' }}
                                  />
                                ) : (
                                  <div
                                    onClick={() => setEditing(`${row.id}-${idx}`)}
                                    style={{
                                      padding: '3px 6px',
                                      borderRadius: 3,
                                      cursor: 'pointer',
                                      background: val > 0 ? `${g.color}25` : 'transparent',
                                      color: val > 0 ? g.color : '#3d4f6a',
                                      fontWeight: val > 0 ? 700 : 400,
                                      fontSize: 12
                                    }}
                                  >
                                    {val}
                                  </div>
                                )}
                              </td>
                            );
                          })
                        )}
                        <td style={{ textAlign: 'center', padding: '4px' }}>
                          <button onClick={() => deleteRow(row.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}>×</button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#152244', borderBottom: '2px solid #1a2640' }}>
                      <td style={{ fontSize: 11, fontWeight: 700, color: '#93C5FD', padding: '6px 10px' }}>รวม</td>
                      {monthTotals.map((total, i) => (
                        <td key={i} style={{ fontSize: 12, fontWeight: 700, color: '#93C5FD', padding: '6px', textAlign: 'center' }}>{total}</td>
                      ))}
                      <td />
                    </tr>
                  </React.Fragment>
                );
              })}
              <tr style={{ background: '#0d2318', borderTop: '2px solid #10B981' }}>
                <td style={{ fontSize: 12, fontWeight: 800, color: '#34D399', padding: '8px 10px' }}>รวม</td>
                {totals.map((total, i) => (
                  <td key={i} style={{ fontSize: 13, fontWeight: 800, color: '#34D399', padding: '8px', textAlign: 'center' }}>{total}</td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 10 }}>📊 สรุป</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {config.groups.map((g) => (
              <div key={g.id} style={{ background: '#0A1120', border: `1px solid ${g.color}40`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: g.color, marginBottom: 8 }}>{g.label}</div>
                {config.cols.map((c, ci) => {
                  const idx = config.groups.indexOf(g) * config.cols.length + ci;
                  const total = totals[idx] || 0;
                  return (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                      <span style={{ color: '#94A3B8' }}>{c.label}</span>
                      <span style={{ fontWeight: 800, color: '#F1F5F9' }}>{total}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Main App ==========
export default function App() {
  const [tables, setTables] = useState({
    table1: {
      config: {
        title: 'ตารางที่ 1',
        groups: [
          { id: 'g1', label: 'Non-b', color: '#3B82F6' },
          { id: 'g2', label: 'Non-o', color: '#8B5CF6' },
          { id: 'g3', label: 'Non-ed', color: '#10B981' },
          { id: 'g4', label: 'อื่นๆ', color: '#F59E0B' }
        ],
        cols: [
          { id: 'c1', label: 'รับ' },
          { id: 'c2', label: 'ออก' }
        ]
      },
      rows: []
    },
    table2: {
      config: {
        title: 'บันทึกที่พัก/ท้องถิ่น',
        groups: [
          { id: 't2g1', label: 'โรงแรม', color: '#3B82F6' },
          { id: 't2g2', label: 'เกสเฮ้า', color: '#8B5CF6' },
          { id: 't2g3', label: 'หอพัก', color: '#10B981' },
          { id: 't2g4', label: 'อพารทเม้น', color: '#F59E0B' },
          { id: 't2g5', label: 'คอนโด', color: '#EF4444' },
          { id: 't2g6', label: 'ท้องถิ่น', color: '#EC4899' }
        ],
        cols: [
          { id: 't2c1', label: 'จำนวน' }
        ]
      },
      rows: []
    }
  });

  const [settings, setSettings] = useState({ visible: false, tableId: null });
  const [import_, setImport] = useState({ visible: false });
  const [view, setView] = useState('table');

  const updateTable = (tableId, key, value) => {
    setTables(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        [key === 'title' ? 'config' : 'rows']: key === 'title' 
          ? { ...prev[tableId].config, title: value }
          : value
      }
    }));
  };

  const handleImport = (rows, mode, tableId) => {
    if (mode === 'replace') {
      updateTable(tableId, 'rows', rows);
    } else {
      updateTable(tableId, 'rows', [...tables[tableId].rows, ...rows]);
    }
  };

  const handleSaveSettings = (tableId, newConfig) => {
    setTables(prev => ({
      ...prev,
      [tableId]: { ...prev[tableId], config: newConfig }
    }));
    setSettings({ visible: false, tableId: null });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A1120', color: '#E2E8F0', padding: '20px' }}>
      {settings.visible && (
        <SettingsModal
          tableId={settings.tableId}
          config={tables[settings.tableId]?.config}
          onSave={(cfg) => handleSaveSettings(settings.tableId, cfg)}
          onClose={() => setSettings({ visible: false, tableId: null })}
        />
      )}

      {import_.visible && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setImport({ visible: false })}
        />
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>📊 ตารางสรุปข้อมูล</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setView(v => v === 'table' ? 'summary' : 'table')} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {view === 'table' ? '📊 สรุป' : '📋 ตาราง'}
            </button>
            <button onClick={() => setImport({ visible: true })} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🤖 นำเข้า AI
            </button>
          </div>
        </div>

        {Object.entries(tables).map(([tableId, table]) => (
          <div key={tableId}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button onClick={() => setSettings({ visible: true, tableId })} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #334155', background: 'transparent', color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⚙️</button>
            </div>
            <TableComponent
              tableId={tableId}
              config={table.config}
              rows={table.rows}
              onUpdate={updateTable}
              view={view}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
