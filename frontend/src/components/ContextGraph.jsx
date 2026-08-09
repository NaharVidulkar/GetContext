// The one restrained illustrative element in the app: an isometric
// "context graph" — file nodes on layered depth planes, converging into a
// single compressed node with a soft glow. Pure SVG (no WebGL/Three.js) —
// same visual weight as a 3D render, zero runtime risk.
export default function ContextGraph({ width = 320, height = 200 }) {
  return (
    <svg width={width} height={height} viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="nodeFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#4338CA" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="planeShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1F2530" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1F2530" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Faint isometric floor plane for depth */}
      <polygon points="20,180 300,180 260,205 60,205" fill="url(#planeShade)" />

      {/* Depth-staggered connecting edges (back plane, dimmer) */}
      <g stroke="#818CF8" strokeOpacity="0.15" strokeWidth="1">
        <line x1="34" y1="30" x2="230" y2="105" />
        <line x1="94" y1="14" x2="230" y2="105" />
      </g>
      {/* Front plane edges (brighter, closer to viewer) */}
      <g stroke="#6366F1" strokeOpacity="0.3" strokeWidth="1">
        <line x1="34" y1="95" x2="230" y2="105" />
        <line x1="34" y1="145" x2="230" y2="105" />
        <line x1="34" y1="190" x2="230" y2="105" />
      </g>

      {/* File nodes — isometric cubes with top-face + side-face shading */}
      {[
        [34, 30, 0.55], [94, 14, 0.5], [34, 95, 0.85], [34, 145, 0.85], [34, 190, 0.85],
      ].map(([x, y, opacity], i) => (
        <g key={i} transform={`translate(${x}, ${y})`} opacity={opacity}>
          <polygon points="-10,-4 0,-9 10,-4 0,1" fill="#312E81" />
          <polygon points="-10,-4 0,1 0,10 -10,5" fill="#1E1B4B" />
          <polygon points="10,-4 0,1 0,10 10,5" fill="#252458" />
        </g>
      ))}

      {/* Converged context node — the glowing focal point, elevated */}
      <g filter="url(#glow)">
        <ellipse cx="230" cy="108" rx="4" ry="2" fill="#0A0E14" opacity="0.5" />
        <circle cx="230" cy="100" r="17" fill="url(#nodeFade)" />
        <circle cx="230" cy="100" r="17" fill="none" stroke="#818CF8" strokeWidth="1.5" />
      </g>
      <circle cx="230" cy="100" r="4" fill="#0A0E14" />

      {/* Outbound arrow to "any AI agent" */}
      <line x1="250" y1="100" x2="292" y2="100" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M286 94 L294 100 L286 106" fill="none" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

