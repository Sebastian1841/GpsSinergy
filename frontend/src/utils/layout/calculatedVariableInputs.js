// Static reference discovery, not a validator or interpreter. Tokenizing whole
// literals first keeps examples in comments and quoted text out of the counts.
const tokens = /#[^\r\n]*|(?:[rRuUbBfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\[\s\S]|[^"\\\r\n])*(?:"|(?=\r|\n|$))|'(?:\\[\s\S]|[^'\\\r\n])*(?:'|(?=\r|\n|$)))|[A-Za-z_][A-Za-z_0-9]*|[^\s]/g

function literalKey(token) {
  if (!token || !/^["']/.test(token) || token.startsWith('"""') || token.startsWith("'''")) return null
  const quote = token[0]
  if (token.length < 2 || token.at(-1) !== quote) return null
  return token.slice(1, -1).replace(/\\([\\'"nrt])/g, (_, char) => ({ n: "\n", r: "\r", t: "\t" })[char] ?? char)
}

function references(script) {
  const parts = [...String(script).matchAll(tokens)].filter(match => !match[0].startsWith("#"))
  const found = []
  for (let index = 0; index < parts.length - 1; index++) {
    const name = parts[index][0]
    if (!["var", "ficha", "out"].includes(name) || parts[index - 1]?.[0] === "." || parts[index + 1][0] !== "[") continue
    const literal = parts[index + 2]
    const key = parts[index + 3]?.[0] === "]" ? literalKey(literal?.[0]) : null
    found.push({ name, key, start: literal?.index, end: literal ? literal.index + literal[0].length : undefined,
      quote: literal?.[0][0], assigned: key !== null && parts[index + 4]?.[0] === "=" && parts[index + 5]?.[0] !== "=" })
  }
  return found
}

export function calculatedVariableInputs(script = "") {
  const signals = new Set(), profile = new Set()
  for (const { name, key } of references(script)) {
    if (name !== "out" && key !== null && key !== "") (name === "var" ? signals : profile).add(key)
  }
  return { signals: [...signals], profile: [...profile] }
}

export function calculatedVariableOutputs(script, key) {
  const outputs = references(script).filter(reference => reference.name === "out")
  const keys = [...new Set(outputs.filter(reference => reference.assigned).map(reference => reference.key))]
  const dynamic = outputs.some(reference => reference.key === null)
  const matches = keys.includes(key)
  const canRename = !matches && !dynamic && keys.length === 1 && /^[a-z][a-z0-9_]{0,63}$/.test(key)
  return { keys, dynamic, matches, canRename }
}

export function renameCalculatedVariableOutput(script, key) {
  const info = calculatedVariableOutputs(script, key)
  if (!info.canRename) return script
  const replacements = references(script).filter(reference => reference.name === "out" && reference.key === info.keys[0])
  let next = script
  for (const reference of replacements.reverse()) {
    next = next.slice(0, reference.start) + reference.quote + key + reference.quote + next.slice(reference.end)
  }
  return next
}

export function calculatedProfileValue(asset, key) {
  if (!asset) return undefined
  if (asset.ficha && typeof asset.ficha === "object" && Object.hasOwn(asset.ficha, key)) return asset.ficha[key]
  const field = key.startsWith("ficha_") ? key : `ficha_${key}`
  return Object.hasOwn(asset, field) ? asset[field] : undefined
}
