import { getGeofenceColor } from "./geofenceUtils.js"

export const GEOFENCE_FILE_FORMAT_OPTIONS = [
  {
    id: "kml",
    label: "KML",
  },
  {
    id: "kmz",
    label: "KMZ",
  },
  {
    id: "geojson",
    label: "GeoJSON",
  },
  {
    id: "csv",
    label: "CSV",
  },
  {
    id: "xml",
    label: "XML",
  },
]

const MIME_TYPES = {
  csv: "text/csv;charset=utf-8",
  geojson: "application/geo+json;charset=utf-8",
  kml: "application/vnd.google-earth.kml+xml;charset=utf-8",
  kmz: "application/vnd.google-earth.kmz",
  xml: "application/xml;charset=utf-8",
}

const CSV_HEADERS = [
  "id",
  "nombre",
  "tipo",
  "grupo",
  "color",
  "radio_metros",
  "tolerancia_metros",
  "centro_lat",
  "centro_lng",
  "coordenadas",
]

const SUPPORTED_FORMATS = new Set(GEOFENCE_FILE_FORMAT_OPTIONS.map((option) => option.id))

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null

  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : null
}

const normalizeText = (value) => {
  return String(value ?? "").trim()
}

const normalizeFormat = (format) => {
  const normalizedFormat = normalizeText(format).replace(/^\./, "").toLowerCase()

  if (normalizedFormat === "json") return "geojson"

  return SUPPORTED_FORMATS.has(normalizedFormat) ? normalizedFormat : "kml"
}

export const getGeofenceFileFormat = (value) => {
  const text = normalizeText(value).toLowerCase()
  const extension = text.includes(".") ? text.split(".").pop() : text

  return normalizeFormat(extension)
}

const escapeXml = (value) => {
  return normalizeText(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    }

    return entities[character]
  })
}

const unescapeXml = (value) => {
  return normalizeText(value).replace(/&(amp|lt|gt|quot|apos);/g, (_match, entity) => {
    const entities = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
    }

    return entities[entity] || ""
  })
}

const escapeCsvValue = (value) => {
  const text = normalizeText(value)

  if (!/[;\n\r"]/.test(text)) return text

  return `"${text.replace(/"/g, '""')}"`
}

const normalizePoint = (point) => {
  const lat = toFiniteNumber(point?.lat)
  const lng = toFiniteNumber(point?.lng)

  if (lat === null || lng === null) return null

  return {
    lat,
    lng,
  }
}

const normalizeCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates)) return []

  return coordinates.map((point) => normalizePoint(point)).filter(Boolean)
}

const getGeofenceName = (geofence = {}) => {
  return normalizeText(geofence.name || geofence.nombre || "Geocerca sin nombre")
}

const getGeofenceGroupName = (geofence = {}) => {
  return normalizeText(geofence.groupName || geofence.group || geofence.grupo)
}

const getGeofenceCoordinates = (geofence = {}) => {
  if (geofence.type === "circle") {
    const center = normalizePoint(geofence.center)

    return center ? [center] : []
  }

  return normalizeCoordinates(geofence.coordinates)
}

const formatNumber = (value) => {
  const numberValue = toFiniteNumber(value)

  return numberValue === null ? "" : String(numberValue)
}

const coordinatesToText = (coordinates = []) => {
  return normalizeCoordinates(coordinates)
    .map((point) => {
      return `${formatNumber(point.lat)},${formatNumber(point.lng)}`
    })
    .join("|")
}

const parseLatLngCoordinates = (value) => {
  const text = normalizeText(value)

  if (!text) return []

  if (text.startsWith("[")) {
    try {
      return normalizeCoordinates(JSON.parse(text))
    } catch {
      return []
    }
  }

  return text
    .split("|")
    .map((pair) => {
      const [lat, lng] = pair
        .trim()
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)

      return normalizePoint({
        lat,
        lng,
      })
    })
    .filter(Boolean)
}

