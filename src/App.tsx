import { useState } from 'react';
import Navigation from './components/shared/Navigation';
import OncoScanPage from './components/oncoscan/OncoScanPage';
import PDTSimulator from './components/pdt/PDTSimulator';
import DosimetryModel from './components/dosimetry/DosimetryModel';
<<<<<<< HEAD
import HeroPage from './components/hero/HeroPage';
import { BackgroundBeams } from './components/ui/background-beams';

type Tool = 'home' | 'oncoscan' | 'pdt' | 'dosimetry';

export default function App() {
  const [tool, setTool] = useState<Tool>('home');

  return (
    <div style={{ minHeight: '100vh', background: '#091d2e' }}>
      {/* Fixed background — never scrolls */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <BackgroundBeams />
      </div>

      {/* All content scrolls above the fixed background */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navigation active={tool} onChange={setTool} />
        <main>
          {tool === 'home'      && <HeroPage onNavigate={(t) => setTool(t as Tool)} />}
          {tool === 'oncoscan'  && <OncoScanPage />}
          {tool === 'pdt'       && <PDTSimulator />}
          {tool === 'dosimetry' && <DosimetryModel />}
        </main>
        {tool !== 'home' && (
          <footer style={{ borderTop: '1px solid rgba(141,171,168,0.15)', padding: '20px 0', background: 'rgba(9,29,46,0.9)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 14, color: '#e4eeee' }}>Lumina Medical AI Suite</div>
              <p style={{ fontSize: 11, color: '#5c7f7c', maxWidth: 380 }}>
                Educational and research use only. Not FDA approved. Not for clinical use without physician oversight.
              </p>
            </div>
          </footer>
        )}
      </div>
=======

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
>>>>>>> eeb4c537ea74731802203ec4092c162b4b2d2456
    </div>
  );
}
