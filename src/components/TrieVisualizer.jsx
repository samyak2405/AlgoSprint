import React, { useRef, useState } from "react";

const ANIM_MS = 350;
let NODE_ID = 1;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function newNode() { return { id: NODE_ID++, children: {}, isEnd: false }; }

export function TrieVisualizer() {
  const makeRoot = () => newNode();
  const [root, setRoot] = useState(makeRoot);
  const [inputWord, setInputWord] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activePath, setActivePath] = useState([]); // node ids
  const [status, setStatus] = useState('Ready — Trie for prefix-based string lookup.');
  const [trace, setTrace] = useState([]);
  const rootRef = useRef(root);

  const cloneNode = node => ({
    id: node.id, isEnd: node.isEnd,
    children: Object.fromEntries(Object.entries(node.children).map(([c, ch]) => [c, cloneNode(ch)]))
  });
  const sync = r => { rootRef.current = r; setRoot(cloneNode(r)); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const handleInsert = async () => {
    const word = inputWord.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!word) { setStatus("Enter a word (letters only)."); return; }
    setAnimating(true);
    setStatus(`insert("${word}")`);
    addTrace(`insert: "${word}"`);
    let node = rootRef.current;
    const path = [node.id];
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = newNode();
      node = node.children[ch];
      path.push(node.id);
      setActivePath([...path]);
      await sleep(ANIM_MS);
    }
    node.isEnd = true;
    sync(rootRef.current);
    setStatus(`"${word}" inserted. ${node.isEnd ? "End-of-word marked." : ""}`);
    await sleep(ANIM_MS);
    setActivePath([]);
    setInputWord("");
    setAnimating(false);
  };

  const handleSearch = async () => {
    const word = inputWord.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!word) { setStatus("Enter a word."); return; }
    setAnimating(true);
    setStatus(`search("${word}")`);
    addTrace(`search: "${word}"`);
    let node = rootRef.current;
    const path = [node.id];
    for (const ch of word) {
      if (!node.children[ch]) {
        setStatus(`✗ "${word}" not found — no edge '${ch}' at this node.`);
        addTrace(`miss: "${word}"`);
        setActivePath([...path]);
        await sleep(ANIM_MS);
        setActivePath([]);
        setAnimating(false);
        return;
      }
      node = node.children[ch];
      path.push(node.id);
      setActivePath([...path]);
      await sleep(ANIM_MS * 0.7);
    }
    setActivePath([...path]);
    const found = node.isEnd;
    setStatus(found ? `✓ "${word}" found (end-of-word node reached).` : `✗ "${word}" is a prefix only — not a complete word.`);
    addTrace(found ? `hit: "${word}"` : `prefix only: "${word}"`);
    await sleep(ANIM_MS);
    setActivePath([]);
    setAnimating(false);
  };

  const handleStartsWith = async () => {
    const prefix = inputWord.trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!prefix) { setStatus("Enter a prefix."); return; }
    setAnimating(true);
    setStatus(`startsWith("${prefix}")`);
    addTrace(`startsWith: "${prefix}"`);
    let node = rootRef.current;
    const path = [node.id];
    for (const ch of prefix) {
      if (!node.children[ch]) {
        setStatus(`✗ No word starts with "${prefix}".`);
        addTrace(`miss prefix: "${prefix}"`);
        setActivePath([...path]);
        await sleep(ANIM_MS);
        setActivePath([]);
        setAnimating(false);
        return;
      }
      node = node.children[ch];
      path.push(node.id);
      setActivePath([...path]);
      await sleep(ANIM_MS * 0.7);
    }
    setStatus(`✓ Prefix "${prefix}" exists in the trie.`);
    addTrace(`hit prefix: "${prefix}"`);
    await sleep(ANIM_MS);
    setActivePath([]);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    const r = makeRoot();
    rootRef.current = r;
    setRoot(r);
    setActivePath([]); setInputWord("");
    setStatus("Trie cleared."); setTrace([]);
  };

  const handleLoadSample = async () => {
    if (animating) return;
    const r = makeRoot();
    rootRef.current = r;
    setRoot(r);
    for (const w of ["cat","can","car","bat","bad","ball"]) {
      setInputWord(w);
      let node = rootRef.current;
      for (const ch of w) {
        if (!node.children[ch]) node.children[ch] = newNode();
        node = node.children[ch];
      }
      node.isEnd = true;
    }
    sync(rootRef.current);
    setInputWord("");
    setStatus('Sample loaded: cat, can, car, bat, bad, ball');
  };

  // Layout the trie as a tree with BFS
  const layoutTrie = (root) => {
    const nodes = [], edges = [];
    const queue = [{ node: root, x: 380, y: 24, level: 0, char: "" }];
    const levelWidths = {};

    // First pass: count nodes per level for spacing
    const countByLevel = (n, lvl = 0) => {
      if (!levelWidths[lvl]) levelWidths[lvl] = 0;
      levelWidths[lvl]++;
      Object.values(n.children).forEach(ch => countByLevel(ch, lvl + 1));
    };
    countByLevel(root);

    const levelCounters = {};
    const bfsLayout = (n, parentX, lvl, char, parentId) => {
      if (!levelCounters[lvl]) levelCounters[lvl] = 0;
      const count = levelWidths[lvl] || 1;
      const spacing = Math.max(48, 720 / (count + 1));
      levelCounters[lvl]++;
      const x = spacing * levelCounters[lvl];
      const y = 24 + lvl * 68;
      nodes.push({ id: n.id, x, y, isEnd: n.isEnd, char, active: activePath.includes(n.id) });
      if (parentId !== null) edges.push({ fromId: parentId, toId: n.id, char, fromX: parentX, fromY: y - 68, toX: x, toY: y });
      const entries = Object.entries(n.children).sort(([a],[b]) => a.localeCompare(b));
      entries.forEach(([c, ch]) => bfsLayout(ch, x, lvl + 1, c, n.id));
    };
    bfsLayout(root, 380, 0, "", null);
    return { nodes, edges };
  };

  const { nodes: tNodes, edges: tEdges } = layoutTrie(root);
  const svgH = Math.max(120, (tNodes.reduce((m, n) => Math.max(m, n.y), 0) + 56));

  return (
    <div className="trie-viz">
      <div className="trie-viz-header">
        <h4>Trie (Prefix Tree) Visualizer</h4>
        <span>O(L) insert / search (L = word length)</span>
      </div>

      <div className="trie-viz-controls">
        <input className="text-input" placeholder="word / prefix" value={inputWord}
          onChange={e => setInputWord(e.target.value)} disabled={animating} />
        <button className="ghost-btn" onClick={handleInsert} disabled={animating}>Insert</button>
        <button className="ghost-btn" onClick={handleSearch} disabled={animating}>Search</button>
        <button className="ghost-btn" onClick={handleStartsWith} disabled={animating}>startsWith</button>
        <button className="ghost-btn" onClick={handleLoadSample} disabled={animating}>Load Sample</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Clear</button>
      </div>

      <p className="trie-viz-status">{status}</p>

      <div className="trie-canvas-wrap">
        <svg className="trie-svg" viewBox={`0 0 760 ${svgH}`} preserveAspectRatio="xMidYMid meet">
          {tEdges.map((e, i) => (
            <g key={i}>
              <line x1={e.fromX} y1={e.fromY + 20} x2={e.toX} y2={e.toY - 20}
                className={`trie-edge ${activePath.includes(e.toId) ? "active" : ""}`} />
              <text x={(e.fromX + e.toX) / 2 + 6} y={(e.fromY + e.toY) / 2}
                className="trie-edge-char">{e.char}</text>
            </g>
          ))}
          {tNodes.map(n => (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={n.char ? 18 : 14}
                className={`trie-node ${n.active ? "active" : ""} ${n.isEnd ? "end" : ""} ${!n.char ? "root" : ""}`} />
              {n.char
                ? <text x={n.x} y={n.y + 5} textAnchor="middle" className="trie-node-label">{n.char}</text>
                : <text x={n.x} y={n.y + 5} textAnchor="middle" className="trie-root-label">⬤</text>
              }
              {n.isEnd && <text x={n.x} y={n.y + 32} textAnchor="middle" className="trie-end-mark">$</text>}
            </g>
          ))}
        </svg>
      </div>

      <div className="array-explain">
        <h5>How it works</h5>
        <ol>
          <li><strong>insert(w)</strong> — O(|w|): walk / create one node per character.</li>
          <li><strong>search(w)</strong> — O(|w|): walk; return true only if last node has isEnd=true.</li>
          <li><strong>startsWith(p)</strong> — O(|p|): walk; return true if path exists.</li>
          <li>$ mark on a node means it is the end of a complete word.</li>
        </ol>
        <h5>Operation trace</h5>
        <div className="array-trace">
          {trace.length ? trace.map((l, i) => <div key={i} className="array-trace-line">{l}</div>)
            : <div className="array-trace-line muted">No operations yet.</div>}
        </div>
      </div>
    </div>
  );
}
