import assert from "node:assert/strict"
import test from "node:test"

import {
  buildGeofenceExportFileAsync,
  exportGeofencesToCsv,
  exportGeofencesToGeoJson,
  exportGeofencesToKml,
  exportGeofencesToXml,
  importGeofencesFromCsv,
  importGeofencesFromGeoJson,
  importGeofencesFromKml,
  importGeofencesFromXml,
  parseGeofenceImportFileAsync,
} from "./geofenceImportExportUtils.js"

const geofences = [
  {
    id: "circle-1",
    name: "Base Norte",
    type: "circle",
    groupName: "BASE",
    color: "#102372",
    center: {
      lat: -33.44,
      lng: -70.66,
    },
    radius: 250,
  },
  {
    id: "polygon-1",
    name: "Patio",
    type: "polygon",
    color: "#FF6600",
    coordinates: [
      {
        lat: -33.44,
        lng: -70.66,
      },
      {
        lat: -33.45,
        lng: -70.66,
      },
      {
        lat: -33.45,
        lng: -70.65,
      },
    ],
  },
  {
    id: "route-1",
    name: "Ruta minera",
    type: "route",
    color: "#16a34a",
    toleranceMeters: 120,
    coordinates: [
      {
        lat: -33.44,
        lng: -70.66,
      },
      {
        lat: -33.46,
        lng: -70.64,
      },
    ],
  },
]

test("geofence CSV export can be imported again", () => {
  const importedGeofences = importGeofencesFromCsv(exportGeofencesToCsv(geofences))

  assert.equal(importedGeofences.length, 3)
  assert.equal(importedGeofences[0].name, "Base Norte")
  assert.equal(importedGeofences[0].type, "circle")
  assert.equal(importedGeofences[0].radius, 250)
  assert.equal(importedGeofences[1].coordinates.length, 3)
})

test("geofence XML export can be imported again", () => {
  const importedGeofences = importGeofencesFromXml(exportGeofencesToXml(geofences))

  assert.equal(importedGeofences.length, 3)
  assert.equal(importedGeofences[1].name, "Patio")
  assert.equal(importedGeofences[1].type, "polygon")
  assert.equal(importedGeofences[2].toleranceMeters, 120)
})

test("geofence XML import accepts common circle aliases", () => {
  const importedGeofences = importGeofencesFromXml(`
    <geocercas>
      <zona codigo="base-norte">
        <nombre>Base Norte</nombre>
        <latitud>-33.44</latitud>
        <longitud>-70.66</longitud>
        <radio>250</radio>
      </zona>
    </geocercas>
  `)

  assert.equal(importedGeofences.length, 1)
  assert.equal(importedGeofences[0].id, "base-norte")
  assert.equal(importedGeofences[0].name, "Base Norte")
  assert.equal(importedGeofences[0].type, "circle")
  assert.deepEqual(importedGeofences[0].center, {
    lat: -33.44,
    lng: -70.66,
  })
  assert.equal(importedGeofences[0].radius, 250)
})

test("geofence XML import accepts polygon vertex attributes", () => {
  const importedGeofences = importGeofencesFromXml(`
    <root>
      <area name="Patio Sur" tipo="poligono">
        <vertices>
          <vertex lat="-33.44" lon="-70.66" />
          <vertex lat="-33.45" lon="-70.66" />
          <vertex lat="-33.45" lon="-70.65" />
        </vertices>
      </area>
    </root>
  `)

  assert.equal(importedGeofences.length, 1)
  assert.equal(importedGeofences[0].name, "Patio Sur")
  assert.equal(importedGeofences[0].type, "polygon")
  assert.equal(importedGeofences[0].coordinates.length, 3)
})

test("geofence XML import accepts WKT geometries", () => {
  const importedGeofences = importGeofencesFromXml(`
    <geofences>
      <geofence>
        <name>Ruta faena</name>
        <wkt>LINESTRING(-70.66 -33.44, -70.64 -33.46)</wkt>
        <tolerancia>120</tolerancia>
      </geofence>
    </geofences>
  `)

  assert.equal(importedGeofences.length, 1)
  assert.equal(importedGeofences[0].type, "route")
  assert.equal(importedGeofences[0].coordinates.length, 2)
  assert.equal(importedGeofences[0].toleranceMeters, 120)
})

test("geofence XML import accepts GPX tracks", () => {
  const importedGeofences = importGeofencesFromXml(`
    <gpx>
      <trk>
        <name>Ruta GPS</name>
        <trkseg>
          <trkpt lat="-33.44" lon="-70.66"></trkpt>
          <trkpt lat="-33.45" lon="-70.65"></trkpt>
        </trkseg>
      </trk>
    </gpx>
  `)

  assert.equal(importedGeofences.length, 1)
  assert.equal(importedGeofences[0].name, "Ruta GPS")
  assert.equal(importedGeofences[0].type, "route")
  assert.equal(importedGeofences[0].coordinates.length, 2)
})

