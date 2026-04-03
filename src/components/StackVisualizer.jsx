import React, { useRef, useState } from "react";

const ANIM_MS = 380;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function StackVisualizer() {
  const [stack, setStack] = useState([4, 2, 8]);
  const [inputVal, setInputVal] = useState("");
  const [animating, setAnimating] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [status, setStatus] = useState("Ready — Stack: LIFO (Last In, First Out)");
  const [trace, setTrace] = useState([]);
  const stackRef = useRef([4, 2, 8]);

  const sync = arr => { stackRef.current = [...arr]; setStack([...arr]); };
  const addTrace = msg => setTrace(p => [...p.slice(-10), msg]);

  const handlePush = async () => {
    const val = Number(inputVal);
    if (inputVal.trim() === "" || isNaN(val)) { setStatus("Enter a valid number."); return; }
    setAnimating(true);
    const arr = [...stackRef.current, val];
    sync(arr);
    setActiveIdx(arr.length - 1);
    setStatus(`push(${val}) — O(1): place on top. size = ${arr.length}`);
    addTrace(`push(${val})`);
    await sleep(ANIM_MS);
    setActiveIdx(-1);
    setInputVal("");
    setAnimating(false);
  };

  const handlePop = async () => {
    if (!stackRef.current.length) { setStatus("Stack underflow — cannot pop."); return; }
    setAnimating(true);
    const arr = [...stackRef.current];
    const top = arr[arr.length - 1];
    setActiveIdx(arr.length - 1);
    setStatus(`pop() = ${top} — O(1): remove top. size will be ${arr.length - 1}`);
    addTrace(`pop() = ${top}`);
    await sleep(ANIM_MS);
    arr.pop();
    sync(arr);
    setActiveIdx(-1);
    setAnimating(false);
  };

  const handlePeek = async () => {
    if (!stackRef.current.length) { setStatus("Stack is empty."); return; }
    setAnimating(true);
    const top = stackRef.current[stackRef.current.length - 1];
    setActiveIdx(stackRef.current.length - 1);
    setStatus(`peek() = ${top} — O(1): read top without removing.`);
    addTrace(`peek() = ${top}`);
    await sleep(ANIM_MS * 2);
    setActiveIdx(-1);
    setAnimating(false);
  };

  const handleReset = () => {
    if (animating) return;
    sync([4, 2, 8]);
    setActiveIdx(-1); setInputVal("");
    setStatus("Reset."); setTrace([]);
  };

  // Render stack top → bottom (visual top at top of page)
  const visual = [...stack].reverse();

  return (
    <div className="stack-viz">
      <div className="stack-viz-header">
        <h4>Stack (ArrayDeque) Visualizer</h4>
        <span>size = {stack.length}</span>
      </div>

      <div className="stack-viz-controls">
        <input className="text-input" placeholder="value" value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !animating && handlePush()}
          disabled={animating} />
        <button className="ghost-btn" onClick={handlePush} disabled={animating}>push</button>
        <button className="ghost-btn" onClick={handlePop} disabled={animating || !stack.length}>pop</button>
        <button className="ghost-btn" onClick={handlePeek} disabled={animating || !stack.length}>peek</button>
        <button className="ghost-btn" onClick={handleReset} disabled={animating}>Reset</button>
      </div>

      <p className="stack-viz-status">{status}</p>

      <div className="stack-container">
        <div className="stack-tower">
          {stack.length === 0 ? (
            <div className="stack-empty-msg">Stack is empty</div>
          ) : (
            visual.map((v, i) => {
              const origIdx = stack.length - 1 - i;
              const isActive = origIdx === activeIdx;
              const isTop = origIdx === stack.length - 1;
              return (
                <div key={`${v}-${origIdx}`} className={`stack-cell ${isActive ? "active" : ""} ${isTop ? "top" : ""}`}>
                  <span className="stack-cell-val">{v}</span>
                  {isTop && <span className="stack-top-label">← top</span>}
                </div>
              );
            })
          )}
          <div className="stack-base">▬ base</div>
        </div>
        <div className="stack-info-col">
          <div className="stack-info-item"><span>top</span><strong>{stack.length ? stack[stack.length - 1] : "—"}</strong></div>
          <div className="stack-info-item"><span>size</span><strong>{stack.length}</strong></div>
          <div className="stack-info-item"><span>empty?</span><strong>{stack.length === 0 ? "yes" : "no"}</strong></div>
        </div>
      </div>

      <div className="array-explain">
        <h5>LIFO behaviour</h5>
        <ol>
          <li><strong>push(x)</strong> — O(1): add to top of stack.</li>
          <li><strong>pop()</strong> — O(1): remove &amp; return top element.</li>
          <li><strong>peek()</strong> — O(1): read top without removing.</li>
          <li>Classic uses: bracket matching, DFS, undo systems, call stacks.</li>
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
