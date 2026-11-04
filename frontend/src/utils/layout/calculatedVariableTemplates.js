// Frontend reference contract: limpiar(value), numero(value),
// partir(text, separator), promedio(values). Verify against the original engine.
export function calculatedVariableTemplates(key = "resultado") {
  const output = `out[${JSON.stringify(String(key || "resultado"))}]`
  return [
    { label: "Dividir por 1000", code: `\n${output} = var["speed"] / 1000\n` },
    { label: "Crear variable", code: `\n${output} = var["speed"]\n` },
    { label: "Limpiar texto", code: `
texto = var["texto"]
limpio = limpiar(texto) if texto is not None else None
${output} = limpio if limpio else None
` },
    { label: "Promedio CSV", code: `
csv = var["csv"]
valores = []
valido = csv is not None and csv != ""
if valido:
    for campo in partir(csv, ","):
        campo = limpiar(campo)
        if campo is None or campo == "":
            valido = False
        else:
            valor = numero(campo)
            if valor is None:
                valido = False
            else:
                valores = valores + [valor]
${output} = promedio(valores) if valido and valores else None
` },
  ]
}