test("geofence XML import accepts GPSGate geofence groups", () => {
  const importedGeofences = importGeofencesFromXml(`
    <Templates xmlns="http://gpsgate.com/xml/">
      <Template type="ApplicationEntity">
        <Object>
          <TemplateGuid>group-1</TemplateGuid>
          <ObjectType>GpsGate.Online.Geofence.Utils.GeofenceGroupTemplateWrapper</ObjectType>
          <ObjectData>
            <Name>MSUR</Name>
            <Color>#67AC5B</Color>
            <GeofencesIDs>
              <GeofenceIDRef>geofence-1</GeofenceIDRef>
            </GeofencesIDs>
          </ObjectData>
        </Object>
        <Object>
          <TemplateGuid>geofence-1</TemplateGuid>
          <ObjectType>GpsGate.Online.Geofence.Utils.GeofenceTemplateWrapper</ObjectType>
          <ObjectData>
            <Name>Acopio La Granja</Name>
            <Type>Polygon</Type>
            <Vertices>
              <Vertex>
                <Latitude>-33.51791</Latitude>
                <Longitude>-70.61243</Longitude>
              </Vertex>
              <Vertex>
                <Latitude>-33.51833</Latitude>
                <Longitude>-70.61073</Longitude>
              </Vertex>
              <Vertex>
                <Latitude>-33.51929</Latitude>
                <Longitude>-70.61238</Longitude>
              </Vertex>
              <Vertex>
                <Latitude>-33.51791</Latitude>
                <Longitude>-70.61243</Longitude>
              </Vertex>
            </Vertices>
          </ObjectData>
        </Object>
      </Template>
    </Templates>
  `)

  assert.equal(importedGeofences.length, 1)
  assert.equal(importedGeofences[0].id, "geofence-1")
  assert.equal(importedGeofences[0].name, "Acopio La Granja")
  assert.equal(importedGeofences[0].groupName, "MSUR")
  assert.equal(importedGeofences[0].color, "#67AC5B")
  assert.equal(importedGeofences[0].type, "polygon")
  assert.equal(importedGeofences[0].coordinates.length, 3)
})

test("geofence KML export can be imported again", () => {
  const importedGeofences = importGeofencesFromKml(exportGeofencesToKml(geofences))

  assert.equal(importedGeofences.length, 3)
  assert.equal(importedGeofences[0].type, "circle")
  assert.equal(importedGeofences[1].type, "polygon")
  assert.equal(importedGeofences[1].coordinates.length, 3)
  assert.equal(importedGeofences[2].type, "route")
})

test("geofence GeoJSON export can be imported again", () => {
  const importedGeofences = importGeofencesFromGeoJson(exportGeofencesToGeoJson(geofences))

  assert.equal(importedGeofences.length, 3)
  assert.equal(importedGeofences[0].name, "Base Norte")
  assert.equal(importedGeofences[0].type, "circle")
  assert.equal(importedGeofences[0].groupName, "BASE")
  assert.equal(importedGeofences[0].radius, 250)
  assert.equal(importedGeofences[1].type, "polygon")
  assert.equal(importedGeofences[1].coordinates.length, 3)
  assert.equal(importedGeofences[2].type, "route")
  assert.equal(importedGeofences[2].toleranceMeters, 120)
})

test("geofence GeoJSON import accepts common geometry types", () => {
  const importedGeofences = importGeofencesFromGeoJson(`{
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Zona faena",
          "group": "MSUR"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-70.66, -33.44],
            [-70.65, -33.44],
            [-70.65, -33.45],
            [-70.66, -33.44]
          ]]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Ruta acceso",
          "toleranceMeters": 150
        },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-70.66, -33.44],
            [-70.64, -33.46]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": {
          "name": "Base radio",
          "radiusMeters": 300
        },
        "geometry": {
          "type": "Point",
          "coordinates": [-70.66, -33.44]
        }
      }
    ]
  }`)

  assert.equal(importedGeofences.length, 3)
  assert.equal(importedGeofences[0].type, "polygon")
  assert.equal(importedGeofences[0].groupName, "MSUR")
  assert.equal(importedGeofences[1].type, "route")
  assert.equal(importedGeofences[1].toleranceMeters, 150)
  assert.equal(importedGeofences[2].type, "circle")
  assert.equal(importedGeofences[2].radius, 300)
})

test("geofence KMZ export can be imported again", async () => {
  const exportFile = await buildGeofenceExportFileAsync({
    format: "kmz",
    geofences,
  })
  const importedGeofences = await parseGeofenceImportFileAsync({
    arrayBuffer: exportFile.content,
    fileName: exportFile.fileName,
  })

  assert.equal(exportFile.extension, "kmz")
  assert.equal(importedGeofences.length, 3)
  assert.equal(importedGeofences[0].type, "circle")
  assert.equal(importedGeofences[1].type, "polygon")
  assert.equal(importedGeofences[2].type, "route")
})

test("geofence CSV import accepts common latitude and longitude column names", () => {
  const importedGeofences = importGeofencesFromCsv(`name,lat,lng,radius
Base Norte,-33.44,-70.66,250
Patio Sur,-33.45,-70.67,150`)

  assert.equal(importedGeofences.length, 2)
  assert.equal(importedGeofences[0].name, "Base Norte")
  assert.equal(importedGeofences[0].type, "circle")
  assert.deepEqual(importedGeofences[0].center, {
    lat: -33.44,
    lng: -70.66,
  })
})