const parseLngLatCoordinates = (value) => {
  const text = normalizeText(value)

  if (!text) return []

  return text
    .split("|")
    .map((pair) => {
      const [lng, lat] = pair
        .trim()
        .split(/[,\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)

      return normalizePoint({
        lat,
        lng,
      })
    })
    .filter(Boolean)
}

const getFirstValue = (source, aliases = []) => {
  return aliases
    .map((alias) => source[normalizeCsvHeader(alias)])
    .find((value) => normalizeText(value))
}

const parseWktCoordinates = (value) => {
  const text = normalizeText(value)

  if (!text) {
    return {
      coordinates: [],
      type: "",
    }
  }

  const normalizedText = text.toUpperCase()

  if (normalizedText.startsWith("POINT")) {
    const pointText = text.match(/\(([^()]+)\)/)?.[1] || ""

    return {
      coordinates: parseLngLatCoordinates(pointText.replace(/\s*,\s*/g, "|")),
      type: "circle",
    }
  }

  if (normalizedText.startsWith("LINESTRING")) {
    const lineText = text.match(/\(([^()]+)\)/)?.[1] || ""

    return {
      coordinates: parseLngLatCoordinates(lineText.replace(/\s*,\s*/g, "|")),
      type: "route",
    }
  }

  if (normalizedText.startsWith("POLYGON")) {
    const polygonText = text.match(/\(\(([\s\S]+?)\)\)/)?.[1] || ""
    const coordinates = parseLngLatCoordinates(polygonText.replace(/\s*,\s*/g, "|"))
    const firstPoint = coordinates[0]
    const lastPoint = coordinates[coordinates.length - 1]
    const isClosed =
      firstPoint &&
      lastPoint &&
      firstPoint.lat === lastPoint.lat &&
      firstPoint.lng === lastPoint.lng

    return {
      coordinates: isClosed ? coordinates.slice(0, -1) : coordinates,
      type: "polygon",
    }
  }

  return {
    coordinates: [],
    type: "",
  }
}

const parseKmlCoordinates = (value) => {
  return normalizeText(value)
    .split(/\s+/)
    .map((pair) => {
      const [lng, lat] = pair.split(",")

      return normalizePoint({
        lat,
        lng,
      })
    })
    .filter(Boolean)
}

const pointToKmlCoordinate = (point) => {
  return `${formatNumber(point.lng)},${formatNumber(point.lat)},0`
}

const closePolygonCoordinates = (coordinates = []) => {
  const validCoordinates = normalizeCoordinates(coordinates)
  const firstPoint = validCoordinates[0]
  const lastPoint = validCoordinates[validCoordinates.length - 1]

  if (!firstPoint || !lastPoint) return validCoordinates

  if (firstPoint.lat === lastPoint.lat && firstPoint.lng === lastPoint.lng) {
    return validCoordinates
  }

  return [...validCoordinates, firstPoint]
}

const hexToKmlColor = (hexColor) => {
  const color = normalizeText(hexColor).replace("#", "")

  if (!/^[\da-f]{6}$/i.test(color)) return "ff0066ff"

  const red = color.slice(0, 2)
  const green = color.slice(2, 4)
  const blue = color.slice(4, 6)

  return `ff${blue}${green}${red}`.toLowerCase()
}

const escapeRegExp = (value) => {
  return normalizeText(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const getTagText = (source, tagName) => {
  const escapedTagName = escapeRegExp(tagName)
  const pattern = new RegExp(
    `<(?:[\\w-]+:)?${escapedTagName}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${escapedTagName}>`,
    "i",
  )
  const match = normalizeText(source).match(pattern)

  return match ? unescapeXml(match[1]) : ""
}

const parseAttributes = (source = "") => {
  const attributes = {}
  const pattern = /([\w:-]+)\s*=\s*["']([^"']*)["']/g
  let match = pattern.exec(source)

  while (match) {
    attributes[match[1]] = unescapeXml(match[2])
    match = pattern.exec(source)
  }

  return attributes
}

const stripXmlTags = (value) => {
  return unescapeXml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const normalizeXmlKey = (value) => {
  return normalizeText(value)
    .split(":")
    .pop()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const getAttributeValue = (attributes = {}, aliases = []) => {
  const normalizedAliases = new Set(aliases.map(normalizeXmlKey))

  return (
    Object.entries(attributes).find(([key, value]) => {
      return normalizedAliases.has(normalizeXmlKey(key)) && normalizeText(value)
    })?.[1] || ""
  )
}

const getFirstTagText = (source, aliases = []) => {
  return (
    aliases.map((alias) => getTagText(source, alias)).find((value) => normalizeText(value)) || ""
  )
}

const getFirstXmlValue = ({ attributes = {}, body = "", aliases = [] } = {}) => {
  return getAttributeValue(attributes, aliases) || getFirstTagText(body, aliases)
}

const getXmlElementMatches = (source, tagNames = []) => {
  const text = normalizeText(source)
  const matches = []

  tagNames.forEach((tagName) => {
    const escapedTagName = escapeRegExp(tagName)
    const elementPattern = new RegExp(
      `<((?:[\\w-]+:)?${escapedTagName})\\b([^>]*)>([\\s\\S]*?)<\\/\\1>`,
      "gi",
    )
    const selfClosingPattern = new RegExp(`<((?:[\\w-]+:)?${escapedTagName})\\b([^>]*)\\/>`, "gi")
    let match = elementPattern.exec(text)

    while (match) {
      matches.push({
        attributesText: match[2],
        body: match[3],
        tagName: match[1],
      })

      match = elementPattern.exec(text)
    }

    match = selfClosingPattern.exec(text)

    while (match) {
      matches.push({
        attributesText: match[2],
        body: "",
        tagName: match[1],
      })

      match = selfClosingPattern.exec(text)
    }
  })

  return matches
}

const XML_GEOFENCE_TAG_ALIASES = [
  "geofence",
  "geocerca",
  "zone",
  "zona",
  "area",
  "fence",
  "perimeter",
  "perimetro",
  "boundary",
  "region",
]

const XML_NAME_ALIASES = [
  "name",
  "nombre",
  "label",
  "etiqueta",
  "title",
  "titulo",
  "geofence",
  "geocerca",
  "zone",
  "zona",
]

const XML_ID_ALIASES = ["id", "identifier", "geofenceId", "geocercaId", "codigo", "code"]
const XML_TYPE_ALIASES = ["type", "tipo", "geometry", "geometryType", "forma", "shape"]
const XML_GROUP_ALIASES = ["groupName", "group", "grupo", "category", "categoria"]
const XML_COLOR_ALIASES = ["color", "stroke", "strokeColor", "stroke_color", "lineColor"]
const XML_RADIUS_ALIASES = [
  "radiusMeters",
  "radius_meters",
  "radius",
  "radio_metros",
  "radio",
  "radioMetros",
]
const XML_TOLERANCE_ALIASES = [
  "toleranceMeters",
  "tolerance_meters",
  "tolerance",
  "tolerancia_metros",
  "tolerancia",
]
const XML_LAT_ALIASES = ["lat", "latitude", "latitud", "centerLat", "center_lat", "centroLat", "y"]
const XML_LNG_ALIASES = [
  "lng",
  "lon",
  "long",
  "longitude",
  "longitud",
  "centerLng",
  "centerLon",
  "center_lng",
  "centroLng",
  "x",
]
const XML_CENTER_TAG_ALIASES = ["center", "centro", "centroid", "location", "ubicacion"]
const XML_POINT_TAG_ALIASES = [
  "point",
  "punto",
  "coordinate",
  "coordenada",
  "coord",
  "vertex",
  "vertice",
  "node",
  "latLng",
  "trkpt",
  "rtept",
  "wpt",
]
const XML_COORDINATE_TEXT_ALIASES = [
  "coordinates",
  "coordenadas",
  "coords",
  "points",
  "puntos",
  "vertices",
  "path",
  "ruta",
  "latLng",
  "lonLat",
  "lngLat",
  "kmlCoordinates",
  "kml_coordinates",
]
const XML_WKT_ALIASES = ["wkt", "geometryWkt", "geometry_wkt"]

const getXmlPointFromAttributes = (attributes = {}) => {
  return normalizePoint({
    lat: getAttributeValue(attributes, XML_LAT_ALIASES),
    lng: getAttributeValue(attributes, XML_LNG_ALIASES),
  })
}

const getXmlPointFromBody = (body = "") => {
  return normalizePoint({
    lat: getFirstTagText(body, XML_LAT_ALIASES),
    lng: getFirstTagText(body, XML_LNG_ALIASES),
  })
}

const getXmlPointFromText = (value = "", preferredOrder = "latlng") => {
  const text = stripXmlTags(value)

  if (!text) return null

  const coordinates =
    preferredOrder === "lnglat"
      ? parseLngLatCoordinates(text.replace(/\s*;\s*/g, "|"))
      : parseLatLngCoordinates(text.replace(/\s*;\s*/g, "|"))

  return coordinates[0] || null
}

const parseXmlCoordinateText = ({ text = "", tagName = "" } = {}) => {
  const cleanText = stripXmlTags(text)

  if (!cleanText) return []

  const normalizedTagName = normalizeXmlKey(tagName)
  const isLngLatTag =
    normalizedTagName.includes("lonlat") ||
    normalizedTagName.includes("lnglat") ||
    normalizedTagName.includes("kml")
  const looksLikeKmlCoordinates =
    cleanText
      .split(/\s+/)
      .filter(Boolean)
      .some((pair) => pair.split(",").length >= 3) || isLngLatTag

  if (looksLikeKmlCoordinates) {
    return parseKmlCoordinates(cleanText)
  }

  if (cleanText.includes("|") || cleanText.includes(";")) {
    return parseLatLngCoordinates(cleanText.replace(/\s*;\s*/g, "|"))
  }

  if (cleanText.includes(",")) {
    return parseLatLngCoordinates(cleanText.replace(/\s+/g, "|"))
  }

  return parseLngLatCoordinates(cleanText.replace(/\s*,\s*/g, "|"))
}

const getXmlCenter = ({ attributes = {}, body = "" } = {}) => {
  const attributeCenter = getXmlPointFromAttributes(attributes)

  if (attributeCenter) return attributeCenter

  const centerFromTags = getXmlElementMatches(body, XML_CENTER_TAG_ALIASES)
    .map((match) => {
      const centerAttributes = parseAttributes(match.attributesText)

      return (
        getXmlPointFromAttributes(centerAttributes) ||
        getXmlPointFromBody(match.body) ||
        getXmlPointFromText(match.body)
      )
    })
    .find(Boolean)

  if (centerFromTags) return centerFromTags

  return getXmlPointFromBody(body)
}

const getXmlCoordinatePoints = (body = "") => {
  return getXmlElementMatches(body, XML_POINT_TAG_ALIASES)
    .map((match) => {
      const attributes = parseAttributes(match.attributesText)

      return (
        getXmlPointFromAttributes(attributes) ||
        getXmlPointFromBody(match.body) ||
        getXmlPointFromText(match.body)
      )
    })
    .filter(Boolean)
}

const getXmlCoordinateTextPoints = (body = "") => {
  return getXmlElementMatches(body, XML_COORDINATE_TEXT_ALIASES).flatMap((match) => {
    if (
      /<(?:[\w-]+:)?(?:point|punto|coordinate|coordenada|coord|vertex|vertice|node|latLng)\b/i.test(
        match.body,
      )
    ) {
      return []
    }

    return parseXmlCoordinateText({
      text: match.body,
      tagName: match.tagName,
    })
  })
}

const inferXmlGeofenceType = ({ attributes = {}, body = "", center, coordinates, wktType }) => {
  const explicitType = normalizeImportedType(
    getFirstXmlValue({
      attributes,
      body,
      aliases: XML_TYPE_ALIASES,
    }),
    "",
  )

  if (explicitType) return explicitType
  if (wktType) return wktType
  if (coordinates.length >= 3) return "polygon"
  if (coordinates.length >= 2) return "route"
  if (center || coordinates.length === 1) return "circle"

  return "polygon"
}

const isImportableGeofence = (geofence = {}) => {
  if (!geofence || typeof geofence !== "object") return false

  if (geofence.type === "circle") {
    return Boolean(normalizePoint(geofence.center)) && Number(geofence.radius) > 0
  }

  if (geofence.type === "route") {
    return normalizeCoordinates(geofence.coordinates).length >= 2
  }

  if (geofence.type === "polygon") {
    return normalizeCoordinates(geofence.coordinates).length >= 3
  }

  return false
}

const removeClosingCoordinate = (coordinates = []) => {
  const normalizedCoordinates = normalizeCoordinates(coordinates)
  const firstPoint = normalizedCoordinates[0]
  const lastPoint = normalizedCoordinates[normalizedCoordinates.length - 1]

  if (
    normalizedCoordinates.length > 3 &&
    firstPoint &&
    lastPoint &&
    firstPoint.lat === lastPoint.lat &&
    firstPoint.lng === lastPoint.lng
  ) {
    return normalizedCoordinates.slice(0, -1)
  }

  return normalizedCoordinates
}

const xmlNodeToGeofence = ({ attributesText = "", body = "" } = {}, index = 0) => {
  const attributes = parseAttributes(attributesText)
  const wkt = getFirstXmlValue({
    attributes,
    body,
    aliases: XML_WKT_ALIASES,
  })
  const wktResult = parseWktCoordinates(wkt)
  const coordinates = [
    ...getXmlCoordinatePoints(body),
    ...getXmlCoordinateTextPoints(body),
    ...wktResult.coordinates,
  ]
  const center = getXmlCenter({
    attributes,
    body,
  })
  const type = inferXmlGeofenceType({
    attributes,
    body,
    center,
    coordinates,
    wktType: wktResult.type,
  })
  const baseGeofence = {
    id: normalizeText(
      getFirstXmlValue({
        attributes,
        body,
        aliases: XML_ID_ALIASES,
      }),
    ),
    name:
      normalizeText(
        getFirstXmlValue({
          attributes,
          body,
          aliases: XML_NAME_ALIASES,
        }),
      ) || `Geocerca importada ${index + 1}`,
    type,
    groupName: normalizeText(
      getFirstXmlValue({
        attributes,
        body,
        aliases: XML_GROUP_ALIASES,
      }),
    ),
    color: normalizeText(
      getFirstXmlValue({
        attributes,
        body,
        aliases: XML_COLOR_ALIASES,
      }),
    ),
  }

  if (type === "circle") {
    return {
      ...baseGeofence,
      center: center || coordinates[0],
      radius:
        toFiniteNumber(
          getFirstXmlValue({
            attributes,
            body,
            aliases: XML_RADIUS_ALIASES,
          }),
        ) || 100,
    }
  }

  if (type === "route") {
    return {
      ...baseGeofence,
      coordinates,
      toleranceMeters:
        toFiniteNumber(
          getFirstXmlValue({
            attributes,
            body,
            aliases: XML_TOLERANCE_ALIASES,
          }),
        ) || 100,
    }
  }

  return {
    ...baseGeofence,
    coordinates: removeClosingCoordinate(coordinates),
  }
}

const getGpsGateObjectData = (objectBody = "") => {
  return getTagText(objectBody, "ObjectData")
}

const getGpsGateObjectGuid = (objectBody = "") => {
  return getTagText(objectBody, "TemplateGuid")
}

const getGpsGateObjectType = (objectBody = "") => {
  return getTagText(objectBody, "ObjectType")
}

const getGpsGateGroupRefs = (objectData = "") => {
  return getXmlElementMatches(objectData, ["GeofenceIDRef"])
    .map((match) => stripXmlTags(match.body))
    .filter(Boolean)
}

const isGpsGateGroupObject = (objectType = "") => {
  return normalizeText(objectType).includes("GeofenceGroupTemplateWrapper")
}

const isGpsGateGeofenceObject = (objectType = "") => {
  const normalizedObjectType = normalizeText(objectType)

  return (
    normalizedObjectType.includes("GeofenceTemplateWrapper") &&
    !normalizedObjectType.includes("GeofenceGroupTemplateWrapper")
  )
}

const buildGpsGateGroupMap = (objectNodes = []) => {
  const groupByGeofenceId = new Map()

  objectNodes.forEach((node) => {
    const objectType = getGpsGateObjectType(node.body)

    if (!isGpsGateGroupObject(objectType)) return

    const objectData = getGpsGateObjectData(node.body)
    const groupName = getFirstTagText(objectData, ["Name"]) || "Grupo importado"
    const color = getFirstTagText(objectData, ["Color"])

    getGpsGateGroupRefs(objectData).forEach((geofenceId) => {
      groupByGeofenceId.set(geofenceId, {
        color,
        groupName,
      })
    })
  })

  return groupByGeofenceId
}

const importGeofencesFromGpsGateXml = (content) => {
  const objectNodes = getXmlElementMatches(content, ["Object"])
  const groupByGeofenceId = buildGpsGateGroupMap(objectNodes)

  return objectNodes
    .map((node, index) => {
      const objectType = getGpsGateObjectType(node.body)

      if (!isGpsGateGeofenceObject(objectType)) return null

      const objectData = getGpsGateObjectData(node.body)
      const geofenceId = getGpsGateObjectGuid(node.body)
      const groupData = groupByGeofenceId.get(geofenceId) || {}
      const geofence = xmlNodeToGeofence(
        {
          attributesText: "",
          body: objectData,
        },
        index,
      )

      return {
        ...geofence,
        id: geofenceId || geofence.id,
        groupName: geofence.groupName || groupData.groupName || "",
        color: geofence.color || groupData.color || "",
      }
    })
    .filter(isImportableGeofence)
}

const importGeofencesFromGpx = (content) => {
  const text = normalizeText(content)
  const routeGeofences = getXmlElementMatches(text, ["trk", "rte"])
    .map((match, index) => {
      const geofence = xmlNodeToGeofence(
        {
          attributesText: match.attributesText,
          body: match.body,
        },
        index,
      )

      return {
        ...geofence,
        type: "route",
      }
    })
    .filter(isImportableGeofence)
  const waypointGeofences = getXmlElementMatches(text, ["wpt"])
    .map((match, index) => {
      const attributes = parseAttributes(match.attributesText)
      const center = getXmlPointFromAttributes(attributes) || getXmlPointFromBody(match.body)

      return {
        id: normalizeText(getAttributeValue(attributes, XML_ID_ALIASES)),
        name: getFirstTagText(match.body, XML_NAME_ALIASES) || `Punto importado ${index + 1}`,
        type: "circle",
        center,
        radius: 100,
      }
    })
    .filter(isImportableGeofence)

  return [...routeGeofences, ...waypointGeofences]
}

const getExtendedDataValue = (source, name) => {
  const pattern = new RegExp(
    `<Data[^>]*name=["']${name}["'][^>]*>[\\s\\S]*?<value[^>]*>([\\s\\S]*?)<\\/value>[\\s\\S]*?<\\/Data>`,
    "i",
  )
  const match = normalizeText(source).match(pattern)

  return match ? unescapeXml(match[1]) : ""
}

const parseCsvRows = (content) => {
  const text = String(content ?? "").replace(/^\uFEFF/, "")
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || ""
  const delimiter =
    (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ";" : ","
  const rows = []
  let row = []
  let cell = ""
  let insideQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        cell += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }

      continue
    }

    if (!insideQuotes && character === delimiter) {
      row.push(cell)
      cell = ""
      continue
    }

    if (!insideQuotes && (character === "\n" || character === "\r")) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1
      }

      row.push(cell)

      if (row.some((value) => normalizeText(value))) {
        rows.push(row)
      }

      row = []
      cell = ""
      continue
    }

    cell += character
  }

  row.push(cell)

  if (row.some((value) => normalizeText(value))) {
    rows.push(row)
  }

  return rows
}

const normalizeImportedType = (value, fallback = "polygon") => {
  const type = normalizeText(value).toLowerCase()

  if (type === "circle" || type === "circular" || type === "radio") return "circle"
  if (type === "route" || type === "ruta" || type === "line" || type === "linestring")
    return "route"
  if (type === "polygon" || type === "poligono" || type === "poligonal") return "polygon"

  return fallback
}

const normalizeCsvHeader = (value) => {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

const rowToObject = (headers, row) => {
  return headers.reduce((currentRow, header, index) => {
    return {
      ...currentRow,
      [normalizeCsvHeader(header)]: row[index],
    }
  }, {})
}

const getCsvRowName = (row, index) => {
  return (
    getFirstValue(row, [
      "nombre",
      "name",
      "geocerca",
      "geofence",
      "zona",
      "zone",
      "titulo",
      "title",
    ]) || `Geocerca importada ${index + 1}`
  )
}

const getCsvRowColor = (row) => {
  return getFirstValue(row, ["color", "stroke", "stroke_color", "linecolor"])
}

const getCsvRowGroupName = (row) => {
  return getFirstValue(row, ["grupo", "group", "groupname", "categoria", "category"])
}

const getCsvRowId = (row) => {
  return getFirstValue(row, ["id", "identifier", "geofenceid", "geocercaid"])
}

const getCsvRowType = (row) => {
  return getFirstValue(row, ["tipo", "type", "geometry", "geometrytype", "forma", "shape"])
}

const getCsvRowRadius = (row) => {
  return toFiniteNumber(
    getFirstValue(row, [
      "radio_metros",
      "radius",
      "radiusmeters",
      "radius_meters",
      "radio",
      "radio m",
      "radiusm",
    ]),
  )
}

const getCsvRowTolerance = (row) => {
  return toFiniteNumber(
    getFirstValue(row, [
      "tolerancia_metros",
      "tolerancemeters",
      "tolerance",
      "tolerance_meters",
      "tolerancia",
    ]),
  )
}

const getCsvRowCenter = (row) => {
  return normalizePoint({
    lat: getFirstValue(row, [
      "centro_lat",
      "lat",
      "latitude",
      "latitud",
      "centerlat",
      "center_lat",
      "y",
    ]),
    lng: getFirstValue(row, [
      "centro_lng",
      "lng",
      "lon",
      "long",
      "longitude",
      "longitud",
      "centerlng",
      "center_lng",
      "x",
    ]),
  })
}

const getCsvRowCoordinates = (row) => {
  const coordinatesText = getFirstValue(row, [
    "coordenadas",
    "coordinates",
    "coords",
    "puntos",
    "points",
    "latlng",
  ])
  const lonLatCoordinatesText = getFirstValue(row, [
    "lonlat",
    "lnglat",
    "kmlcoordinates",
    "kml_coordinates",
  ])
  const wkt = getFirstValue(row, ["wkt", "geometrywkt", "geometry_wkt"])
  const wktResult = parseWktCoordinates(wkt)
  const coordinates = [
    ...parseLatLngCoordinates(coordinatesText),
    ...parseLngLatCoordinates(lonLatCoordinatesText),
    ...wktResult.coordinates,
  ]

  return {
    coordinates,
    wktType: wktResult.type,
  }
}

const inferCsvRowType = ({ row, coordinates, center, wktType }) => {
  const explicitType = normalizeImportedType(getCsvRowType(row), "")

  if (explicitType) return explicitType
  if (wktType) return wktType
  if (getCsvRowRadius(row) || center) return "circle"
  if (coordinates.length >= 3) return "polygon"
  if (coordinates.length >= 2) return "route"

  return "polygon"
}

const csvRowToGeofence = (row, index) => {
  const center = getCsvRowCenter(row)
  const { coordinates, wktType } = getCsvRowCoordinates(row)
  const type = inferCsvRowType({
    row,
    coordinates,
    center,
    wktType,
  })
  const baseGeofence = {
    id: normalizeText(getCsvRowId(row)),
    name: normalizeText(getCsvRowName(row, index)),
    type,
    groupName: normalizeText(getCsvRowGroupName(row)),
    color: normalizeText(getCsvRowColor(row)),
  }

  if (type === "circle") {
    return {
      ...baseGeofence,
      center: center || coordinates[0],
      radius: getCsvRowRadius(row) || 100,
    }
  }

  if (type === "route") {
    return {
      ...baseGeofence,
      coordinates,
      toleranceMeters: getCsvRowTolerance(row) || 100,
    }
  }

  return {
    ...baseGeofence,
    coordinates,
  }
}

export const exportGeofencesToCsv = (geofences = []) => {
  const rows = geofences.map((geofence) => {
    const center = geofence.type === "circle" ? normalizePoint(geofence.center) : null

    return [
      geofence.id,
      getGeofenceName(geofence),
      geofence.type,
      getGeofenceGroupName(geofence),
      getGeofenceColor(geofence),
      geofence.type === "circle" ? formatNumber(geofence.radius) : "",
      geofence.type === "route" ? formatNumber(geofence.toleranceMeters) : "",
      center ? formatNumber(center.lat) : "",
      center ? formatNumber(center.lng) : "",
      coordinatesToText(getGeofenceCoordinates(geofence)),
    ]
  })

  return [CSV_HEADERS, ...rows]
    .map((row) => {
      return row.map(escapeCsvValue).join(";")
    })
    .join("\n")
}

export const importGeofencesFromCsv = (content) => {
  const rows = parseCsvRows(content)
  const headers = rows.shift() || []

  return rows
    .map((row) => rowToObject(headers, row))
    .map(csvRowToGeofence)
    .filter((geofence) => geofence.name || geofence.id)
}

export const exportGeofencesToXml = (geofences = []) => {
  const geofenceXml = geofences
    .map((geofence) => {
      const center = geofence.type === "circle" ? normalizePoint(geofence.center) : null
      const coordinates =
        geofence.type === "circle" ? [] : normalizeCoordinates(geofence.coordinates)

      return `
    <geofence id="${escapeXml(geofence.id)}" type="${escapeXml(geofence.type)}">
      <name>${escapeXml(getGeofenceName(geofence))}</name>
      <groupName>${escapeXml(getGeofenceGroupName(geofence))}</groupName>
      <color>${escapeXml(getGeofenceColor(geofence))}</color>
      <radiusMeters>${escapeXml(geofence.type === "circle" ? geofence.radius : "")}</radiusMeters>
      <toleranceMeters>${escapeXml(geofence.type === "route" ? geofence.toleranceMeters : "")}</toleranceMeters>
      ${center ? `<center lat="${escapeXml(center.lat)}" lng="${escapeXml(center.lng)}" />` : ""}
      <coordinates>
        ${coordinates
          .map((point) => {
            return `<point lat="${escapeXml(point.lat)}" lng="${escapeXml(point.lng)}" />`
          })
          .join("\n        ")}
      </coordinates>
    </geofence>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<sinergyGeofences version="1">${geofenceXml}
</sinergyGeofences>`
}

export const importGeofencesFromXml = (content) => {
  const text = normalizeText(content)

  if (/<kml[\s>]/i.test(text)) {
    return importGeofencesFromKml(text)
  }

  if (/<gpx[\s>]/i.test(text)) {
    return importGeofencesFromGpx(text)
  }

  if (/GeofenceTemplateWrapper|GeofenceGroupTemplateWrapper/i.test(text)) {
    return importGeofencesFromGpsGateXml(text)
  }

  const geofenceNodes = getXmlElementMatches(text, XML_GEOFENCE_TAG_ALIASES)
  const importedGeofences = geofenceNodes
    .map((node, index) => xmlNodeToGeofence(node, index))
    .filter(isImportableGeofence)

  if (importedGeofences.length) return importedGeofences

  const fallbackGeofence = xmlNodeToGeofence(
    {
      attributesText: "",
      body: text,
    },
    0,
  )

  return isImportableGeofence(fallbackGeofence) ? [fallbackGeofence] : []
}

const buildKmlExtendedData = (geofence) => {
  const dataEntries = [
    ["id", geofence.id],
    ["type", geofence.type],
    ["groupName", getGeofenceGroupName(geofence)],
    ["color", getGeofenceColor(geofence)],
    ["radiusMeters", geofence.type === "circle" ? geofence.radius : ""],
    ["toleranceMeters", geofence.type === "route" ? geofence.toleranceMeters : ""],
  ]

  return `
      <ExtendedData>
        ${dataEntries
          .map(([name, value]) => {
            return `<Data name="${escapeXml(name)}"><value>${escapeXml(value)}</value></Data>`
          })
          .join("\n        ")}
      </ExtendedData>`
}

export const exportGeofencesToKml = (geofences = []) => {
  const placemarks = geofences
    .map((geofence) => {
      const color = getGeofenceColor(geofence)
      let geometry

      if (geofence.type === "circle") {
        const center = normalizePoint(geofence.center)

        if (!center) return ""

        geometry = `
      <Point>
        <coordinates>${pointToKmlCoordinate(center)}</coordinates>
      </Point>`
      } else if (geofence.type === "route") {
        const coordinates = normalizeCoordinates(geofence.coordinates)

        if (coordinates.length < 2) return ""

        geometry = `
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${coordinates.map(pointToKmlCoordinate).join(" ")}</coordinates>
      </LineString>`
      } else {
        const coordinates = closePolygonCoordinates(geofence.coordinates)

        if (coordinates.length < 4) return ""

        geometry = `
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>${coordinates.map(pointToKmlCoordinate).join(" ")}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>`
      }

      return `
    <Placemark>
      <name>${escapeXml(getGeofenceName(geofence))}</name>
      <Style>
        <LineStyle>
          <color>${hexToKmlColor(color)}</color>
          <width>3</width>
        </LineStyle>
        <PolyStyle>
          <color>33${hexToKmlColor(color).slice(2)}</color>
        </PolyStyle>
      </Style>${buildKmlExtendedData(geofence)}
      ${geometry}
    </Placemark>`
    })
    .filter(Boolean)
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Geocercas Sinergy</name>${placemarks}
  </Document>
</kml>`
}

export const importGeofencesFromKml = (content) => {
  const geofences = []
  const pattern = /<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/gi
  let match = pattern.exec(normalizeText(content))

  while (match) {
    const placemark = match[1]
    const name = getTagText(placemark, "name")
    const id = getExtendedDataValue(placemark, "id")
    const groupName = getExtendedDataValue(placemark, "groupName")
    const color = getExtendedDataValue(placemark, "color")
    const radius = toFiniteNumber(getExtendedDataValue(placemark, "radiusMeters")) || 100
    const toleranceMeters =
      toFiniteNumber(getExtendedDataValue(placemark, "toleranceMeters")) || 100
    const extendedType = getExtendedDataValue(placemark, "type")

    if (/<Point\b/i.test(placemark)) {
      const coordinates = parseKmlCoordinates(getTagText(placemark, "coordinates"))

      geofences.push({
        id,
        name,
        type: normalizeImportedType(extendedType, "circle"),
        groupName,
        color,
        center: coordinates[0],
        radius,
      })
    } else if (/<LineString\b/i.test(placemark)) {
      geofences.push({
        id,
        name,
        type: normalizeImportedType(extendedType, "route"),
        groupName,
        color,
        coordinates: parseKmlCoordinates(getTagText(placemark, "coordinates")),
        toleranceMeters,
      })
    } else if (/<Polygon\b/i.test(placemark)) {
      const coordinates = parseKmlCoordinates(getTagText(placemark, "coordinates"))
      const firstPoint = coordinates[0]
      const lastPoint = coordinates[coordinates.length - 1]
      const hasClosedRing =
        firstPoint &&
        lastPoint &&
        firstPoint.lat === lastPoint.lat &&
        firstPoint.lng === lastPoint.lng

      geofences.push({
        id,
        name,
        type: normalizeImportedType(extendedType, "polygon"),
        groupName,
        color,
        coordinates: hasClosedRing ? coordinates.slice(0, -1) : coordinates,
      })
    }

    match = pattern.exec(normalizeText(content))
  }

  return geofences.filter((geofence) => geofence.name || geofence.id)
}

const pointToGeoJsonCoordinate = (point) => {
  const normalizedPoint = normalizePoint(point)

  return normalizedPoint ? [normalizedPoint.lng, normalizedPoint.lat] : null
}

const geoJsonCoordinateToPoint = (coordinate = []) => {
  if (!Array.isArray(coordinate)) return null

  return normalizePoint({
    lat: coordinate[1],
    lng: coordinate[0],
  })
}

const getGeoJsonProperty = (properties = {}, aliases = []) => {
  const normalizedAliases = new Set(aliases.map(normalizeCsvHeader))

  return Object.entries(properties).find(([key, value]) => {
    return normalizedAliases.has(normalizeCsvHeader(key)) && normalizeText(value)
  })?.[1]
}

const getGeoJsonBaseGeofence = ({ feature = {}, index = 0, fallbackName = "" } = {}) => {
  const properties = feature.properties || {}

  return {
    id: normalizeText(
      feature.id ||
        getGeoJsonProperty(properties, ["id", "identifier", "geofenceId", "geocercaId", "codigo"]),
    ),
    name:
      normalizeText(
        getGeoJsonProperty(properties, [
          "name",
          "nombre",
          "title",
          "titulo",
          "geofence",
          "geocerca",
          "zona",
        ]),
      ) ||
      fallbackName ||
      `Geocerca GeoJSON ${index + 1}`,
    groupName: normalizeText(
      getGeoJsonProperty(properties, ["groupName", "group", "grupo", "category", "categoria"]),
    ),
    color: normalizeText(
      getGeoJsonProperty(properties, ["color", "stroke", "strokeColor", "stroke_color"]),
    ),
  }
}

const getGeoJsonRadius = (properties = {}) => {
  return (
    toFiniteNumber(
      getGeoJsonProperty(properties, [
        "radiusMeters",
        "radius_meters",
        "radio_metros",
        "radius",
        "radio",
      ]),
    ) || 100
  )
}

const getGeoJsonTolerance = (properties = {}) => {
  return (
    toFiniteNumber(
      getGeoJsonProperty(properties, [
        "toleranceMeters",
        "tolerance_meters",
        "tolerancia_metros",
        "tolerance",
        "tolerancia",
      ]),
    ) || 100
  )
}

const getGeoJsonGeometryType = (properties = {}, fallback = "") => {
  return normalizeImportedType(
    getGeoJsonProperty(properties, ["type", "tipo", "geometryType", "geometry_type", "shape"]),
    fallback,
  )
}

const buildGeoJsonProperties = (geofence = {}) => {
  return {
    color: getGeofenceColor(geofence),
    groupName: getGeofenceGroupName(geofence),
    name: getGeofenceName(geofence),
    radiusMeters: geofence.type === "circle" ? toFiniteNumber(geofence.radius) || 100 : "",
    toleranceMeters:
      geofence.type === "route" ? toFiniteNumber(geofence.toleranceMeters) || 100 : "",
    type: geofence.type || "polygon",
  }
}

const buildGeoJsonFeature = (geofence = {}) => {
  const properties = buildGeoJsonProperties(geofence)
  let geometry

  if (geofence.type === "circle") {
    const coordinates = pointToGeoJsonCoordinate(geofence.center)

    if (!coordinates) return null

    geometry = {
      coordinates,
      type: "Point",
    }
  } else if (geofence.type === "route") {
    const coordinates = normalizeCoordinates(geofence.coordinates)
      .map(pointToGeoJsonCoordinate)
      .filter(Boolean)

    if (coordinates.length < 2) return null

    geometry = {
      coordinates,
      type: "LineString",
    }
  } else {
    const coordinates = closePolygonCoordinates(geofence.coordinates)
      .map(pointToGeoJsonCoordinate)
      .filter(Boolean)

    if (coordinates.length < 4) return null

    geometry = {
      coordinates: [coordinates],
      type: "Polygon",
    }
  }

  return {
    geometry,
    id: geofence.id || undefined,
    properties,
    type: "Feature",
  }
}

export const exportGeofencesToGeoJson = (geofences = []) => {
  const featureCollection = {
    features: geofences.map(buildGeoJsonFeature).filter(Boolean),
    type: "FeatureCollection",
  }

  return `${JSON.stringify(featureCollection, null, 2)}\n`
}

const getGeoJsonFeatures = (geoJson) => {
  if (!geoJson || typeof geoJson !== "object") return []

  if (geoJson.type === "FeatureCollection") {
    return Array.isArray(geoJson.features) ? geoJson.features : []
  }

  if (geoJson.type === "Feature") return [geoJson]

  if (geoJson.type === "GeometryCollection" && Array.isArray(geoJson.geometries)) {
    return geoJson.geometries.map((geometry) => {
      return {
        geometry,
        properties: geoJson.properties || {},
        type: "Feature",
      }
    })
  }

  return [
    {
      geometry: geoJson,
      properties: {},
      type: "Feature",
    },
  ]
}

const buildGeoJsonPolygonGeofence = ({ baseGeofence, coordinates = [] } = {}) => {
  const ring = removeClosingCoordinate((coordinates[0] || []).map(geoJsonCoordinateToPoint))

  return {
    ...baseGeofence,
    coordinates: ring,
    type: "polygon",
  }
}

const buildGeoJsonRouteGeofence = ({ baseGeofence, coordinates = [], properties = {} } = {}) => {
  return {
    ...baseGeofence,
    coordinates: coordinates.map(geoJsonCoordinateToPoint).filter(Boolean),
    toleranceMeters: getGeoJsonTolerance(properties),
    type: "route",
  }
}

const buildGeoJsonCircleGeofence = ({ baseGeofence, coordinate = [], properties = {} } = {}) => {
  return {
    ...baseGeofence,
    center: geoJsonCoordinateToPoint(coordinate),
    radius: getGeoJsonRadius(properties),
    type: "circle",
  }
}

const geoJsonFeatureToGeofences = (feature = {}, index = 0) => {
  const geometry = feature.geometry || {}
  const properties = feature.properties || {}
  const baseGeofence = getGeoJsonBaseGeofence({
    feature,
    index,
  })
  const geometryType = getGeoJsonGeometryType(properties, "")

  if (geometry.type === "Point") {
    return [
      buildGeoJsonCircleGeofence({
        baseGeofence: {
          ...baseGeofence,
          type: geometryType || "circle",
        },
        coordinate: geometry.coordinates,
        properties,
      }),
    ]
  }

  if (geometry.type === "LineString") {
    return [
      buildGeoJsonRouteGeofence({
        baseGeofence,
        coordinates: geometry.coordinates,
        properties,
      }),
    ]
  }

  if (geometry.type === "MultiLineString") {
    return (geometry.coordinates || []).map((lineCoordinates, lineIndex) => {
      return buildGeoJsonRouteGeofence({
        baseGeofence: {
          ...baseGeofence,
          name: `${baseGeofence.name} ${lineIndex + 1}`,
        },
        coordinates: lineCoordinates,
        properties,
      })
    })
  }

  if (geometry.type === "Polygon") {
    return [
      buildGeoJsonPolygonGeofence({
        baseGeofence,
        coordinates: geometry.coordinates,
      }),
    ]
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).map((polygonCoordinates, polygonIndex) => {
      return buildGeoJsonPolygonGeofence({
        baseGeofence: {
          ...baseGeofence,
          name: `${baseGeofence.name} ${polygonIndex + 1}`,
        },
        coordinates: polygonCoordinates,
      })
    })
  }

  if (geometry.type === "GeometryCollection") {
    return (geometry.geometries || []).flatMap((collectionGeometry, collectionIndex) => {
      return geoJsonFeatureToGeofences(
        {
          ...feature,
          geometry: collectionGeometry,
        },
        `${index}-${collectionIndex}`,
      )
    })
  }

  return []
}

export const importGeofencesFromGeoJson = (content) => {
  try {
    const geoJson = typeof content === "string" ? JSON.parse(content) : content

    return getGeoJsonFeatures(geoJson)
      .flatMap(geoJsonFeatureToGeofences)
      .filter(isImportableGeofence)
  } catch {
    return []
  }
}

const loadJsZip = async () => {
  const module = await import("jszip")

  return module.default || module
}

export const exportGeofencesToKmz = async (geofences = []) => {
  const JSZip = await loadJsZip()
  const zip = new JSZip()

  zip.file("doc.kml", exportGeofencesToKml(geofences))

  return zip.generateAsync({
    compression: "DEFLATE",
    type: "uint8array",
  })
}

export const importGeofencesFromKmz = async (content) => {
  const JSZip = await loadJsZip()
  const zip = await JSZip.loadAsync(content)
  const kmlFile =
    zip.file(/(^|\/)doc\.kml$/i)[0] ||
    zip.file(/\.kml$/i).find((file) => {
      return !file.dir
    })

  if (!kmlFile) return []

  const kmlContent = await kmlFile.async("string")

  return importGeofencesFromKml(kmlContent)
}

export const buildGeofenceExportFile = ({ geofences = [], format = "kml" } = {}) => {
  const fileFormat = normalizeFormat(format)
  const builders = {
    csv: exportGeofencesToCsv,
    geojson: exportGeofencesToGeoJson,
    kml: exportGeofencesToKml,
    xml: exportGeofencesToXml,
  }

  if (fileFormat === "kmz") {
    throw new Error("KMZ export requires buildGeofenceExportFileAsync.")
  }

  return {
    content: builders[fileFormat](geofences),
    extension: fileFormat,
    fileName: `geocercas-sinergy.${fileFormat}`,
    mimeType: MIME_TYPES[fileFormat],
  }
}

export const buildGeofenceExportFileAsync = async ({ geofences = [], format = "kml" } = {}) => {
  const fileFormat = normalizeFormat(format)

  if (fileFormat !== "kmz") {
    return buildGeofenceExportFile({
      format: fileFormat,
      geofences,
    })
  }

  return {
    content: await exportGeofencesToKmz(geofences),
    extension: "kmz",
    fileName: "geocercas-sinergy.kmz",
    mimeType: MIME_TYPES.kmz,
  }
}

export const parseGeofenceImportFile = ({ content = "", fileName = "", format = "" } = {}) => {
  const resolvedFormat = format ? normalizeFormat(format) : getGeofenceFileFormat(fileName)
  const parsers = {
    csv: importGeofencesFromCsv,
    geojson: importGeofencesFromGeoJson,
    kml: importGeofencesFromKml,
    xml: importGeofencesFromXml,
  }

  if (resolvedFormat === "kmz") {
    throw new Error("KMZ import requires parseGeofenceImportFileAsync.")
  }

  return parsers[resolvedFormat](content)
}

export const parseGeofenceImportFileAsync = async ({
  arrayBuffer = null,
  content = "",
  fileName = "",
  format = "",
} = {}) => {
  const resolvedFormat = format ? normalizeFormat(format) : getGeofenceFileFormat(fileName)

  if (resolvedFormat !== "kmz") {
    return parseGeofenceImportFile({
      content,
      fileName,
      format: resolvedFormat,
    })
  }

  return importGeofencesFromKmz(arrayBuffer || content)
}
