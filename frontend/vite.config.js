import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"
import { fileURLToPath, URL } from "node:url"

const optionalPdfDependencyStub = fileURLToPath(
  new URL("./src/utils/pdf/optionalPdfDependencyStub.js", import.meta.url),
)

const getVendorChunk = (id) => {
  if (!id.includes("node_modules")) return undefined

  if (id.includes("exceljs")) return "vendor-excel"
  if (id.includes("jspdf")) return "vendor-pdf"
  if (id.includes("chart.js")) return "vendor-charts"
  if (id.includes("leaflet")) return "vendor-map"
  if (id.includes("jszip")) return "vendor-zip"
  if (id.includes("vue")) return "vendor-vue"

  return undefined
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      canvg: optionalPdfDependencyStub,
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: getVendorChunk,
      },
    },
  },
})
