export const mockPlannedRoutes = [
  {
    id: "ruta-centro-norte",
    name: "Ruta Centro Norte",
    corridorLabel: "Base Santiago / Cliente Norte",
    toleranceMeters: 280,
    stops: [
      { id: "base", name: "Base operacional", lat: -33.4489, lng: -70.6693 },
      { id: "mapocho", name: "Control Mapocho", lat: -33.4385, lng: -70.653 },
      { id: "providencia", name: "Cliente Providencia", lat: -33.4295, lng: -70.625 },
      { id: "norte", name: "Destino Norte", lat: -33.4178, lng: -70.6106 },
    ],
    actualPoints: [
      { lat: -33.4489, lng: -70.6693, timestamp: "2026-05-14T08:00:00", speed: 0 },
      { lat: -33.441, lng: -70.6538, timestamp: "2026-05-14T08:18:00", speed: 38 },
      { lat: -33.4345, lng: -70.646, timestamp: "2026-05-14T08:34:00", speed: 42 },
      { lat: -33.4332, lng: -70.6318, timestamp: "2026-05-14T08:52:00", speed: 34 },
      { lat: -33.4248, lng: -70.6202, timestamp: "2026-05-14T09:11:00", speed: 45 },
      { lat: -33.4178, lng: -70.6106, timestamp: "2026-05-14T09:32:00", speed: 0 },
    ],
  },
  {
    id: "ruta-sur-cliente",
    name: "Ruta Sur Cliente",
    corridorLabel: "Centro distribucion / Zona Sur",
    toleranceMeters: 320,
    stops: [
      { id: "base-sur", name: "Centro distribucion", lat: -33.4561, lng: -70.6804 },
      { id: "departamental", name: "Av. Departamental", lat: -33.474, lng: -70.666 },
      { id: "san-joaquin", name: "San Joaquin", lat: -33.487, lng: -70.642 },
      { id: "cliente-sur", name: "Cliente zona sur", lat: -33.501, lng: -70.621 },
    ],
    actualPoints: [
      { lat: -33.4561, lng: -70.6804, timestamp: "2026-05-14T07:40:00", speed: 0 },
      { lat: -33.471, lng: -70.667, timestamp: "2026-05-14T08:02:00", speed: 32 },
      { lat: -33.483, lng: -70.655, timestamp: "2026-05-14T08:19:00", speed: 36 },
      { lat: -33.492, lng: -70.644, timestamp: "2026-05-14T08:38:00", speed: 22 },
      { lat: -33.4995, lng: -70.624, timestamp: "2026-05-14T08:58:00", speed: 40 },
      { lat: -33.501, lng: -70.621, timestamp: "2026-05-14T09:10:00", speed: 0 },
    ],
  },
  {
    id: "ruta-quilicura",
    name: "Ruta Quilicura",
    corridorLabel: "Base Quilicura / Sector industrial",
    toleranceMeters: 300,
    stops: [
      { id: "base-quilicura", name: "Base Quilicura", lat: -33.3702, lng: -70.7416 },
      { id: "abastecimiento", name: "Centro abastecimiento", lat: -33.3525, lng: -70.733 },
      { id: "autopista", name: "Acceso autopista", lat: -33.338, lng: -70.721 },
      { id: "industrial", name: "Sector industrial norte", lat: -33.331, lng: -70.706 },
    ],
    actualPoints: [
      { lat: -33.3702, lng: -70.7416, timestamp: "2026-05-14T09:05:00", speed: 0 },
      { lat: -33.356, lng: -70.736, timestamp: "2026-05-14T09:19:00", speed: 44 },
      { lat: -33.349, lng: -70.728, timestamp: "2026-05-14T09:34:00", speed: 48 },
      { lat: -33.342, lng: -70.713, timestamp: "2026-05-14T09:47:00", speed: 52 },
      { lat: -33.334, lng: -70.709, timestamp: "2026-05-14T10:04:00", speed: 39 },
      { lat: -33.331, lng: -70.706, timestamp: "2026-05-14T10:18:00", speed: 0 },
    ],
  },
]

export const getMockPlannedRouteById = (routeId) => {
  return mockPlannedRoutes.find((route) => route.id === routeId) || mockPlannedRoutes[0] || null
}
