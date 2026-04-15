import React from "react";

/* ── Layout constants ─────────────────────────────────────────── */
const BOX_W   = 178;
const HDR_H   = 40;   // header (stereotype + name)
const LINE_H  = 18;   // per field / method line
const PAD_B   = 10;   // bottom padding inside box
const FONT    = 11;
const MONO    = '"JetBrains Mono", "Fira Code", monospace';
const SANS    = '"DM Sans", system-ui, sans-serif';

/* ── Node geometry ────────────────────────────────────────────── */
function nodeH(node) {
  const f = node.fields?.length  ?? 0;
  const m = node.methods?.length ?? 0;
  return HDR_H + (f ? f * LINE_H + 1 : 0) + (m ? m * LINE_H + 1 : 0) + PAD_B;
}

function ncx(n) { return n.x + BOX_W / 2; }
function ncy(n) { return n.y + nodeH(n) / 2; }

/** Returns the [x,y] on the border of `node` closest to point (tox, toy). */
function borderPt(node, tox, toy) {
  const ox = ncx(node), oy = ncy(node);
  const h  = nodeH(node);
  const hw = BOX_W / 2, hh = h / 2;
  const dx = tox - ox,  dy = toy - oy;
  if (!dx && !dy) return [ox, oy];
  const sx = dx ? Math.abs(hw / dx) : Infinity;
  const sy = dy ? Math.abs(hh / dy) : Infinity;
  return sx <= sy
    ? [ox + (dx > 0 ? hw : -hw), oy + dy * sx]
    : [ox + dx * sy, oy + (dy > 0 ? hh : -hh)];
}

/* ── SVG Arrow / Diamond markers ─────────────────────────────── */
function Defs({ stroke }) {
  return (
    <defs>
      {/* open arrowhead — uses / dependency */}
      <marker id="m-open" markerWidth="10" markerHeight="7"
              refX="9" refY="3.5" orient="auto">
        <path d="M0,0 L9,3.5 L0,7" fill="none"
              stroke={stroke} strokeWidth="1.3"/>
      </marker>

      {/* hollow triangle — extends / implements */}
      <marker id="m-tri" markerWidth="11" markerHeight="9"
              refX="10" refY="4.5" orient="auto">
        <polygon points="0,0 10,4.5 0,9" fill="var(--surface)"
                 stroke={stroke} strokeWidth="1.3"/>
      </marker>

      {/* filled diamond — composition (at marker-start) */}
      <marker id="m-comp" markerWidth="13" markerHeight="9"
              refX="1" refY="4.5" orient="auto-start-reverse">
        <polygon points="0,4.5 6,0 12,4.5 6,9"
                 fill={stroke}/>
      </marker>

      {/* hollow diamond — aggregation (at marker-start) */}
      <marker id="m-aggr" markerWidth="13" markerHeight="9"
              refX="1" refY="4.5" orient="auto-start-reverse">
        <polygon points="0,4.5 6,0 12,4.5 6,9"
                 fill="var(--surface)" stroke={stroke} strokeWidth="1.3"/>
      </marker>
    </defs>
  );
}

/* ── Edge renderer ────────────────────────────────────────────── */
function Edge({ edge, nodeMap, stroke }) {
  const from = nodeMap[edge.from];
  const to   = nodeMap[edge.to];
  if (!from || !to) return null;

  const [sx, sy] = borderPt(from, ncx(to),   ncy(to));
  const [ex, ey] = borderPt(to,   ncx(from), ncy(from));

  const isDashed = edge.type === "implements" || edge.type === "dependency";
  const isComp   = edge.type === "composition";
  const isAggr   = edge.type === "aggregation";

  const endMarker =
    edge.type === "extends"    || edge.type === "implements" ? "url(#m-tri)"  :
    edge.type === "uses"       || edge.type === "dependency"  ? "url(#m-open)" :
    "none";

  const startMarker =
    isComp ? "url(#m-comp)" :
    isAggr ? "url(#m-aggr)" :
    "none";

  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  return (
    <g>
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke={stroke} strokeWidth="1.3"
        strokeDasharray={isDashed ? "6 4" : "none"}
        markerEnd={endMarker}
        markerStart={startMarker}
      />
      {edge.label && (
        <text x={mx} y={my - 5} textAnchor="middle"
              fontSize={FONT - 1} fill={stroke}
              fontFamily={MONO} opacity="0.75">
          {edge.label}
        </text>
      )}
    </g>
  );
}

