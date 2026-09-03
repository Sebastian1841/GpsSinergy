# Documentacion del frontend

Esta carpeta concentra la documentacion tecnica general. Los `README.md` dentro de `frontend/src` funcionan como mapa local de cada carpeta; estos documentos explican los flujos y decisiones globales.

## Lectura recomendada

1. `flujos-principales.md`: como se mueve la informacion por la plataforma.
2. `archivos-criticos.md`: que archivos tocar con mas cuidado y por que.
3. `criterios-arquitectura.md`: reglas para decidir donde poner codigo nuevo.
4. `guia-frontend.md`: guia extensa con explicaciones y ejemplos de funciones importantes.

Los cambios funcionales recientes que afectan varios modulos deben quedar
reflejados especialmente en `flujos-principales.md` y `archivos-criticos.md`.
Hoy eso incluye la separacion entre etiquetas de acceso y grupos de vehiculos,
busqueda global por alcance, geocercas con grupos/importacion/exportacion,
reportes configurables con preview/PDF/Excel y mantenciones.

## Como usar esta documentacion

- Si vas a cambiar una pantalla, empieza en `views/README.md` y luego revisa el README de sus componentes.
- Si vas a cambiar estado o watchers, revisa `composables/README.md` y el composable especifico.
- Si vas a cambiar calculos, reportes, mapas o formatos, revisa `utils/README.md`.
- Si vas a cambiar persistencia, mocks, almacenamiento o APIs, revisa `services/README.md`.

## Regla base

La documentacion debe explicar decisiones y flujos, no repetir cada linea del codigo. Cuando una funcion sea critica o dificil de entender, se documenta en `archivos-criticos.md` o en `guia-frontend.md`.

## Regla de mantenimiento

Cada cambio funcional, visual o de arquitectura debe revisar el `README.md` de la carpeta afectada. Si cambia la responsabilidad de un archivo, se mueve una pieza, aparece una carpeta nueva o se modifica un flujo importante, el README correspondiente tambien debe actualizarse en el mismo cambio.

La seccion de cuellos de botella en `guia-frontend.md` debe listar solo problemas vigentes. Si se actualiza esa seccion, sincronizar tambien `frontend/src/views/a.html`.
