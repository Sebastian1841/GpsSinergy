# Documentacion del frontend

Esta carpeta concentra la documentacion tecnica general. Los `README.md` dentro de `frontend/src` funcionan como mapa local de cada carpeta; estos documentos explican los flujos y decisiones globales.

## Lectura recomendada

1. `flujos-principales.md`: como se mueve la informacion por la plataforma.
2. `archivos-criticos.md`: que archivos tocar con mas cuidado y por que.
3. `criterios-arquitectura.md`: reglas para decidir donde poner codigo nuevo.
4. `guia-frontend.md`: guia extensa con explicaciones y ejemplos de funciones importantes.

## Como usar esta documentacion

- Si vas a cambiar una pantalla, empieza en `views/README.md` y luego revisa el README de sus componentes.
- Si vas a cambiar estado o watchers, revisa `composables/README.md` y el composable especifico.
- Si vas a cambiar calculos, reportes, mapas o formatos, revisa `utils/README.md`.
- Si vas a cambiar persistencia, mocks, almacenamiento o APIs, revisa `services/README.md`.

## Regla base

La documentacion debe explicar decisiones y flujos, no repetir cada linea del codigo. Cuando una funcion sea critica o dificil de entender, se documenta en `archivos-criticos.md` o en `guia-frontend.md`.
