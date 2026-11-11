type ResourceTopic = 'understanding-stress' | 'academic-balance' | 'healthy-boundaries' | 'everyday-movement'

function FriendlyFace({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-10-3v3m20-3v3M-5 7q5 5 10 0" fill="none" /></g>
}

// Bold rounded mascots use Kira's Trust Blue, navy, and teal palette.
export function ResourceCartoon({ topic }: { topic: ResourceTopic }) {
  return <svg className="resource-cartoon" viewBox="0 0 160 160" fill="none" stroke="#1b5278" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <ellipse cx="80" cy="139" rx="44" ry="5" fill="#1b5278" opacity=".07" stroke="none" />
    {topic === 'understanding-stress' && <>
      <path d="M80 42c-13-17-34-7-34 8-16 1-21 19-13 30-10 17 3 33 17 32 3 16 23 20 30 8 7 12 27 8 30-8 14 1 27-15 17-32 8-11 3-29-13-30 0-15-21-25-34-8Z" fill="#9dd3f1" />
      <path d="M80 43v19m-25-9c-5 8-2 15 5 18m-20 10c10-5 18-2 19 5m46-33c5 8 2 15-5 18m20 10c-10-5-18-2-19 5M53 111c7-2 12 1 14 6m40-6c-7-2-12 1-14 6" stroke="#2585c5" />
      <FriendlyFace x={80} y={89} />
      <path d="m22 45-7-4m114-15 2-8m7 15 7-3" stroke="#35afa3" />
      <path d="M74 132v6m12-6v6" />
    </>}
    {topic === 'academic-balance' && <>
      <path d="m37 122 80-4v13l-80 4c-13 0-13-13 0-13Z" fill="#87c5ea" />
      <path d="M35 48c17-6 31-3 45 5 14-8 28-11 45-5v69c-17-6-31-3-45 5-14-8-28-11-45-5V48Z" fill="#e8f5fd" />
      <path d="M80 54v68" stroke="#2585c5" />
      <path d="m45 61 22 3m-22 8 22 3m26-11 22-3m-22 14 22-3" stroke="#2585c5" />
      <FriendlyFace x={56} y={91} /><FriendlyFace x={103} y={91} />
      <path d="m113 21 5 9 10 2-7 8 1 10-9-5-9 5 1-10-7-8 10-2 5-9Z" fill="#8ad9cc" stroke="#278f85" strokeWidth="3.2" />
      <path d="m25 29-4-6m15 4 1-7" stroke="#2585c5" />
    </>}
    {topic === 'healthy-boundaries' && <>
      <path d="M36 40h57c12 0 18 7 18 17v30c0 10-6 17-18 17H66l-19 15v-15H36c-11 0-17-7-17-17V57c0-10 6-17 17-17Z" fill="#b4ddf5" />
      <path d="M109 68h14c11 0 18 7 18 17v26c0 10-7 17-18 17v11l-17-11H87c-10 0-17-5-17-13" fill="#9fded0" />
      <path d="M64 87S43 77 43 65c0-9 13-12 21-3 8-9 21-6 21 3 0 12-21 22-21 22Z" fill="#2585c5" stroke="#1b5278" strokeWidth="3.2" />
      <FriendlyFace x={109} y={99} />
      <path d="m114 31 4-6m8 14 7-2M24 119l-5 4" stroke="#35afa3" />
    </>}
    {topic === 'everyday-movement' && <>
      <path d="M40 61c11 7 21 6 29-4l10 13 13 13c8 8 17 11 31 15 12 4 17 12 17 24H24V96l16-35Z" fill="#94d5c8" />
      <path d="M24 119h116v9c0 5-4 8-9 8H33c-5 0-9-3-9-8v-9Z" fill="#fff" />
      <path d="m73 76 12-7m-3 16 12-7m-3 16 12-7" stroke="#2585c5" strokeWidth="4.8" />
      <path d="M34 97c8 0 14 6 14 15m-13 14h8m9 0h8m9 0h8m9 0h8m9 0h8m9 0h8" stroke="#278f85" strokeWidth="3.2" />
      <FriendlyFace x={65} y={100} />
      <path d="m101 47 12-8m-4 20 15-1M25 70H14m10 12H9" stroke="#35afa3" />
    </>}
  </svg>
}
