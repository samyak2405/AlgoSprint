import React, { useRef, useState } from "react";

const ANIM_MS = 380;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function ArrayVisualizer() {
  const [items, setItems] = useState([3, 7, 1, 9, 4]);
  const [inputVal, setInputVal] = useState("");
  const [indexVal, setIndexVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [shiftRange, setShiftRange] = useState(null); // {start, end, dir}
  const [status, setStatus] = useState("Ready — an ArrayList wraps a dynamic array.");
  const [trace, setTrace] = useState([]);
  const itemsRef = useRef([3, 7, 1, 9, 4]);

  const sync = arr => { itemsRef.current = [...arr]; setItems([...arr]); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const handlePush = async () => {
    const val = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(val)) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const arr = [...itemsRef.current];
    setStatus(`add(${val}) — appending to index ${arr.length}`);
    addTrace(`add(${val}) at index ${arr.length}`);
    arr.push(val);
    sync(arr);
    setActiveIdx(arr.length - 1);
    await sleep(ANIM_MS);
    setActiveIdx(-1);
    setStatus(`Added ${val}. size = ${arr.length}`);
    setInputVal("");
    setAnimating(false);
  };

  const handlePop = async () => {
    if (!itemsRef.current.length) { setStatus("List is empty."); return; }
    setAnimating(true);
    const arr = [...itemsRef.current];
    const last = arr.length - 1;
    setActiveIdx(last);
    setStatus(`remove(${last}) — removing last element (${arr[last]})`);
    addTrace(`remove index ${last} (${arr[last]})`);
    await sleep(ANIM_MS);
    arr.pop();
    sync(arr);
    setActiveIdx(-1);
    setStatus(`Removed. size = ${arr.length}`);
    setAnimating(false);
  };

  const handleInsert = async () => {
    const val = Number(inputVal);
    const idx = Number(indexVal);
    if (inputVal.trim() === "" || isNaN(val)) { setStatus("Enter a valid value."); return; }
    if (indexVal.trim() === "" || isNaN(idx) || idx < 0 || idx > itemsRef.current.length) {
      setStatus(`Index must be 0–${itemsRef.current.length}.`); return;
    }
    setAnimating(true);
    const arr = [...itemsRef.current];
    setStatus(`add(${idx}, ${val}) — shifting elements right from index ${idx}`);
    addTrace(`add(${idx}, ${val})`);
    setShiftRange({ start: idx, end: arr.length - 1, dir: "right" });
    await sleep(ANIM_MS);
    arr.splice(idx, 0, val);
    sync(arr);
    setShiftRange(null);
    setActiveIdx(idx);
    await sleep(ANIM_MS);
    setActiveIdx(-1);
    setStatus(`Inserted ${val} at index ${idx}. size = ${arr.length}`);
    setInputVal(""); setIndexVal("");
    setAnimating(false);
  };

  const handleRemoveAt = async () => {
    const idx = Number(indexVal);
    if (indexVal.trim() === "" || isNaN(idx) || idx < 0 || idx >= itemsRef.current.length) {
      setStatus(`Index must be 0–${itemsRef.current.length - 1}.`); return;
    }
    setAnimating(true);
    const arr = [...itemsRef.current];
    setActiveIdx(idx);
    setStatus(`remove(${idx}) — removing ${arr[idx]}, shifting left`);
    addTrace(`remove index ${idx} (${arr[idx]})`);
    await sleep(ANIM_MS);
    setShiftRange({ start: idx + 1, end: arr.length - 1, dir: "left" });
    arr.splice(idx, 1);
    sync(arr);
    await sleep(ANIM_MS);
    setShiftRange(null);
    setActiveIdx(-1);
    setStatus(`Removed index ${idx}. size = ${arr.length}`);
    setIndexVal("");
    setAnimating(false);
  };

  const handleAccess = async () => {
    const idx = Number(indexVal);
    if (indexVal.trim() === "" || isNaN(idx) || idx < 0 || idx >= itemsRef.current.length) {
      setStatus(`Index must be 0–${itemsRef.current.length - 1}.`); return;
    }
    setAnimating(true);
    setActiveIdx(idx);
    setStatus(`get(${idx}) = ${itemsRef.current[idx]}  — O(1) direct access`);
    addTrace(`get(${idx}) = ${itemsRef.current[idx]}`);
    await sleep(ANIM_MS * 2);
    setActiveIdx(-1);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    const init = [3, 7, 1, 9, 4];
    sync(init);
    setActiveIdx(-1); setShiftRange(null);
    setInputVal(""); setIndexVal("");
    setStatus("Reset to default.");
    setTrace([]);
  };

  return (
    <div className="array-viz">
      <div className="array-viz-header">
        <h4>ArrayList / Array Visualizer</h4>
        <span>size = {items.length}</span>
      </div>

      <div className="array-viz-controls">
        <input className="text-input" placeholder="value" value={inputVal}
          onChange={e => setInputVal(e.target.value)} disabled={animating} />
        <input className="text-input" placeholder="index (optional)" value={indexVal}
          onChange={e => setIndexVal(e.target.value)} disabled={animating} />
        <button className="ghost-btn" onClick={handlePush} disabled={animating}>Add Last</button>
        <button className="ghost-btn" onClick={handlePop} disabled={animating || !items.length}>Remove Last</button>
        <button className="ghost-btn" onClick={handleInsert} disabled={animating}>Insert At</button>
        <button className="ghost-btn" onClick={handleRemoveAt} disabled={animating || !items.length}>Remove At</button>
        <button className="ghost-btn" onClick={handleAccess} disabled={animating || !items.length}>Get At</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
      </div>

      <p className="array-viz-status">{status}</p>

      <div className="array-cells-wrap">
        {items.length === 0 ? (
          <div className="array-empty">Array is empty.</div>
        ) : (
          <div className="array-cells">
            {items.map((v, i) => {
              const isActive = i === activeIdx;
              const isShifting = shiftRange && i >= shiftRange.start && i <= shiftRange.end;
              return (
                <div key={i} className={`array-cell ${isActive ? "active" : ""} ${isShifting ? `shift-${shiftRange.dir}` : ""}`}>
                  <div className="array-cell-val">{v}</div>
                  <div className="array-cell-idx">{i}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="array-legend">
        <span className="legend-item"><span className="legend-dot active" />Active</span>
        <span className="legend-item"><span className="legend-dot shift" />Shifting</span>
      </div>

      <div className="array-explain">
        <h5>Complexity guide</h5>
        <ol>
          <li><strong>get(i)</strong> — O(1): direct index into backing array.</li>
          <li><strong>add last</strong> — O(1) amortized: occasionally doubles capacity.</li>
          <li><strong>insert at i</strong> — O(n): elements [i…n-1] shift right by one.</li>
          <li><strong>remove at i</strong> — O(n): elements [i+1…n-1] shift left by one.</li>
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
