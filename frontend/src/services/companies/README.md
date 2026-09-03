# Company Services

Servicios de empresas.

## Archivos

- `mockCompaniesAdapter.js`: adaptador mock para empresas. Mantiene salida
  compatible con datos locales antiguos, pero la UI ya no administra grupos de
  vehiculos desde Empresas.
- `useCompaniesService.js`: servicio reactivo de empresas.

## Regla de mantenimiento

Mantener normalizada la salida del servicio para que `components/companies` no dependan del formato mock.
