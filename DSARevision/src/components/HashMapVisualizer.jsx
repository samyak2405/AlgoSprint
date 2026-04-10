import React, { useMemo, useRef, useState } from "react";

const ANIM_MS = 340;
const DEFAULT_CAPACITY = 8;
const LOAD_FACTOR = 0.75;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function makeBuckets(cap) { return Array.from({ length: cap }, () => []); }
function hashKey(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return h >>> 0;
}
function indexFor(hash, cap) { return hash % cap; }
function cloneBuckets(b) { return b.map(bkt => bkt.map(e => ({ ...e }))); }

export function HashMapVisualizer() {
  const [buckets, setBuckets] = useState(() => makeBuckets(DEFAULT_CAPACITY));
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  const [size, setSize] = useState(0);
  const [keyInput, setKeyInput] = useState("");
  const [valueInput, setValueInput] = useState("");
  const [activeBucket, setActiveBucket] = useState(-1);
  const [animating, setAnimating] = useState(false);
  const [status, setStatus] = useState("Ready — try put / get / remove or run the demo.");
  const [trace, setTrace] = useState([]);

  const bucketsRef = useRef(makeBuckets(DEFAULT_CAPACITY));
  const capacityRef = useRef(DEFAULT_CAPACITY);
  const sizeRef = useRef(0);

  const threshold = useMemo(() => Math.floor(capacityRef.current * LOAD_FACTOR), [capacity]);
  const addTrace = msg => setTrace(p => [...p.slice(-11), msg]);

  const syncBuckets = b => { bucketsRef.current = b; setBuckets(cloneBuckets(b)); };
  const syncCapacity = c => { capacityRef.current = c; setCapacity(c); };
  const syncSize = s => { sizeRef.current = s; setSize(s); };

  const resize = async () => {
    const oldCap = capacityRef.current;
    const newCap = oldCap * 2;
    const next = makeBuckets(newCap);
    setStatus(`Load factor exceeded → resize ${oldCap} → ${newCap}`);
    addTrace(`resize: ${oldCap} → ${newCap}`);
    await sleep(ANIM_MS);

    const entries = bucketsRef.current.flat();
    for (const entry of entries) {
      const idx = indexFor(entry.hash, newCap);
      setActiveBucket(idx);
      next[idx].push(entry);
      syncBuckets(next);
      syncCapacity(newCap);
      setStatus(`Rehash "${entry.key}" → bucket ${idx}`);
      await sleep(160);
    }
    setActiveBucket(-1);
    addTrace(`resize complete, new capacity ${newCap}`);
  };

  const doPut = async (key, value) => {
    const hash = hashKey(key);
    const idx = indexFor(hash, capacityRef.current);
    setActiveBucket(idx);
    setStatus(`put("${key}", "${value}") → hash=${hash & 0xffff}, bucket ${idx}`);
    addTrace(`put key="${key}" → bucket ${idx}`);
    await sleep(ANIM_MS);

    const b = cloneBuckets(bucketsRef.current);
    const existing = b[idx].find(e => e.key === key);
    if (existing) {
      existing.value = value;
      syncBuckets(b);
      setStatus(`Updated "${key}" in bucket ${idx}`);
      addTrace(`update "${key}" → "${value}"`);
      setActiveBucket(-1);
      return;
    }
    b[idx].push({ key, value, hash });
    syncBuckets(b);
    const ns = sizeRef.current + 1;
    syncSize(ns);
    setStatus(`Inserted "${key}" in bucket ${idx} (size=${ns})`);
    addTrace(`insert "${key}" size=${ns}`);
    await sleep(ANIM_MS / 2);

    if (ns > Math.floor(capacityRef.current * LOAD_FACTOR)) {
      await resize();
    }
    setActiveBucket(-1);
  };

  const handlePut = async () => {
    const key = keyInput.trim();
    if (!key) { setStatus("Key cannot be empty."); return; }
    setAnimating(true);
    await doPut(key, valueInput.trim() || "");
    setKeyInput(""); setValueInput("");
    setAnimating(false);
  };

  const handleGet = async () => {
    const key = keyInput.trim();
    if (!key) { setStatus("Key cannot be empty."); return; }
    setAnimating(true);
    const hash = hashKey(key);
    const idx = indexFor(hash, capacityRef.current);
    setActiveBucket(idx);
    setStatus(`get("${key}") → hash=${hash & 0xffff}, bucket ${idx}`);
    addTrace(`get key="${key}" bucket ${idx}`);
    await sleep(ANIM_MS);
    const found = bucketsRef.current[idx].find(e => e.key === key);
    setStatus(found ? `✓ Found "${key}" → "${found.value}"` : `✗ "${key}" not found`);
    addTrace(found ? `hit: "${key}" → "${found.value}"` : `miss: "${key}"`);
    await sleep(ANIM_MS);
    setActiveBucket(-1);
    setAnimating(false);
  };

  const handleRemove = async () => {
    const key = keyInput.trim();
    if (!key) { setStatus("Key cannot be empty."); return; }
    setAnimating(true);
    const hash = hashKey(key);
    const idx = indexFor(hash, capacityRef.current);
    setActiveBucket(idx);
    setStatus(`remove("${key}") → bucket ${idx}`);
    addTrace(`remove key="${key}" bucket ${idx}`);
    await sleep(ANIM_MS);
    const b = cloneBuckets(bucketsRef.current);
    const before = b[idx].length;
    b[idx] = b[idx].filter(e => e.key !== key);
    if (b[idx].length < before) {
      syncBuckets(b);
      syncSize(sizeRef.current - 1);
      setStatus(`Removed "${key}"`);
      addTrace(`removed "${key}" size=${sizeRef.current}`);
    } else {
      setStatus(`"${key}" not present`);
      addTrace(`miss: "${key}"`);
    }
    setActiveBucket(-1);
    setAnimating(false);
  };

  const handleDemo = async () => {
    if (animating) return;
    setAnimating(true);
    const fresh = makeBuckets(DEFAULT_CAPACITY);
    bucketsRef.current = fresh;
    capacityRef.current = DEFAULT_CAPACITY;
    sizeRef.current = 0;
    setBuckets(cloneBuckets(fresh));
    setCapacity(DEFAULT_CAPACITY);
    setSize(0);
    setTrace([]);
    setKeyInput(""); setValueInput("");
    const pairs = [["name","Alice"],["age","30"],["city","NYC"],["lang","Java"],["level","mid"],["team","backend"],["role","dev"]];
    for (const [k, v] of pairs) { await doPut(k, v); }
    setStatus("Demo done! Notice resize happened at size > 6.");
    setAnimating(false);
  };

  const handleClear = () => {
    if (animating) return;
    const fresh = makeBuckets(DEFAULT_CAPACITY);
    bucketsRef.current = fresh;
    capacityRef.current = DEFAULT_CAPACITY;
    sizeRef.current = 0;
    setBuckets(cloneBuckets(fresh));
    setCapacity(DEFAULT_CAPACITY);
    setSize(0);
    setKeyInput(""); setValueInput("");
    setActiveBucket(-1);
    setStatus("Cleared.");
    setTrace([]);
  };

  const colCount = capacity <= 8 ? 4 : capacity <= 16 ? 4 : 8;

  return (
    <div className="hash-viz">
      <div className="hash-viz-header">
        <h4>Interactive HashMap Visualizer</h4>
        <span>size={size} · capacity={capacity} · threshold={Math.floor(capacity * LOAD_FACTOR)}</span>
      </div>

      <div className="hash-viz-controls">
        <input className="text-input" placeholder="key" value={keyInput} onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !animating && handlePut()} disabled={animating} />
        <input className="text-input" placeholder="value" value={valueInput} onChange={e => setValueInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !animating && handlePut()} disabled={animating} />
        <button className="ghost-btn hash-action-btn" onClick={handlePut} disabled={animating}>Put</button>
        <button className="ghost-btn hash-action-btn" onClick={handleGet} disabled={animating}>Get</button>
        <button className="ghost-btn hash-action-btn" onClick={handleRemove} disabled={animating}>Remove</button>
        <button className="ghost-btn hash-action-btn" onClick={handleDemo} disabled={animating}>Demo</button>
        <button className="ghost-btn hash-action-btn" onClick={handleClear} disabled={animating}>Clear</button>
      </div>

      <p className="hash-viz-status">{status}</p>

      <div className="hash-buckets" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0,1fr))` }}>
        {buckets.map((bucket, idx) => (
          <div key={idx} className={`hash-bucket ${activeBucket === idx ? "active" : ""}`}>
            <div className="hash-bucket-title">#{idx}</div>
            {bucket.length ? (
              <div className="hash-chain">
                {bucket.map((e, j) => (
                  <div key={`${e.key}-${j}`} className="hash-entry">
                    <strong>{e.key}</strong>: {e.value}
                  </div>
                ))}
              </div>
            ) : (
              <div className="hash-empty">—</div>
            )}
          </div>
        ))}
      </div>

      <div className="hash-bottom-explain">
        <h5>How it works</h5>
        <ol>
          <li>hash(key) maps the key to a bucket index.</li>
          <li>Collisions are handled by chaining (multiple entries per bucket).</li>
          <li>When size &gt; capacity × 0.75, the array doubles and all keys rehash.</li>
          <li>get/put/remove are O(1) average, O(n) worst case (all in one bucket).</li>
        </ol>
        <h5>Operation trace</h5>
        <div className="hash-trace">
          {trace.length ? trace.map((l, i) => <div key={i} className="hash-trace-line">{l}</div>)
            : <div className="hash-trace-line muted">No operations yet.</div>}
        </div>
      </div>
    </div>
  );
}
