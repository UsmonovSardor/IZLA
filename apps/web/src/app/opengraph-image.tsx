import { ImageResponse } from 'next/og';

export const alt = 'Izla.uz — Barcha xizmatlar bitta ilovada';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Ijtimoiy tarmoqlar uchun brendlangan ulashuv kartasi (dinamik, asset shart emas). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '84px',
          background: 'linear-gradient(135deg, #0b1f3a 0%, #0c2338 55%, #0a2c31 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 34 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 46,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
            }}
          >
            i
          </div>
          <div style={{ fontSize: 42, fontWeight: 700 }}>izla.uz</div>
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.08, letterSpacing: -2 }}>
          Barcha xizmatlar — bitta ilovada
        </div>
        <div style={{ fontSize: 30, color: 'rgba(226,238,247,0.75)', marginTop: 26 }}>
          Klinika · salon · restoran · fitnes · uy-joy — toping va online bron qiling
        </div>
      </div>
    ),
    { ...size },
  );
}
