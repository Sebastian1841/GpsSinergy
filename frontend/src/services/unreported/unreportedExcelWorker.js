import { createUnreportedExcelWorkbook } from "./unreportedExcelExportService.js"

export const buildUnreportedExcelBuffer = async ({ rows, options }) => {
  const workbook = await createUnreportedExcelWorkbook(rows, options)
  const data = await workbook.xlsx.writeBuffer()
  return data instanceof ArrayBuffer
    ? data
    : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
}

if (typeof self !== "undefined" && typeof document === "undefined") {
  self.onmessage = async ({ data }) => {
    try {
      const buffer = await buildUnreportedExcelBuffer(data)
      self.postMessage({ buffer }, [buffer])
    } catch (error) {
      self.postMessage({ error: error.message || "No fue posible generar el Excel" })
    }
  }
}
