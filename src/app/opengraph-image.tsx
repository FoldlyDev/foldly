import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Foldly - File Collection Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: 'white',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 24,
              fontSize: 40,
            }}
          >
            📁
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            Foldly
          </div>
        </div>
        <div
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.9)',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.2,
          }}
        >
          Collect files from anyone, anywhere with smart links
        </div>
        <div
          style={{
            fontSize: 20,
            color: 'rgba(255, 255, 255, 0.7)',
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          Professional file collection platform
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
