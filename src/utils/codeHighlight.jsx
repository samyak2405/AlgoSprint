import React from "react";
import { DP_CODE_VARIANTS } from "../data/dpCodeVariants.js";

export function getCodeVariants(result) {
  if (result.codeVariants && result.codeVariants.length) return result.codeVariants;
  if (result.name.startsWith("DP Variation:")) {
    const known = DP_CODE_VARIANTS[result.name];
    if (known) return known;
    return [
      {
        title: "1) Recursive (plain)",
        code: `// Recursive idea for ${result.name}
// Define state, recurse over choices, combine subproblems.`,
      },
      {
        title: "2) Memoization + recursion (top-down)",
        code: `// Top-down memoized version
// Cache by state key and reuse overlapping subproblems.`,
      },
      {
        title: "3) Iterative DP (bottom-up)",
        code: result.javaCode,
      },
    ];
  }
  return [{ title: "Java", code: result.javaCode }];
}

const JAVA_KEYWORDS = new Set([
  "abstract",
  "assert",
  "boolean",
  "break",
  "byte",
  "case",
  "catch",
  "char",
  "class",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extends",
  "final",
  "finally",
  "float",
  "for",
  "if",
  "implements",
  "import",
  "instanceof",
  "int",
  "interface",
  "long",
  "native",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "short",
  "static",
  "strictfp",
  "super",
  "switch",
  "synchronized",
  "this",
  "throw",
  "throws",
  "transient",
  "try",
  "void",
  "volatile",
  "while",
  "var",
  "true",
  "false",
  "null",
]);

function classifyToken(token) {
  if (/^\s+$/.test(token)) return "space";
  if (/^\/\/.*$/.test(token)) return "comment";
  if (/^".*"$/.test(token) || /^'.*'$/.test(token)) return "string";
  if (/^\d+(_\d+)*(\.\d+)?$/.test(token)) return "number";
  if (/^[()[\]{}.,;]$/.test(token)) return "punct";
  if (/^[+\-*/%=&|!<>^?:]+$/.test(token)) return "operator";
  if (JAVA_KEYWORDS.has(token)) return "keyword";
  if (/^[A-Z][A-Za-z0-9_]*$/.test(token)) return "type";
  if (/^[a-zA-Z_][A-Za-z0-9_]*$/.test(token)) return "ident";
  return "plain";
}

export function renderHighlightedCode(code) {
  const lines = code.split("\n");
  const tokenRe = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:_\d+)*(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*|\s+|[()[\]{}.,;]|[+\-*/%=&|!<>^?:]+)/g;
  return lines.map((line, lineIdx) => {
    const tokens = line.match(tokenRe) || [line];
    return (
      <div className="code-line" key={`line-${lineIdx}`}>
        <span className="code-content">
          {tokens.map((tok, tokIdx) => (
            <span key={`tok-${lineIdx}-${tokIdx}`} className={`tok tok-${classifyToken(tok)}`}>
              {tok}
            </span>
          ))}
        </span>
      </div>
    );
  });
}
