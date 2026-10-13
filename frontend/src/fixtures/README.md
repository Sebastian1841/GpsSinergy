# Fixtures

Datos sinteticos para validar UI y flujos del prototipo; no son registros de
produccion ni evidencia de integraciones reales.

## Mantenciones

`maintenanceDemoData.js` define tipos, activos y ejecuciones historicas demo.
Actualmente ENABLE_MAINTENANCE_DEMO_DATA y ENABLE_MAINTENANCE_HISTORY_DEMO_DATA
estan activos; el limite de OT base demo es 6.
El modulo solicita activos sinteticos para completar aproximadamente 10
vehiculos cuando la fuente actual tiene menos. No elimina activos originales
si ya hay mas de 10. El generador tiene un default de 36, pero el consumidor
envia la cantidad requerida expresamente.
El historial agrega dos ejecuciones a cada uno de los primeros dos vehiculos.

Desactivar las banderas no borra automaticamente registros ya persistidos.
Antes de evaluar metricas operativas, distinguir estos registros demo de OT
creadas por el usuario.
