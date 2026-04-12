import { useRef, useState, useCallback } from 'react';

interface Props { onUpload: (file: File, preview: string) => void; isLoading: boolean; }

export default function ImageUploader({ onUpload, isLoading }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const process = useCallback((file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (PNG, JPG, DICOM)'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('File size must be under 20MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);
      onUpload(file, url);
    };
    reader.readAsDataURL(file);
  }, [onUpload]);

  const clear = () => { setPreview(''); setError(''); if (inputRef.current) inputRef.current.value = ''; };

  const zone: React.CSSProperties = {
    border: `2px dashed ${dragging ? '#4ecdc4' : 'rgba(141,171,168,0.3)'}`,
    borderRadius: 16, padding: 48, textAlign: 'center', cursor: 'pointer',
    background: dragging ? 'rgba(78,205,196,0.04)' : 'rgba(13,37,64,0.4)',
    transition: 'all 0.2s',
  };

  if (preview) return (
    <div>
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(141,171,168,0.15)' }}>
        <img src={preview} alt="X-ray" style={{ width: '100%', maxHeight: 340, objectFit: 'contain', background: '#000', display: 'block' }} />
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,29,46,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(78,205,196,0.2)', borderTop: '3px solid #4ecdc4', borderRadius: '50%' }} className="spin" />
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#8daba8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Analyzing…</span>
          </div>
        )}
        {!isLoading && (
          <button onClick={clear} style={{
            position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(9,29,46,0.85)', border: '1px solid rgba(141,171,168,0.2)',
            color: '#8daba8', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        )}
      </div>
      {error && <p style={{ marginTop: 8, color: '#ff6b6b', fontSize: 12 }}>{error}</p>}
    </div>
  );

  return (
    <div>
      <div style={zone}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) process(f); }}
        onClick={() => inputRef.current?.click()}>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) process(f); }} />
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(78,205,196,0.08)', border: '1px solid rgba(78,205,196,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8daba8" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#e4eeee', marginBottom: 6 }}>Drop a chest X-ray here</p>
        <p style={{ fontSize: 12, color: '#5c7f7c' }}>or click to browse · PNG, JPG · max 20MB</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          {['Frontal AP', 'Frontal PA', 'Lateral'].map(v => (
            <span key={v} style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', background: 'rgba(141,171,168,0.06)', border: '1px solid rgba(141,171,168,0.15)', borderRadius: 999, color: '#5c7f7c' }}>{v}</span>
          ))}
        </div>
      </div>
      {error && <p style={{ marginTop: 8, color: '#ff6b6b', fontSize: 12 }}>{error}</p>}
    </div>
  );
}
