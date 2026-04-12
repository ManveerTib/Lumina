import { useState } from 'react';
import Navigation from './components/shared/Navigation';
import OncoScanPage from './components/oncoscan/OncoScanPage';
import PDTSimulator from './components/pdt/PDTSimulator';
import DosimetryModel from './components/dosimetry/DosimetryModel';

type Tool = 'oncoscan' | 'pdt' | 'dosimetry';

export default function App() {
  const [tool, setTool] = useState<Tool>('oncoscan');
  return (
    <div style={{ minHeight: '100vh', background: '#091d2e' }}>
      <Navigation active={tool} onChange={setTool} />
      <main>
        {tool === 'oncoscan'   && <OncoScanPage />}
        {tool === 'pdt'        && <PDTSimulator />}
        {tool === 'dosimetry'  && <DosimetryModel />}
      </main>
      <footer style={{ borderTop: '1px solid rgba(141,171,168,0.15)', padding: '24px 0', background: 'rgba(9,29,46,0.8)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 15, color: '#e4eeee' }}>Lumina Medical AI Suite</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#5c7f7c', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
              Manveer Singh Tib · ISM Research · Wakeland HS · Texas A&M
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#5c7f7c', maxWidth: 380 }}>
            Educational and research use only. Not FDA approved. Not for clinical diagnosis without physician oversight.
          </p>
        </div>
      </footer>
    </div>
  );
}
