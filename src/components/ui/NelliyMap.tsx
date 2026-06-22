'use client'

const LAT = 9.0012587
const LNG = 38.7673834
const W = 800
const H = 360

const bbox = `${LNG - 0.003},${LAT - 0.0015},${LNG + 0.003},${LAT + 0.0015}`
const SRC = `https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&size=${W},${H}&imageSR=4326&format=png&f=image`
const MAPS_URL = 'https://www.google.com/maps/place/Nelliy%27s+Coffee/@9.0012587,38.7673834,17z'

export default function NelliyMap() {
  return (
    <div style={{ position: 'relative', height: 360, width: '100%', overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SRC}
        alt="Nelliy's Coffee satellite view"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        crossOrigin="anonymous"
      />
      {/* Pin */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', marginBottom: 4, whiteSpace: 'nowrap' }}>
            Nelliy's Coffee
          </div>
          <div style={{ width: 14, height: 14, background: '#ef4444', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }} />
          <div style={{ width: 2, height: 10, background: '#ef4444' }} />
        </div>
      </div>
      {/* Open in Maps */}
      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ position: 'absolute', bottom: 12, right: 12, background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', textDecoration: 'none' }}
      >
        Open in Google Maps ↗
      </a>
    </div>
  )
}
