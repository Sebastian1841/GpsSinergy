export const REPORT_BRAND = {
  name: "Sinergy Group",
  tagline: "",
  navy: "#102372",
  orange: "#ff6600",
  border: "#d8dee8",
  muted: "#64748b",
}

const REPORT_BRAND_IMAGE_URL = new URL("../../../assets/branding/sinergy-group.png", import.meta.url)

let cachedBrandImageDataUrlPromise = null

const loadBrowserBrandImage = async () => {
  const response = await fetch(REPORT_BRAND_IMAGE_URL)

  if (!response.ok) {
    throw new Error(`No se pudo cargar el logo de Sinergy: ${response.status}`)
  }

  const imageBlob = await response.blob()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || "")

      if (!result.startsWith("data:image/png;base64,")) {
        reject(new Error("El logo de Sinergy no es un PNG valido"))
        return
      }

      resolve(result)
    }

    reader.onerror = () => {
      reject(reader.error || new Error("No se pudo leer el logo de Sinergy"))
    }

    reader.readAsDataURL(imageBlob)
  })
}

const loadNodeBrandImage = async () => {
  const nodeFsModule = "node:fs/promises"
  const { readFile } = await import(/* @vite-ignore */ nodeFsModule)
  const imageBuffer = await readFile(REPORT_BRAND_IMAGE_URL)

  return `data:image/png;base64,${imageBuffer.toString("base64")}`
}

const loadReportBrandImage = async () => {
  if (typeof window === "undefined") {
    return loadNodeBrandImage()
  }

  return loadBrowserBrandImage()
}

export const getReportBrandImageDataUrl = () => {
  if (!cachedBrandImageDataUrlPromise) {
    cachedBrandImageDataUrlPromise = loadReportBrandImage().catch((error) => {
      cachedBrandImageDataUrlPromise = null
      throw error
    })
  }

  return cachedBrandImageDataUrlPromise
}
