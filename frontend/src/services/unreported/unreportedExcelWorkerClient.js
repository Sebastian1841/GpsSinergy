import { toRaw } from "vue"
import { downloadBlob } from "../itinerarios/itineraryExportFormatUtils.js"
import { getReportBrandImageDataUrl } from "../../utils/reports/export/reportBranding.js"
export { prepareUnreportedExcelRows } from "./unreportedExcelExportService.js"

// Strip Vue proxies before structured cloning; keep dates and optional values intact.
export const unreportedWorkerSnapshot = (value) => {
  if (!value || typeof value !== "object") return value
  const raw = toRaw(value)
  if (raw instanceof Date) return new Date(raw)
  if (Array.isArray(raw)) return raw.map(unreportedWorkerSnapshot)
  return Object.fromEntries(
    Object.entries(raw).map(([key, item]) => [key, unreportedWorkerSnapshot(item)]),
  )
}

export const runUnreportedExcelWorker = (worker, payload) =>
  new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      worker.terminate()
      callback(value)
    }
    worker.onmessage = ({ data }) =>
      data.error ? finish(reject, new Error(data.error)) : finish(resolve, data.buffer)
    worker.onerror = () => finish(reject, new Error("No fue posible generar el Excel"))
    worker.onmessageerror = () => finish(reject, new Error("No fue posible recibir el Excel"))
    try {
      worker.postMessage(payload)
    } catch (error) {
      finish(reject, error)
    }
  })

export const exportUnreportedExcel = async (rows, options = {}) => {
  if (typeof Worker === "undefined") {
    const service = await import("./unreportedExcelExportService.js")
    return service.exportUnreportedExcel(rows, options)
  }
  const brandImage = await getReportBrandImageDataUrl().catch(() => "")
  const payload = unreportedWorkerSnapshot({ rows, options: { ...options, brandImage } })
  const worker = new Worker(new URL("./unreportedExcelWorker.js", import.meta.url), {
    type: "module",
  })
  const buffer = await runUnreportedExcelWorker(worker, payload)
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    options.history ? "historial-de-equipos.xlsx" : "equipos-sin-reporte.xlsx",
  )
}
