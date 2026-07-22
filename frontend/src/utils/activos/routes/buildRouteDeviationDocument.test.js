import assert from "node:assert/strict"
import test from "node:test"

import { buildRouteDeviationDocument } from "./buildRouteDeviationDocument.js"

test("buildRouteDeviationDocument renders grouped route deviations with real details", () => {
  const document = buildRouteDeviationDocument({
    asset: {
      displayName: "Camion 12",
      patente: "ABCD12",
    },
    route: {
      name: "Ruta norte",
      corridorLabel: "Corredor operativo",
    },
    rangeLabel: "Hoy",
    toleranceMeters: 300,
    comparison: {
      plannedPoints: [
        {
          lat: -33.45,
          lng: -70.65,
        },
        {
          lat: -33.451,
          lng: -70.64,
        },
        {
          lat: -33.452,
          lng: -70.63,
        },
      ],
      actualPoints: [
        {
          lat: -33.45,
          lng: -70.65,
          offRoute: false,
        },
        {
          lat: -33.456789,
          lng: -70.612345,
          offRoute: true,
        },
        {
          lat: -33.4555,
          lng: -70.622,
          offRoute: true,
        },
        {
          lat: -33.452,
          lng: -70.63,
          offRoute: false,
        },
      ],
      deviations: [
        {
          label: "Desvio 1",
          startTime: "08:10",
          endTime: "08:18",
          durationLabel: "8 min",
          pointsCount: 3,
          maxDistanceMeters: 850,
          maxDistanceLabel: "850 m",
          averageDistanceMeters: 620,
          averageDistanceLabel: "620 m",
          maxPoint: {
            lat: -33.456789,
            lng: -70.612345,
            timestamp: "2026-07-10T12:14:00.000Z",
            distanceToRouteMeters: 850,
          },
        },
      ],
      summary: {
        compliance: 88,
        complianceLabel: "88%",
        offRoutePointsCount: 3,
        maxDeviationMeters: 850,
        maxDeviationLabel: "850 m",
        averageDeviationMeters: 620,
        averageDeviationLabel: "620 m",
      },
    },
  })

  assert.match(document.html, /<th>Inicio<\/th>/)
  assert.match(document.html, /<th>Fin<\/th>/)
  assert.match(document.html, /<th>Duración<\/th>/)
  assert.match(document.html, /<th>Desvío máx\.<\/th>/)
  assert.match(document.html, /<th>Promedio<\/th>/)
  assert.match(document.html, /<th>Puntos<\/th>/)
  assert.match(document.html, /<th>Coordenadas<\/th>/)
  assert.match(document.html, /<td class="time-cell">08:10<\/td>/)
  assert.match(document.html, /<td class="time-cell">08:18<\/td>/)
  assert.match(document.html, /<td class="duration-cell">8 min<\/td>/)
  assert.match(document.html, /<td class="distance max-distance">850 m<\/td>/)
  assert.match(document.html, /<td class="distance average-distance">620 m<\/td>/)
  assert.match(document.html, /<td class="points-cell">3 puntos fuera de ruta<\/td>/)
  assert.match(document.html, /Resumen del resultado/)
  assert.match(document.html, /Recorrido con desvíos relevantes/)
  assert.match(document.html, /Se detectó 1 desvío/)
  assert.match(document.html, /3 puntos quedaron fuera de la tolerancia de 300 m/)
  assert.match(document.html, /Con desvíos/)
  assert.match(document.html, /Puntos fuera/)
  assert.match(document.html, /3 puntos fuera de ruta/)
  assert.match(document.html, /Punto máximo del desvío/)
  assert.match(document.html, /Referencia/)
  assert.match(document.html, /-33\.456789, -70\.612345/)
  assert.match(document.html, /Mapa de comparación/)
  assert.match(document.html, /basemaps\.cartocdn\.com\/rastertiles\/voyager/)
  assert.match(document.html, /snapshot-tile/)
  assert.match(document.html, /snapshot-route-planned/)
  assert.match(document.html, /snapshot-route-actual/)
  assert.match(document.html, /snapshot-route-deviation/)
  assert.doesNotMatch(document.html, /08:10 - 08:18 \(8 min\)/)
  assert.doesNotMatch(document.html, /Máx\. 850 m \/ Prom\. 620 m/)
  assert.doesNotMatch(document.html, /3 puntos fuera de ruta · 08:10 a 08:18/)
  assert.doesNotMatch(document.html, /Sin dato/)
  assert.doesNotMatch(document.html, /Sin coordenadas/)
})