/* ── Node renderer ────────────────────────────────────────────── */
function Node({ node, stroke, ink, ink2, ink3, surface, surface2 }) {
  const h  = nodeH(node);
  const { x, y } = node;
  const f = node.fields  ?? [];
  const m = node.methods ?? [];

  const isInterface = node.type === "interface";
  const isAbstract  = node.type === "abstract";

  let yc = y + HDR_H; // current y cursor

  return (
    <g>
      {/* Box outline */}
      <rect x={x} y={y} width={BOX_W} height={h}
            fill={surface} stroke={stroke}
            strokeWidth="1.4" rx="3"/>

      {/* Header background */}
      <rect x={x} y={y} width={BOX_W} height={HDR_H}
            fill={surface2} stroke="none" rx="3"/>
      <rect x={x} y={y + HDR_H - 4} width={BOX_W} height={4}
            fill={surface2} stroke="none"/>
      <line x1={x} y1={y + HDR_H} x2={x + BOX_W} y2={y + HDR_H}
            stroke={stroke} strokeWidth="1.4"/>

      {/* Stereotype label */}
      {(isInterface || isAbstract) && (
        <text x={x + BOX_W / 2} y={y + 14}
              textAnchor="middle" fontSize={FONT - 1}
              fill={ink3} fontFamily={MONO} fontStyle="normal">
          {isInterface ? "«interface»" : "«abstract»"}
        </text>
      )}

      {/* Class name */}
      <text
        x={x + BOX_W / 2}
        y={y + (isInterface || isAbstract ? 30 : 24)}
        textAnchor="middle"
        fontSize={FONT + 1}
        fontWeight="700"
        fontStyle={isAbstract ? "italic" : "normal"}
        fill={ink}
        fontFamily={SANS}
      >
        {node.id}
      </text>

      {/* Fields */}
      {f.length > 0 && (() => {
        const rows = f.map((txt, i) => {
          const fy = yc + i * LINE_H + LINE_H / 2 + 4;
          return (
            <text key={i} x={x + 8} y={fy}
                  fontSize={FONT} fill={ink2} fontFamily={MONO}
                  dominantBaseline="middle">
              {txt}
            </text>
          );
        });
        const sepY = yc + f.length * LINE_H + 1;
        yc = sepY + 1;
        return (
          <>
            {rows}
            <line x1={x} y1={sepY} x2={x + BOX_W} y2={sepY}
                  stroke={stroke} strokeWidth="1" opacity="0.5"/>
          </>
        );
      })()}

      {/* Methods */}
      {m.map((txt, i) => {
        const my = (f.length > 0 ? yc : yc + 1) + i * LINE_H + LINE_H / 2 + 3;
        return (
          <text key={i} x={x + 8} y={my}
                fontSize={FONT} fill={ink2} fontFamily={MONO}
                dominantBaseline="middle">
            {txt}
          </text>
        );
      })}
    </g>
  );
}

/* ── Public component ─────────────────────────────────────────── */
export default function ClassDiagram({ diagram }) {
  if (!diagram) return null;

  const { nodes = [], edges = [], width = 640, height = 300 } = diagram;
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  // Read CSS token values through a ref — use hardcoded fallbacks that match both themes
  const stroke  = "currentColor";
  const ink     = "var(--ink)";
  const ink2    = "var(--ink-2)";
  const ink3    = "var(--ink-3)";
  const surface  = "var(--surface)";
  const surface2 = "var(--surface-2)";

  return (
    <div className="class-diagram-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ maxWidth: width, display: "block" }}
        aria-label="Class diagram"
        role="img"
        color="var(--border-2)"
      >
        <Defs stroke="var(--border-2)" />

        {/* Edges drawn first (under nodes) */}
        {edges.map((e, i) => (
          <Edge key={i} edge={e} nodeMap={nodeMap} stroke="var(--border-2)" />
        ))}

        {/* Nodes */}
        {nodes.map((n) => (
          <Node
            key={n.id}
            node={n}
            stroke="var(--border-2)"
            ink={ink} ink2={ink2} ink3={ink3}
            surface={surface} surface2={surface2}
          />
        ))}
      </svg>
    </div>
  );
}
