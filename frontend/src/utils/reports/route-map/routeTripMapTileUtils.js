export const TILE_SIZE = 256

const TILE_SUBDOMAINS = ["a", "b", "c", "d"]
const TILE_LOAD_TIMEOUT_MS = 3500
const TILE_LOAD_CONCURRENCY = 6
const TILE_IMAGE_CACHE_LIMIT = 180
const tileImageCache = new Map()

const getTileUrl = ({ x, y, zoom }) => {
  const subdomain = TILE_SUBDOMAINS[Math.abs(x + y) % TILE_SUBDOMAINS.length]

  return `https://${subdomain}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`
}

const trimTileImageCache = () => {
  while (tileImageCache.size > TILE_IMAGE_CACHE_LIMIT) {
    const oldestKey = tileImageCache.keys().next().value

    tileImageCache.delete(oldestKey)
  }
}

const loadImageUncached = (url) => {
  return new Promise((resolve) => {
    const image = new Image()
    let settled = false
    const finish = (loadedImage) => {
      if (settled) return

      settled = true
      globalThis.clearTimeout(timeout)
      resolve(loadedImage)
    }
    const timeout = globalThis.setTimeout(() => {
      finish(null)
    }, TILE_LOAD_TIMEOUT_MS)

    image.crossOrigin = "anonymous"
    image.onload = () => {
      finish(image)
    }
    image.onerror = () => {
      finish(null)
    }
    image.src = url
  })
}

const loadImage = (url) => {
  const cachedRequest = tileImageCache.get(url)

  if (cachedRequest) {
    tileImageCache.delete(url)
    tileImageCache.set(url, cachedRequest)

    return cachedRequest
  }

  const request = loadImageUncached(url).then((image) => {
    if (!image) {
      tileImageCache.delete(url)
    }

    return image
  })

  tileImageCache.set(url, request)
  trimTileImageCache()

  return request
}

const mapWithConcurrency = async (items, limit, mapper) => {
  const results = new Array(items.length)
  let nextIndex = 0

  const workerCount = Math.min(Math.max(1, limit), items.length)
  const workers = Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex

      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  })

  await Promise.all(workers)

  return results
}

export const drawTiles = async ({ context, center, zoom, width, height }) => {
  const tileCount = 2 ** zoom
  const minPixelX = center.x - width / 2
  const maxPixelX = center.x + width / 2
  const minPixelY = center.y - height / 2
  const maxPixelY = center.y + height / 2
  const minTileX = Math.floor(minPixelX / TILE_SIZE)
  const maxTileX = Math.floor(maxPixelX / TILE_SIZE)
  const minTileY = Math.max(0, Math.floor(minPixelY / TILE_SIZE))
  const maxTileY = Math.min(tileCount - 1, Math.floor(maxPixelY / TILE_SIZE))
  const tiles = []

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    const normalizedTileX = ((tileX % tileCount) + tileCount) % tileCount

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      tiles.push({
        x: tileX * TILE_SIZE - minPixelX,
        y: tileY * TILE_SIZE - minPixelY,
        url: getTileUrl({
          x: normalizedTileX,
          y: tileY,
          zoom,
        }),
      })
    }
  }

  const loadedTiles = await mapWithConcurrency(tiles, TILE_LOAD_CONCURRENCY, async (tile) => ({
    ...tile,
    image: await loadImage(tile.url),
  }))

  loadedTiles.forEach((tile) => {
    if (!tile.image) return

    context.drawImage(tile.image, tile.x, tile.y, TILE_SIZE, TILE_SIZE)
  })

  return loadedTiles.some((tile) => tile.image)
}
