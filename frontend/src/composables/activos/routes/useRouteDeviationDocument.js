import { ref } from "vue"

import { buildRouteDeviationDocument } from "../../../utils/activos/routes/buildRouteDeviationDocument.js"
import { getReportBrandImageDataUrl } from "../../../utils/reports/export/reportBranding.js"

const PDF_RENDER_WIDTH = 980
const PDF_RENDER_HEIGHT = 1400
const PDF_RENDER_DELAY_MS = 1200
const PDF_MARGIN_MM = 8
const PDF_CAPTURE_SCALE = 1.35
const SVG_HREF_NAMESPACE = "http://www.w3.org/1999/xlink"

const wait = (delay) => {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay)
  })
}

const readBlobAsDataUrl = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener(
      "load",
      () => {
        resolve(String(reader.result || ""))
      },
      {
        once: true,
      },
    )
    reader.addEventListener(
      "error",
      () => {
        reject(reader.error || new Error("No fue posible leer la imagen del mapa."))
      },
      {
        once: true,
      },
    )
    reader.readAsDataURL(blob)
  })
}

const fetchImageAsDataUrl = async (imageUrl) => {
  const response = await fetch(imageUrl, {
    mode: "cors",
  })

  if (!response.ok) {
    throw new Error("No fue posible cargar una tesela del mapa.")
  }

  return readBlobAsDataUrl(await response.blob())
}

const getSvgImageHref = (image) => {
  return image.getAttribute("href") || image.getAttributeNS(SVG_HREF_NAMESPACE, "href") || ""
}

const setSvgImageHref = (image, imageUrl) => {
  image.setAttribute("href", imageUrl)
  image.setAttributeNS(SVG_HREF_NAMESPACE, "href", imageUrl)
}

const inlineSnapshotTileImages = async (frameDocument) => {
  const tileImages = Array.from(frameDocument?.querySelectorAll("image.snapshot-tile") || [])
  const imageCache = new Map()

  await Promise.all(
    tileImages.map(async (image) => {
      const imageUrl = getSvgImageHref(image)

      if (!imageUrl || imageUrl.startsWith("data:")) return

      try {
        if (!imageCache.has(imageUrl)) {
          imageCache.set(imageUrl, fetchImageAsDataUrl(imageUrl))
        }

        setSvgImageHref(image, await imageCache.get(imageUrl))
      } catch {
        // If a tile fails, keep the route overlay printable instead of blocking the report.
      }
    }),
  )
}

const createPdfFilename = (title) => {
  const normalizedName = String(title || "informe-desvio-ruta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${normalizedName || "informe-desvio-ruta"}.pdf`
}

const waitForFrameLoad = (frame) => {
  return new Promise((resolve) => {
    const frameDocument = frame.contentDocument

    if (frameDocument?.readyState === "complete") {
      window.setTimeout(resolve, 0)
      return
    }

    frame.addEventListener("load", resolve, {
      once: true,
    })
  })
}

const waitForFrameAssets = async (frameDocument) => {
  if (frameDocument?.fonts?.ready) {
    await frameDocument.fonts.ready.catch(() => {})
  }

  const images = Array.from(frameDocument?.images || [])

  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve()

      return new Promise((resolve) => {
        const finish = () => resolve()

        image.addEventListener("load", finish, {
          once: true,
        })
        image.addEventListener("error", finish, {
          once: true,
        })
        window.setTimeout(finish, 2500)
      })
    }),
  )

  await wait(PDF_RENDER_DELAY_MS)
}

const createHiddenReportFrame = (reportDocument) => {
  const frame = window.document.createElement("iframe")

  frame.setAttribute("aria-hidden", "true")
  frame.tabIndex = -1
  frame.style.position = "fixed"
  frame.style.left = "-10000px"
  frame.style.top = "0"
  frame.style.width = `${PDF_RENDER_WIDTH}px`
  frame.style.height = `${PDF_RENDER_HEIGHT}px`
  frame.style.border = "0"
  frame.style.opacity = "0.01"
  frame.style.pointerEvents = "none"
  frame.style.zIndex = "-1"

  window.document.body.appendChild(frame)

  const frameDocument = frame.contentDocument

  frameDocument.open()
  frameDocument.write(reportDocument.html)
  frameDocument.close()

  return frame
}

const renderReportPdf = async (reportDocument) => {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ])
  const frame = createHiddenReportFrame(reportDocument)

  try {
    await waitForFrameLoad(frame)

    const frameDocument = frame.contentDocument

    await inlineSnapshotTileImages(frameDocument)
    await waitForFrameAssets(frameDocument)

    const reportElement = frameDocument.querySelector(".document") || frameDocument.body
    const canvas = await html2canvas(reportElement, {
      allowTaint: false,
      backgroundColor: "#ffffff",
      imageTimeout: 8000,
      logging: false,
      scale: PDF_CAPTURE_SCALE,
      useCORS: true,
      windowWidth: PDF_RENDER_WIDTH,
      width: reportElement.scrollWidth,
      height: reportElement.scrollHeight,
    })
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const contentWidth = pageWidth - PDF_MARGIN_MM * 2
    const contentHeight = pageHeight - PDF_MARGIN_MM * 2
    const pixelsPerMillimeter = canvas.width / contentWidth
    const pageSliceHeight = Math.floor(contentHeight * pixelsPerMillimeter)
    let sourceY = 0
    let pageIndex = 0

    while (sourceY < canvas.height) {
      const sliceHeight = Math.min(pageSliceHeight, canvas.height - sourceY)
      const sliceCanvas = window.document.createElement("canvas")
      const sliceContext = sliceCanvas.getContext("2d")

      sliceCanvas.width = canvas.width
      sliceCanvas.height = sliceHeight
      sliceContext.fillStyle = "#ffffff"
      sliceContext.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      sliceContext.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      )

      if (pageIndex > 0) {
        pdf.addPage()
      }

      pdf.addImage(
        sliceCanvas.toDataURL("image/jpeg", 0.94),
        "JPEG",
        PDF_MARGIN_MM,
        PDF_MARGIN_MM,
        contentWidth,
        sliceHeight / pixelsPerMillimeter,
        undefined,
        "FAST",
      )

      sourceY += sliceHeight
      pageIndex += 1
    }

    pdf.save(createPdfFilename(reportDocument.title))
  } finally {
    frame.remove()
  }
}

export function useRouteDeviationDocument() {
  const isGeneratingDeviationDocument = ref(false)
  const deviationDocumentError = ref("")

  const clearDeviationDocumentError = () => {
    deviationDocumentError.value = ""
  }

  const generateRouteDeviationDocument = async (payload) => {
    clearDeviationDocumentError()

    if (typeof window === "undefined") {
      deviationDocumentError.value = "El documento solo puede generarse desde el navegador."

      return false
    }

    isGeneratingDeviationDocument.value = true

    try {
      const brandImageDataUrl = await getReportBrandImageDataUrl()
      const reportDocument = buildRouteDeviationDocument({
        ...payload,
        brandImageDataUrl,
      })

      await renderReportPdf(reportDocument)

      return true
    } catch (error) {
      deviationDocumentError.value =
        error instanceof Error ? error.message : "No fue posible descargar el informe de desvío."

      return false
    } finally {
      isGeneratingDeviationDocument.value = false
    }
  }

  return {
    isGeneratingDeviationDocument,
    deviationDocumentError,
    clearDeviationDocumentError,
    generateRouteDeviationDocument,
  }
}
