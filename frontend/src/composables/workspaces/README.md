# Workspace Composables

Estado de espacios de trabajo.

## Archivos

- `useWorkspaces.js`: creacion, actualizacion, eliminacion y seleccion de espacios.
- `useWorkspaces.test.js`: pruebas de espacios de trabajo.
- `useWorkspaceViewState.js`: estado visual guardable de una vista.

## Regla de mantenimiento

Guardado comprobado (2026-11-05): publicar registros y seleccion solo despues de
confirmar escrituras. Fallar devuelve null y expone workspaceWriteError, sin
auditoria de exito. Crear/borrar/vista actual escriben registros y seleccion con
rollback de mejor esfuerzo. Renombrar acepta usuarios compartidos opcionales para
guardar ambas opciones juntas desde el formulario. No hay transaccion de servidor.

Los espacios deben representar preferencias de visualizacion. No deben modificar datos operativos de activos, reportes o usuarios.
