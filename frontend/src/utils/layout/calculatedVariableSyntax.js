// Visual tokens only: this does not parse, validate or execute a script.
export function calculatedVariableTokens(script) {
  const pattern = /#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:if|elif|else|for|in|and|or|not|is|None|True|False)\b|\b(?:var|ficha|out)\b|\b\d+(?:\.\d+)?\b/g
  const tokens = []
  let offset = 0
  for (const match of script.matchAll(pattern)) {
    if (match.index > offset) tokens.push({ text: script.slice(offset, match.index), type: "plain" })
    const text = match[0]
    tokens.push({ text, type: text.startsWith("#") ? "comment" : /^["']/.test(text) ? "string" : /^\d/.test(text) ? "number" : /^(var|ficha|out)$/.test(text) ? "input" : "keyword" })
    offset = match.index + text.length
  }
  tokens.push({ text: script.slice(offset) + "\n", type: "plain" })
  return tokens
}
