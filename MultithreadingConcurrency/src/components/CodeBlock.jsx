import React, { useState } from "react";

export default function CodeBlock({ code, lang = "java" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-lang">{lang}</span>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      <button
        className={"code-copy-btn" + (copied ? " copied" : "")}
        onClick={handleCopy}
        aria-label="Copy code"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
