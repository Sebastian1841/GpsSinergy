<template>
  <!-- Eye -->
  <svg
    v-if="name === 'eye'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7
         c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z"
    />
  </svg>

  <!-- Eye Off -->
  <svg
    v-else-if="name === 'eye-off'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M13.875 18.825A10.05 10.05 0 0112 19
         c-4.477 0-8.268-2.943-9.542-7
         a9.974 9.974 0 012.469-4.247M9.88 9.88
         a3 3 0 104.24 4.24"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18" />
  </svg>

  <!-- Lock -->
  <svg
    v-else-if="name === 'lock'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-20 h-20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>

  <!-- Check -->
  <svg
    v-else-if="name === 'check'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-16 h-16"
    fill="none"
    viewBox="0 0 24 24"
    stroke="c   urrentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
  </svg>

  <!-- Mail -->
  <svg
    v-else-if="name === 'mail'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14
         a2 2 0 002-2V7a2 2 0 00-2-2H5
         a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>

  <!-- Trash / Eliminar -->
  <svg
    v-else-if="name === 'trash'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v1H9V4a1 1 0 011-1z"
    />
  </svg>

  <!-- Pencil / Editar -->
  <svg
    v-else-if="name === 'pencil'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M11 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
    />
  </svg>

  <!-- Copy / Copiar -->
  <svg
    v-else-if="name === 'copy'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 8h8v8a2 2 0 0 1-2 2H8V8z" />
  </svg>

  <!-- Arrow Left / Retroceder -->
  <svg
    v-else-if="name === 'arrow-left'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
  </svg>

  <!-- Chevron Left / Paginación anterior -->
  <svg
    v-else-if="name === 'chevron-left'"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
      clip-rule="evenodd"
    />
  </svg>

  <!-- Chevron Right / Paginación siguiente -->
  <svg
    v-else-if="name === 'chevron-right'"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
      clip-rule="evenodd"
    />
  </svg>

  <!-- Logout / Cerrar sesión -->
  <svg
    v-else-if="name === 'logout'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>

  <!-- Close -->
  <svg
    v-else-if="name === 'close'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>

  <!-- Plus / Agregar -->
  <svg
    v-else-if="name === 'plus'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
  </svg>

  <!-- Search / Lupa -->
  <svg
    v-else-if="name === 'search'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M21 21l-4.35-4.35m1.85-5.4a7.25 7.25 0 11-14.5 0 7.25 7.25 0 0114.5 0z"
    />
  </svg>

  <!-- OK / Mantención OK -->
  <svg
    v-else-if="name === 'ok'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>

  <!-- Proxima Mantención -->
  <svg
    v-else-if="name === 'proxima'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 9v3.75m0 3.75h.01M3.6 18h16.8c1.2 0 2-1.3 1.4-2.4L13.4 3.4a1.5 1.5 0 00-2.8 0L2.2 15.6C1.6 16.7 2.4 18 3.6 18z"
    />
  </svg>

  <!-- Mantención Vencida / Requiere Mantención -->
  <svg
    v-else-if="name === 'vencida'"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 9v4m0 4h.01M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
    />
  </svg>

  <!-- Dashboard -->
  <svg
    v-else-if="name === 'dashboard'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 11.5L12 3l9 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20.5v-9z"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 21V13h6v8" />
  </svg>

  <!-- Dispositivos -->
  <svg
    v-else-if="name === 'dispositivos'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect x="3" y="4" width="18" height="14" rx="2" ry="2" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 20h8M12 16v4" />
  </svg>

  <!-- Empresas -->
  <svg
    v-else-if="name === 'empresas'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 21V7a2 2 0 012-2h4a2 2 0 012 2v14H3zM15 21V11a2 2 0 012-2h4a2 2 0 012 2v10h-6z"
    />
  </svg>

  <!-- Alertas -->
  <svg
    v-else-if="name === 'alertas'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
    <path
      d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
    ></path>
  </svg>

  <!-- Motor de Reglas -->
  <svg
    v-else-if="name === 'motor'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 6v12l4-4 4 4V6" />
  </svg>

  <!-- Fuentes de Datos -->
  <svg
    v-else-if="name === 'fuentes'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <ellipse cx="12" cy="5" rx="8" ry="3" stroke-linecap="round" stroke-linejoin="round" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4 5v14c0 1.657 3.582 3 8 3s8-1.343 8-3V5"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4 12c0 1.657 3.582 3 8 3s8-1.343 8-3"
    />
  </svg>

  <!-- Usuarios -->
  <svg
    v-else-if="name === 'usuarios'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <circle cx="12" cy="8" r="4" stroke-linecap="round" stroke-linejoin="round" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6"
    />
  </svg>

  <!-- Reportes / Informes -->
  <svg
    v-else-if="name === 'reportes'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h8M8 16h8M8 20h4" />
  </svg>

  <!-- Mantenciones -->
  <svg
    v-else-if="name === 'mantenciones'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 8v4l3 3m6 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
    />
  </svg>

  <!-- Configuración -->
  <svg
    v-else-if="name === 'configuracion'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
    />
  </svg>
  <!-- Telefono -->
  <svg
    v-else-if="name === 'telefono'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-10 h-10"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
  <!-- Tables -->
  <svg
    v-else-if="name === 'tables'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 3h18v4H3V3zm0 6h18v4H3V9zm0 6h18v4H3v-4z"
    />
  </svg>
  <!-- Ingresar -->
  <svg
    v-else-if="name === 'ingresar'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
  </svg>
  <!-- Volumen -->
  <svg
    v-else-if="name === 'volumen'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect
      x="4"
      y="4"
      width="10"
      height="16"
      rx="2"
      ry="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <rect
      x="6.5"
      y="6.5"
      width="5"
      height="3"
      rx="0.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path d="M3 20h14" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M14 9c2 0 3 .7 3 2.5v6.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M17 9l2-1 1 1.5-2 1" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
  <!-- Gasto -->
  <svg
    v-else-if="name === 'gasto'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect
      x="2"
      y="6"
      width="20"
      height="12"
      rx="2"
      ry="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="12" cy="12" r="2" />
  </svg>
  <!-- Precio/L -->
  <svg
    v-else-if="name === 'precioL'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <polyline stroke-linecap="round" stroke-linejoin="round" points="4 14 10 10 14 12 20 6" />
    <polyline stroke-linecap="round" stroke-linejoin="round" points="20 10 20 6 16 6" />
  </svg>
  <!-- Eventos -->
  <svg
    v-else-if="name === 'eventos'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18" />
  </svg>
  <!-- Vehículos -->
  <svg
    v-else-if="name === 'vehiculos'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M3 13l2-5h14l2 5v5a1 1 0 01-1 1h-1a2 2 0 01-4 0H9a2 2 0 01-4 0H4a1 1 0 01-1-1v-5z"
    />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>

  <!-- Distancia -->
  <svg
    v-else-if="name === 'distancia'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l3-6-3-6m6 12l3-6-3-6" />
  </svg>

  <!-- Upload -->
  <svg
    v-else-if="name === 'upload'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5m0 0l5 5m-5-5v12"
    />
  </svg>
  <!-- Bell / Alert -->
  <svg
    v-else-if="name === 'bell'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M15 17h5l-1.405-1.405A2.032
       2.032 0 0118 14.158V11
       a6.002 6.002 0 00-4-5.659V5
       a2 2 0 10-4 0v.341C7.67
       6.165 6 8.388 6 11v3.159
       c0 .538-.214 1.055-.595
       1.436L4 17h5m6 0v1
       a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>

  <!-- Temperatura -->
  <svg
    v-else-if="name === 'temperatura'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M14 14.76V5a2 2 0 10-4 0v9.76a4 4 0 104 0z"
    />
    <line stroke-linecap="round" stroke-linejoin="round" x1="12" y1="9" x2="12" y2="14" />
  </svg>

  <svg
    v-else-if="name === 'user'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    viewBox="0 0 512 512"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="14"
    stroke-linecap="round"
    stroke-linejoin="round"
    paint-order="stroke fill"
  >
    <path
      d="M188.5 0L189.5 1H202.5L203.5 2L214.5 3L235.5 10Q261.5 22 279 42.5Q293.5 59 302 81.5L309 109.5L310 134.5L309 135.5V144.5L307 155.5L299 179.5Q289.9 200.4 275 215.5Q292.8 223.7 307.5 235Q310.9 229.9 320.5 231Q328.4 233.1 332 239.5L343 257L347 256L351 231.5L356.5 224Q361 219.5 371.5 221L419.5 230L429 237.5Q432.1 241.9 431 250.5L427 270.5Q428.8 274.8 430.5 272L450.5 258L460.5 257L470 263.5L499 306.5Q501.9 310.1 501 317.5Q498.9 325.4 492.5 329L476 340.5Q474.3 345.3 478.5 344L499.5 348L508 354.5Q512.8 359.7 511 371.5L509 377.5V382.5L507 388.5L502 419.5L494.5 428Q490.9 430.9 483.5 430Q473.6 426.1 461 426L460 428.5L474 448.5Q476.7 451.8 476 458.5Q473.9 466.9 467.5 471L427.5 499Q423.5 502 415.5 501L407 495.5L393.5 476Q388.3 474.3 390 479.5L386 500.5L379.5 509Q374.8 512.8 364.5 511L317.5 502L309 496.5Q304.3 491.7 306 480.5L310 461.5Q309.3 459.3 305.5 460L286.5 474L276.5 475Q269.3 473.2 266 467.5L264.5 465H5.5L1 460.5L0 456.5V377.5L1 376.5V358.5L2 357.5L4 339.5Q9 317 18 298.5Q34.9 264.4 62.5 241Q80 226 102 215.5Q83.7 196.8 74 169.5L68 144.5L67 118.5L68 117.5V109.5L70 98.5L77 76.5Q89.4 47.9 111.5 29Q126.5 16 146.5 8L167.5 2L187.5 1L188.5 0ZM180 16L163 19L146 25Q129 33 117 45Q101 61 91 83L86 98L83 114V141L86 157Q93 182 108 200Q121 216 141 226L161 234L184 238L204 237L226 231Q243 224 256 213Q270 201 280 184L291 157L294 141V114L290 94Q283 71 270 56Q255 36 232 25L219 20L206 17L180 16ZM263 227Q250 238 233 245L218 250L202 253H176L153 248Q131 241 116 228L106 231L93 238L70 255Q43 278 28 314L20 339L17 355V364L16 365V450H88L87 448V404L88 402Q90 397 98 398L102 403L103 407V445L102 449V450H254L236 423Q235 412 239 408L257 395Q261 394 260 388L237 384L233 382Q227 378 225 371L232 328L234 322V317L237 310Q241 304 249 302L270 306H276L275 301L264 286L261 279V274L264 267L294 245Q280 234 263 227ZM366 236L361 266L355 271H350L344 273L336 272L319 247H317L277 276L294 303L293 308L286 319L281 323L250 318L241 368L247 370H252L257 372L270 374L274 379L275 389L277 393L276 399L251 418L280 459H282L306 442L313 444L326 455V461L321 486L323 487L371 496L377 466L384 461L400 459L405 465L419 485H421L460 458V456L443 430L444 425Q449 421 451 414L457 409L487 414L496 363L467 358L462 354L461 344L459 339L460 334Q471 323 485 316V314L458 273H456L432 290H428L415 282L411 278V270L416 247L415 245L405 244L366 236Z"
    />
    <path
      d="M362.5 307H374.5L392.5 312Q404.8 318.2 413 328.5Q427.2 343.3 426 373.5Q421.1 398.1 404.5 411Q394.7 419.2 380.5 423L362.5 424L352.5 422L342.5 418Q331.6 411.9 324 402.5Q316.9 394.1 313 382.5L311 373.5V357.5Q315.9 331.9 333.5 319Q344.9 309.9 362.5 307ZM360 323L342 332L333 342L327 356Q329 361 326 363Q326 384 337 395Q345 404 360 408Q372 410 381 407L397 398Q404 392 408 382L411 368L409 353L401 338Q394 329 384 325L378 323H360Z"
    />
  </svg>

  <svg
    v-else-if="name === 'empresa'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    viewBox="0 0 512 512"
    fill="currentColor"
  >
    <g
      transform="translate(0,512) scale(0.1,-0.1)"
      fill="currentColor"
      stroke="currentColor"
      stroke-width="130"
      stroke-linejoin="round"
      paint-order="stroke fill"
    >
      <path
        d="M1380 4750 l0 -270 -265 0 -265 0 0 -1865 0 -1865 -155 0 -155 0 0
    -105 0 -105 850 0 850 0 0 105 0 105 -585 0 -585 0 0 1760 0 1760 1385 0 1385
    0 0 -750 0 -750 105 0 105 0 0 855 0 855 -265 0 -265 0 0 270 0 270 -1070 0
    -1070 0 0 -270z m1920 -110 l0 -160 -850 0 -850 0 0 153 c0 85 3 157 7 160 3
    4 386 7 850 7 l843 0 0 -160z"
      />
      <path d="M1492 3633 l3 -108 373 -3 372 -2 0 110 0 110 -375 0 -376 0 3 -107z" />
      <path d="M2670 3630 l0 -110 375 0 375 0 0 110 0 110 -375 0 -375 0 0 -110z" />
      <path
        d="M1494 2977 c-3 -8 -3 -56 -2 -108 l3 -94 373 -3 372 -2 0 110 0 110
    -370 0 c-299 0 -372 -3 -376 -13z"
      />
      <path d="M2670 2880 l0 -110 375 0 375 0 0 110 0 110 -375 0 -375 0 0 -110z" />
      <path
        d="M3490 2545 c-230 -51 -431 -249 -485 -477 -50 -215 15 -438 175 -598
    198 -198 472 -243 730 -119 118 56 231 170 288 290 50 106 66 171 66 279 0
    108 -16 173 -66 279 -32 67 -56 100 -121 166 -90 90 -144 124 -257 162 -94 32
    -235 39 -330 18z m286 -226 c111 -42 194 -121 245 -234 20 -42 23 -67 24 -165
    0 -110 -1 -118 -33 -182 -128 -261 -467 -326 -676 -128 -247 234 -134 651 197
    725 75 17 171 11 243 -16z"
      />
      <path d="M1490 2135 l0 -105 375 0 375 0 0 105 0 105 -375 0 -375 0 0 -105z" />
      <path d="M1490 1385 l0 -105 375 0 375 0 0 105 0 105 -375 0 -375 0 0 -105z" />
      <path
        d="M3115 1060 c-211 -32 -391 -160 -484 -344 -57 -113 -71 -195 -71
    -418 l0 -198 105 0 105 0 0 169 c0 92 5 192 10 222 22 117 101 236 197 297 98
    62 107 63 669 60 l509 -3 68 -32 c123 -58 218 -172 246 -294 6 -24 11 -126 11
    -226 l0 -183 105 0 105 0 0 203 c0 231 -8 277 -70 402 -89 181 -255 304 -460
    341 -56 10 -190 13 -535 12 -253 0 -482 -4 -510 -8z"
      />
    </g>
  </svg>
  <svg
    v-else-if="name === 'Dashboard'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    viewBox="0 0 512 512"
    fill="currentColor"
  >
    <g transform="translate(0,512) scale(0.1,-0.1)" stroke="none">
      <path
        d="M430 4946 c-135 -37 -229 -133 -260 -268 -13 -59 -13 -3217 0 -3276
    26 -111 94 -195 200 -246 l65 -31 822 -3 823 -3 0 -319 0 -320 -493 0 c-491 0
    -493 0 -537 -22 -48 -25 -90 -89 -90 -138 0 -49 42 -113 90 -137 l44 -23 1466
    0 1466 0 44 23 c48 24 90 88 90 137 0 49 -42 113 -90 138 -44 22 -46 22 -537
    22 l-493 0 0 320 0 320 798 0 c887 0 871 -1 969 66 28 20 67 59 87 87 71 105
    66 -15 66 1767 0 1782 5 1662 -66 1767 -20 28 -59 67 -87 87 -106 71 68 66
    -2246 65 -1626 0 -2096 -3 -2131 -13z m4205 -1906 l0 -1595 -2075 0 -2075 0
    -3 1585 c-1 872 0 1591 3 1598 3 10 424 12 2077 10 l2073 -3 0 -1595z m-1915
    -2240 l0 -320 -160 0 -160 0 0 320 0 320 160 0 160 0 0 -320z"
      />
      <path
        d="M2274 4196 c-27 -13 -67 -43 -87 -67 -70 -81 -67 -37 -67 -1096 l0
    -953 -65 0 -65 0 0 493 0 493 -26 52 c-14 29 -42 65 -62 82 -65 54 -102 60
    -351 60 -217 0 -228 -1 -276 -24 -60 -29 -107 -76 -134 -136 -20 -43 -21 -64
    -21 -532 l0 -488 -93 0 c-119 0 -171 -23 -205 -90 -28 -56 -28 -84 1 -140 16
    -33 34 -51 67 -67 l44 -23 1626 0 1626 0 44 23 c48 24 90 88 90 137 0 14 -10
    46 -22 70 -34 67 -86 90 -205 90 l-93 0 0 713 c0 794 1 777 -67 856 -20 24
    -60 54 -87 67 -49 23 -60 24 -286 24 -226 0 -237 -1 -286 -24 -27 -13 -67 -43
    -87 -67 -68 -79 -67 -62 -67 -856 l0 -713 -60 0 -60 0 0 953 c0 1059 3 1015
    -67 1096 -20 24 -60 54 -87 67 -49 23 -60 24 -286 24 -226 0 -237 -1 -286 -24z
    m406 -1201 l0 -915 -120 0 -120 0 0 915 0 915 120 0 120 0 0 -915z m1000 -240
    l0 -675 -120 0 -120 0 0 675 0 675 120 0 120 0 0 -675z m-2002 -242 l2 -433
    -125 0 -125 0 0 428 c0 236 3 432 7 436 4 3 59 5 122 4 l116 -3 3 -432z"
      />
    </g>
  </svg>
  <svg
    v-else-if="name === 'reporte'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    viewBox="0 0 512 512"
    fill="currentColor"
    stroke="currentColor"
    stroke-width="10"
    stroke-linecap="round"
    stroke-linejoin="round"
    paint-order="stroke fill"
  >
    <path
      d="M360.5 11Q369.4 10.6 372 16.5Q374.5 22 373 31.5L374.5 33H377.5L386 41.5L435 100.5L437 107H450.5L456 110Q458.9 112.9 458 120.5L453.5 126Q447.6 129.7 437 128V471.5L432.5 478L426.5 480H85.5L79.5 478L77 475.5L75 471.5V40.5L79.5 34L85.5 32H352Q350.1 18.9 356.5 13L360.5 11ZM96 53V459H416V128H363L355 125L352 118V54V53H96ZM374 59L373 107H413L374 59Z"
    />
    <path
      d="M146.5 102H259.5L265 106.5L266 115.5L261.5 121L259.5 122H146.5L142 120L139 114.5V109.5L142 104L146.5 102Z"
    />
    <path
      d="M146.5 150H365.5L370 152L373 157.5V162.5L370 168L365.5 170H146.5L142 168L139 162.5V157.5L142 152L146.5 150Z"
    />
    <path
      d="M309.5 224H362.5L368.5 226L371 228.5L373 232.5V375.5L368.5 382L362.5 384H149.5L143.5 382L141 379.5L139 375.5V328.5L143.5 322L149.5 320H192V277.5L194 271.5L196.5 269L200.5 267H258.5L264 270L266 274.5V288H299V232.5L303.5 226L309.5 224ZM320 245V363H321H352V246V245H320ZM213 288V363H246V288H213ZM266 309V363H299V309H266ZM160 341V363H192V341H160Z"
    />
    <path
      d="M138.5 400H373.5L381 403L384 410.5L382 416.5L379.5 419L375.5 421H136.5L130 416.5L128 410.5L131 403L138.5 400Z"
    />
  </svg>

  <!-- Mapa estándar -->
  <svg
    v-else-if="name === 'mapa'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4.75 6.75 9 5.25l6 2.5 4.25-1.5v11L15 18.75l-6-2.5-4.25 1.5v-11Z"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5.25v11M15 7.75v11" />
  </svg>

  <!-- Satelital -->
  <svg
    v-else-if="name === 'satelital'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M8.25 15.75 6.25 17.75M15.75 8.25l2-2"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75 17.25 15.75" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 10.5 13.5 17.25" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25 15.75 15" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 20c2.25-2.25 5.75-2.25 8 0" />
  </svg>

  <!-- Claro -->
  <svg
    v-else-if="name === 'claro'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <circle cx="12" cy="12" r="4" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 3.75v1.5M12 18.75v1.5M4.75 12h1.5M17.75 12h1.5"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6.85 6.85 7.9 7.9M16.1 16.1l1.05 1.05M17.15 6.85 16.1 7.9M7.9 16.1l-1.05 1.05"
    />
  </svg>

  <!-- Urbano -->
  <svg
    v-else-if="name === 'urbano'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path stroke-linecap="round" stroke-linejoin="round" d="M5.75 19.25V8.75h5v10.5" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M13.25 19.25V5.75h5v13.5" />
    <path stroke-linecap="round" stroke-linejoin="round" d="M4.75 19.25h14.5" />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M7.5 11h1.25M7.5 14h1.25M15 8h1.25M15 11h1.25M15 14h1.25"
    />
  </svg>

  <!-- Simple -->
  <svg
    v-else-if="name === 'simple'"
    xmlns="http://www.w3.org/2000/svg"
    class="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 20.25s6.25-4.3 6.25-10.25a6.25 6.25 0 0 0-12.5 0C5.75 15.95 12 20.25 12 20.25Z"
    />
    <circle cx="12" cy="10" r="2.25" />
  </svg>
</template>

<script>
export default {
  name: "SvgIcon",
  props: {
    name: {
      type: String,
      required: true,
    },
  },
}
</script>
