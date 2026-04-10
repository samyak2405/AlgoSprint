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

export function tokenizeCode(code) {
  const lines = code.split("\n");
  const tokenRe = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:_\d+)*(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*|\s+|[()[\]{}.,;]|[+\-*/%=&|!<>^?:]+)/g;
  return lines.map((line) => {
    const tokens = line.match(tokenRe) || [line];
    return tokens.map((tok) => ({ value: tok, kind: classifyToken(tok) }));
  });
}
